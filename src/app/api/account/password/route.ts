import { z } from "zod";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { requireUser } from "@/lib/auth/guard";
import { hashPassword, sha256, verifyPassword } from "@/lib/auth/hash";
import { checkPassword } from "@/lib/auth/password-rules";
import { SESSION_COOKIE } from "@/lib/auth/session";

const schema = z
  .object({ current: z.string().min(1), password: z.string().max(256), confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match." });

// Change password: verify the current one; sign out every other session (PRD 9, LRN-ACC acceptance).
export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  if (!rateLimit(`pw-change:${user.id}`, 5, 15 * 60_000).ok) return fail(429, "RATE_LIMITED", "Too many attempts. Please wait a few minutes.");
  if (!(await verifyPassword(user.passwordHash, p.data.current))) {
    return fail(422, "WRONG_PASSWORD", "The current password you entered is incorrect.", { current: "The current password you entered is incorrect." });
  }
  const check = checkPassword(p.data.password, user.role === "LEARNER" ? "learner" : "instructor");
  if (!check.valid) return fail(422, "WEAK_PASSWORD", check.common ? "This password is too common." : "Password doesn’t meet all the requirements.");
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(p.data.password) } });
  await db.session.deleteMany({ where: { userId: user.id, ...(token ? { id: { not: sha256(token) } } : {}) } });
  await audit({ actorId: user.id, action: "password_changed", targetType: "user", targetId: user.id });
  return ok({ ok: true });
}
