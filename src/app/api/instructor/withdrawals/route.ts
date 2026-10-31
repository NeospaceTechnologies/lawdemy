import { z } from "zod";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { requireUser } from "@/lib/auth/guard";
import { checkPin } from "@/lib/pin";
import { startWithdrawal } from "@/lib/withdrawals";

const schema = z.object({ bankAccountId: z.string().min(1), amountKobo: z.number().int().positive(), pin: z.string().regex(/^\d{4}$/, "Enter your 4-digit PIN.") });

// Withdraw Earnings (INS-PAY-06/07): PIN, validation, ledger debit, transfer.
export async function POST(req: Request) {
  const { user, error } = await requireUser("INSTRUCTOR");
  if (error) return error;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  if (!rateLimit(`withdraw:${user.id}`, 10, 60 * 60_000).ok) return fail(429, "RATE_LIMITED", "Too many attempts. Please wait.");
  const pin = await checkPin(user.id, p.data.pin);
  if (!pin.ok) {
    if (pin.code === "NO_PIN") return fail(409, "NO_PIN", "Create a transaction PIN first.");
    if (pin.code === "PIN_LOCKED") return fail(423, "PIN_LOCKED", "Too many attempts. Reset your PIN to continue.", { triesLeft: "0" });
    return fail(422, "WRONG_PIN", `Incorrect PIN. ${pin.triesLeft} ${pin.triesLeft === 1 ? "try" : "tries"} left.`, { triesLeft: String(pin.triesLeft) });
  }
  const r = await startWithdrawal(user, p.data.bankAccountId, p.data.amountKobo);
  if (r.error !== undefined) return fail(422, "NOT_ALLOWED", r.error);
  const w = r.withdrawal;
  return ok({ id: w.id, reference: w.reference, status: w.status, failureReason: w.failureReason, amountKobo: w.amountKobo, feeKobo: w.feeKobo, bank: `${w.bankAccount.bankName} (****${w.bankAccount.accountNumberLast4})`, accountName: w.bankAccount.accountName });
}
