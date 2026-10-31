import "server-only";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { BUSINESS } from "@/lib/config";
import { encrypt } from "@/lib/crypto";
import { mailer } from "@/lib/email";
import { payments } from "@/lib/payments";

export type BankAccountView = { id: string; bankName: string; bankCode: string; last4: string; accountName: string; isDefault: boolean; usableFrom: string | null };

export function viewAccount(a: { id: string; bankName: string; bankCode: string; accountNumberLast4: string; accountName: string; isDefault: boolean; verifiedAt: Date }): BankAccountView {
  const usable = new Date(a.verifiedAt.getTime() + BUSINESS.bankChangeHoldMs);
  return { id: a.id, bankName: a.bankName, bankCode: a.bankCode, last4: a.accountNumberLast4, accountName: a.accountName, isDefault: a.isDefault, usableFrom: usable > new Date() ? usable.toISOString() : null };
}

export async function listAccounts(instructorId: string) {
  const rows = await db.bankAccount.findMany({ where: { instructorId, deletedAt: null }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] });
  return rows.map(viewAccount);
}

/** Verifies with the provider and stores an account. New accounts are on a 24 h withdrawal hold. */
export async function addAccount(user: { id: string; email: string; firstName: string }, accountNumber: string, bankCode: string, opts: { makeDefault?: boolean; replaceId?: string; ip?: string | null } = {}) {
  const provider = payments();
  const banks = await provider.listBanks();
  const bank = banks.find((b) => b.code === bankCode);
  if (!bank) return { error: "Choose a bank from the list." as const };
  const name = await provider.resolveAccount(accountNumber, bankCode);
  if (!name) return { error: "We couldn’t verify this account. Check the number and bank." as const };
  const existing = await db.bankAccount.count({ where: { instructorId: user.id, deletedAt: null } });
  const makeDefault = opts.makeDefault || existing === 0 || !!opts.replaceId;
  const account = await db.$transaction(async (tx) => {
    if (opts.replaceId) await tx.bankAccount.updateMany({ where: { id: opts.replaceId, instructorId: user.id }, data: { deletedAt: new Date(), isDefault: false } });
    if (makeDefault) await tx.bankAccount.updateMany({ where: { instructorId: user.id }, data: { isDefault: false } });
    const a = await tx.bankAccount.create({
      data: { instructorId: user.id, bankCode, bankName: bank.name, accountNumberLast4: accountNumber.slice(-4), accountNumberEncrypted: encrypt(accountNumber), accountName: name, isDefault: makeDefault, verifiedAt: new Date() },
    });
    await audit({ actorId: user.id, action: opts.replaceId ? "bank_changed" : "bank_added", targetType: "bank_account", targetId: a.id, after: { bank: bank.name, last4: a.accountNumberLast4 }, ip: opts.ip ?? null }, tx);
    return a;
  });
  // Bank changes trigger an email alert (PRD 9, payout protection).
  await mailer().send({
    to: user.email,
    subject: "A bank account was added to your Lawdemy payouts",
    text: `Hi ${user.firstName},\n\n${bank.name} ••••${account.accountNumberLast4} (${name}) was ${opts.replaceId ? "set as your payout account" : "added to your payout accounts"}. For your security, withdrawals to it are available after 24 hours.\n\nIf this wasn't you, contact support immediately.`,
  });
  return { account: viewAccount(account) };
}
