import { z } from "zod";
import { db } from "@/lib/db";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { requireUser } from "@/lib/auth/guard";
import { verifyPassword } from "@/lib/auth/hash";
import { clientInfo } from "@/lib/auth/session";
import { addAccount } from "@/lib/banking";

const schema = z.object({ password: z.string().min(1), accountNumber: z.string().regex(/^\d{10}$/), bankCode: z.string().min(1) });

// Edit Bank Details: re-confirm the password, verify the new account, replace the default (INS-PAY-10).
export async function POST(req: Request) {
  const { user, error } = await requireUser("INSTRUCTOR");
  if (error) return error;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  if (!rateLimit(`bank-replace:${user.id}`, 5, 60 * 60_000).ok) return fail(429, "RATE_LIMITED", "Too many attempts. Please wait.");
  if (!(await verifyPassword(user.passwordHash, p.data.password))) return fail(422, "WRONG_PASSWORD", "The password you entered is incorrect.");
  const current = await db.bankAccount.findFirst({ where: { instructorId: user.id, deletedAt: null, isDefault: true } });
  const { ip } = await clientInfo();
  const r = await addAccount(user, p.data.accountNumber, p.data.bankCode, { replaceId: current?.id, ip });
  if ("error" in r) return fail(422, "NOT_VERIFIED", r.error!);
  return ok({ account: r.account });
}
