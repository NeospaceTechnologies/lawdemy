import "server-only";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { mailer } from "@/lib/email";
import { formatNaira } from "@/lib/format";
import { notify } from "@/lib/notify";

// Instructor earnings are an append-only ledger (WalletTransaction); balances
// are always derived from it, never stored (PRD 9).
//   credit: ENROLLMENT (pending → available after the holding period), BONUS (available)
//   debit:  WITHDRAWAL (negative; pending → successful | failed — failed returns the funds)
//           REFUND (negative; reverses an enrolment earning. Pending while that earning is
//           still pending, so it matures with it.)

/** Moves matured enrolment earnings from Pending to Available. */
export async function releaseMatured(instructorId: string) {
  await db.walletTransaction.updateMany({
    where: { instructorId, type: { in: ["ENROLLMENT", "REFUND"] }, status: "PENDING", availableAt: { lte: new Date() } },
    data: { status: "AVAILABLE" },
  });
}

export async function balances(instructorId: string) {
  await releaseMatured(instructorId);
  const rows = await db.walletTransaction.groupBy({ by: ["type", "status"], where: { instructorId }, _sum: { amountKobo: true } });
  const sum = (pred: (r: (typeof rows)[number]) => boolean) => rows.filter(pred).reduce((a, r) => a + (r._sum.amountKobo ?? 0), 0);
  const total = sum((r) => (r.type === "ENROLLMENT" || r.type === "BONUS") && r.status !== "FAILED");
  const pending = sum((r) => (r.type === "ENROLLMENT" || r.type === "REFUND") && r.status === "PENDING");
  const credits = sum((r) => (r.type === "ENROLLMENT" || r.type === "BONUS") && r.status === "AVAILABLE");
  const debits = sum((r) => r.type === "WITHDRAWAL" && (r.status === "PENDING" || r.status === "SUCCESSFUL"));
  const refunds = sum((r) => r.type === "REFUND" && r.status === "AVAILABLE");
  const pendingRefunds = sum((r) => r.type === "REFUND" && r.status === "PENDING");
  const last = await db.withdrawal.findFirst({ where: { instructorId, status: "SUCCESSFUL" }, orderBy: { completedAt: "desc" } });
  return {
    totalKobo: total + refunds + pendingRefunds,
    pendingKobo: pending,
    availableKobo: Math.max(0, credits + debits + refunds),
    lastWithdrawal: last ? { amountKobo: last.amountKobo, at: last.completedAt ?? last.requestedAt } : null,
  };
}

/** Applies a transfer outcome exactly once. Failed transfers return funds to Available (PRD 6.4). */
export async function settleWithdrawal(reference: string, outcome: "successful" | "failed", failureReason?: string) {
  const w = await db.withdrawal.findUnique({ where: { reference }, include: { bankAccount: true } });
  if (!w || (w.status !== "PENDING" && w.status !== "AWAITING_APPROVAL")) return w;
  const status = outcome === "successful" ? "SUCCESSFUL" : "FAILED";
  const updated = await db.$transaction(async (tx) => {
    const res = await tx.withdrawal.updateMany({ where: { id: w.id, status: { in: ["PENDING", "AWAITING_APPROVAL"] } }, data: { status, completedAt: new Date(), failureReason: outcome === "failed" ? (failureReason ?? "Transfer failed") : null } });
    if (res.count === 0) return null;
    await tx.walletTransaction.updateMany({ where: { withdrawalId: w.id }, data: { status } });
    await audit({ actorId: null, action: `withdrawal_${outcome}`, targetType: "withdrawal", targetId: w.id }, tx);
    await notify(
      w.instructorId,
      outcome === "successful"
        ? { type: "payout_success", title: "Withdrawal successful", body: `${formatNaira(w.amountKobo)} was sent to ${w.bankAccount.bankName} ••••${w.bankAccount.accountNumberLast4}.`, link: "/instructor/earnings" }
        : { type: "payout_failed", title: "Withdrawal failed", body: `Your ${formatNaira(w.amountKobo)} withdrawal failed and the funds are back in your balance.`, link: "/instructor/earnings" },
      tx,
    );
    return true;
  });
  if (updated && outcome === "successful") {
    // Receipt email (INS-PAY-06 acceptance criteria).
    const owner = await db.user.findUnique({ where: { id: w.instructorId }, select: { email: true, firstName: true } });
    if (owner) {
      await mailer().send({
        to: owner.email,
        subject: `Withdrawal receipt ${w.reference}`,
        text: `Hi ${owner.firstName},

Your withdrawal was successful.
Amount: ${formatNaira(w.amountKobo)}
Charge: ${formatNaira(w.feeKobo)}
Total debit: ${formatNaira(w.amountKobo + w.feeKobo)}
Bank: ${w.bankAccount.bankName} ••••${w.bankAccount.accountNumberLast4}
Reference: ${w.reference}
`,
      });
    }
  }
  return updated ? db.withdrawal.findUnique({ where: { id: w.id } }) : w;
}
