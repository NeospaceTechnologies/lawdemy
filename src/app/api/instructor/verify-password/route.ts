import { z } from "zod";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { requireUser } from "@/lib/auth/guard";
import { verifyPassword } from "@/lib/auth/hash";

// Step check before sensitive changes (edit bank, reset PIN). The final call verifies again.
export async function POST(req: Request) {
  const { user, error } = await requireUser("INSTRUCTOR");
  if (error) return error;
  const p = z.object({ password: z.string().min(1) }).safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  if (!rateLimit(`verify-pw:${user.id}`, 10, 15 * 60_000).ok) return fail(429, "RATE_LIMITED", "Too many attempts. Please wait a few minutes.");
  if (!(await verifyPassword(user.passwordHash, p.data.password))) return fail(422, "WRONG_PASSWORD", "The password you entered is incorrect.");
  return ok({ ok: true });
}
