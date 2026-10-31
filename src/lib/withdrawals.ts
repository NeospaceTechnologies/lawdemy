import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { BUSINESS } from "@/lib/config";
import { decrypt } from "@/lib/crypto";
import { formatNaira } from "@/lib/format";
import { newReference, payments } from "@/lib/payments";
import { balances, settleWithdrawal } from "@/lib/wallet";

export function withdrawalProblem(amountKobo: number, availableKobo: number) {
  if (amountKobo < BUSINESS.minWithdrawalKobo) return `Minimum withdrawal is ${formatNaira(BUSINESS.minWithdrawalKobo).replace(/\.00$/, "")}`;
  if (amountKobo > availableKobo) return "Amount exceeds your available balance";
  if (amountKobo + BUSINESS.withdrawalFeeKobo > availableKobo) return `Amount plus the ${formatNaira(BUSINESS.withdrawalFeeKobo).replace(/\.00$/, "")} charge exceeds your available balance`;
  return null;
}

/**
 * Creates the withdrawal and its ledger debit atomically (balance re-checked
 * under a per-instructor advisory lock), then starts the transfer.
 */
type WithdrawalWithBank = Prisma.WithdrawalGetPayload<{ include: { bankAccount: true } }>;

export async function startWithdrawal(
  instructor: { id: string; email: string; firstName: string },
  bankAccountId: string,
  amountKobo: number,
): Promise<{ error: string; withdrawal?: undefined } | { error?: undefined; withdrawal: WithdrawalWithBank }> {
  const owner = await db.user.findUnique({ where: { id: instructor.id }, select: { walletFrozenAt: true } });
  if (owner?.walletFrozenAt) return { error: "Withdrawals are paused on your account. Contact support for help." };
  const account = await db.bankAccount.findFirst({ where: { id: bankAccountId, instructorId: instructor.id, deletedAt: null } });
  if (!account) return { error: "Choose a saved bank account." };
  if (account.verifiedAt.getTime() + BUSINESS.bankChangeHoldMs > Date.now()) {
    return { error: "This bank account was added recently. For your security, withdrawals to it open 24 hours after it was added." };
  }
  const fee = BUSINESS.withdrawalFeeKobo;
  const reference = newReference("WDR");
  const created = await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${instructor.id}))`;
    const b = await balances(instructor.id);
    const problem = withdrawalProblem(amountKobo, b.availableKobo);
    if (problem) return { error: problem, withdrawal: undefined };
    const needsApproval = amountKobo > BUSINESS.withdrawalApprovalKobo;
    const w = await tx.withdrawal.create({ data: { instructorId: instructor.id, bankAccountId: account.id, reference, amountKobo, feeKobo: fee, status: needsApproval ? "AWAITING_APPROVAL" : "PENDING" } });
    await tx.walletTransaction.create({
      data: { instructorId: instructor.id, type: "WITHDRAWAL", amountKobo: -(amountKobo + fee), status: "PENDING", reference, withdrawalId: w.id, notes: `Withdrawal to ${account.bankName} ••••${account.accountNumberLast4}` },
    });
    await audit({ actorId: instructor.id, action: "withdrawal_requested", targetType: "withdrawal", targetId: w.id, after: { amountKobo, feeKobo: fee } }, tx);
    return { error: undefined, withdrawal: w };
  });
  if (created.error !== undefined || !created.withdrawal) return { error: created.error ?? "Couldn’t start the withdrawal." };

  // Large withdrawals wait for staff (ADM-05); the debit already holds the funds.
  if (created.withdrawal.status === "PENDING") await sendTransfer(created.withdrawal.id);
  const w = await db.withdrawal.findUnique({ where: { id: created.withdrawal.id }, include: { bankAccount: true } });
  return { withdrawal: w! };
}

/** Starts (or restarts) the bank transfer for a PENDING withdrawal and applies a final outcome. */
export async function sendTransfer(withdrawalId: string) {
  const w = await db.withdrawal.findUnique({ where: { id: withdrawalId }, include: { bankAccount: true } });
  if (!w || w.status !== "PENDING") return;
  const a = w.bankAccount;
  let accountNumber: string;
  try {
    accountNumber = decrypt(a.accountNumberEncrypted);
  } catch (err) {
    // Nothing reached the provider, so it's safe to fail and release the funds.
    console.error("withdrawal: bank details unreadable", w.reference, err);
    await settleWithdrawal(w.reference, "failed", "We couldn’t read the saved bank details. Re-add the bank account and try again.");
    return;
  }
  // A provider error here leaves the withdrawal Pending on purpose: the money may have
  // moved. The webhook or reconciliation (stuck > 24 h) settles it.
  const result = await payments().transfer({ reference: w.reference, amountKobo: w.amountKobo, bankCode: a.bankCode, accountNumber, accountName: a.accountName });
  await db.withdrawal.update({ where: { id: w.id }, data: { providerRef: result.providerRef } });
  if (result.status !== "pending") await settleWithdrawal(w.reference, result.status, result.failureReason);
}

