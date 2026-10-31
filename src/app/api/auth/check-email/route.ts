import { z } from "zod";
import { db } from "@/lib/db";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { clientInfo } from "@/lib/auth/session";
import { roleParam, toDbRole } from "@/lib/auth/schemas";

// Step 1 of sign-up. The PRD asks to tell people when an email is already
// registered (LRN-ONB acceptance criteria), so this is rate limited per IP.
const schema = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email address."), role: roleParam });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return invalid(parsed.error);
  const { ip } = await clientInfo();
  if (!rateLimit(`check-email:${ip}`, 20, 15 * 60_000).ok) return fail(429, "RATE_LIMITED", "Too many attempts. Please wait a few minutes.");
  const taken = await db.user.findUnique({ where: { email_role: { email: parsed.data.email, role: toDbRole(parsed.data.role) } }, select: { id: true } });
  if (taken) return fail(409, "EMAIL_TAKEN", "An account with this email already exists");
  return ok({ ok: true });
}
