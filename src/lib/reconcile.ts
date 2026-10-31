import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { payments } from "@/lib/payments";

// Reconciliation (ADM-06): the provider is the record of money movement, our ledger is the
// record of balances. Compares the two for a period and stores what doesn't match.

export type Mismatch = { kind: string; reference: string; detail: string };

export async function reconcile(periodStart: Date, periodEnd: Date, runById: string | null) {
  const provider = payments();
  const mismatches: Mismatch[] = [];
  let checked = 0;

  // Paid orders: the provider must agree the charge succeeded for the same amount,
  // and every paid item must have produced its instructor earning.
  const orders = await db.order.findMany({
    where: { paidAt: { gte: periodStart, lt: periodEnd } },
    include: { items: { include: { walletTransaction: true } } },
  });
  for (const o of orders) {
    checked += 1;
    const v = await provider.verify(o.reference);
    if (provider.name === "mock" && v.status === "pending" && v.amountKobo === 0) {
      // The mock forgets payments when the dev server restarts; nothing to compare.
    } else if (o.status === "PAID" && v.status !== "paid") {
      mismatches.push({ kind: "charge_status", reference: o.reference, detail: `Ledger says PAID, provider says ${v.status}.` });
    } else if (o.totalKobo > 0 && v.amountKobo !== o.totalKobo) {
      mismatches.push({ kind: "charge_amount", reference: o.reference, detail: `Ledger ${o.totalKobo} kobo, provider ${v.amountKobo} kobo.` });
    }
    for (const it of o.items) {
      if (it.priceKobo > 0 && !it.walletTransaction) mismatches.push({ kind: "missing_earning", reference: o.reference, detail: `Item ${it.id} has no instructor earning in the ledger.` });
      if (it.walletTransaction && it.walletTransaction.amountKobo !== it.instructorShareKobo) {
        mismatches.push({ kind: "earning_amount", reference: o.reference, detail: `Earning ${it.walletTransaction.amountKobo} kobo vs share ${it.instructorShareKobo} kobo.` });
      }
    }
  }

  // Withdrawals: ledger debit must match amount + fee and carry the same status; the
  // provider's transfer status must agree with ours.
  const withdrawals = await db.withdrawal.findMany({
    where: { requestedAt: { gte: periodStart, lt: periodEnd } },
    include: { walletTransaction: true },
  });
  for (const w of withdrawals) {
    checked += 1;
    const t = w.walletTransaction;
    if (!t) mismatches.push({ kind: "missing_debit", reference: w.reference, detail: "Withdrawal has no ledger debit." });
    else {
      if (t.amountKobo !== -(w.amountKobo + w.feeKobo)) mismatches.push({ kind: "debit_amount", reference: w.reference, detail: `Debit ${t.amountKobo} kobo vs ${-(w.amountKobo + w.feeKobo)} expected.` });
      const expected = w.status === "AWAITING_APPROVAL" ? "PENDING" : w.status;
      if (t.status !== expected) mismatches.push({ kind: "debit_status", reference: w.reference, detail: `Ledger ${t.status}, withdrawal ${w.status}.` });
    }
    if (w.status === "SUCCESSFUL" || w.status === "FAILED") {
      const s = await provider.transferStatus(w.reference);
      if (s.status !== "unknown" && s.status.toUpperCase() !== w.status) {
        mismatches.push({ kind: "transfer_status", reference: w.reference, detail: `We recorded ${w.status}, provider says ${s.status}.` });
      }
    }
    if (w.status === "PENDING" && Date.now() - w.requestedAt.getTime() > 24 * 3600_000) {
      mismatches.push({ kind: "stuck_transfer", reference: w.reference, detail: "Pending for more than 24 hours." });
    }
  }

  return db.reconciliationRun.create({
    data: { periodStart, periodEnd, checked, mismatches: mismatches as unknown as Prisma.InputJsonValue, runById },
  });
}

/** Yesterday in West Africa Time (UTC+1), the nightly job's default window. */
export function previousWatDay(now = new Date()) {
  const wat = new Date(now.getTime() + 3600_000);
  const end = new Date(Date.UTC(wat.getUTCFullYear(), wat.getUTCMonth(), wat.getUTCDate()) - 3600_000);
  return { start: new Date(end.getTime() - 24 * 3600_000), end };
}
