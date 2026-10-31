import { z } from "zod";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { requireUser } from "@/lib/auth/guard";
import { payments } from "@/lib/payments";

const schema = z.object({ accountNumber: z.string().regex(/^\d{10}$/, "Enter a 10-digit account number."), bankCode: z.string().optional() });

// Bank suggestion and account-name verification (INS-PAY-02). Results come from the provider.
export async function POST(req: Request) {
  const { user, error } = await requireUser("INSTRUCTOR");
  if (error) return error;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  if (!rateLimit(`bank-resolve:${user.id}`, 30, 15 * 60_000).ok) return fail(429, "RATE_LIMITED", "Too many lookups. Please wait a few minutes.");
  const provider = payments();
  if (!p.data.bankCode) return ok({ suggestion: await provider.suggestBank(p.data.accountNumber) });
  return ok({ accountName: await provider.resolveAccount(p.data.accountNumber, p.data.bankCode) });
}
