import { z } from "zod";
import { db } from "@/lib/db";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { roleParam, toDbRole } from "@/lib/auth/schemas";
import { sendVerification } from "@/lib/auth/verify";

// Resend is limited to once per 60 s per address (LRN-ONB-02). Same answer whether or not it exists.
const schema = z.object({ email: z.string().trim().toLowerCase().email(), role: roleParam });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return invalid(parsed.error);
  const { email, role } = parsed.data;
  if (!rateLimit(`verify-resend:${role}:${email}`, 1, 60_000).ok) {
    return fail(429, "RATE_LIMITED", "Please wait a minute before requesting another link.");
  }
  const user = await db.user.findUnique({ where: { email_role: { email, role: toDbRole(role) } } });
  if (user && !user.emailVerifiedAt && !user.deletedAt) await sendVerification(user);
  return ok({ ok: true });
}
