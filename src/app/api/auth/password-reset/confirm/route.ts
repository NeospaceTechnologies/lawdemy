import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { hashPassword } from "@/lib/auth/hash";
import { checkPassword } from "@/lib/auth/password-rules";
import { findValidResetToken } from "@/lib/auth/reset";
import { clientInfo, destroyAllSessions } from "@/lib/auth/session";
import { resetConfirmSchema, toDbRole } from "@/lib/auth/schemas";

export async function POST(req: Request) {
  const parsed = resetConfirmSchema.safeParse(await readJson(req));
  if (!parsed.success) return invalid(parsed.error);
  const { token, password, role } = parsed.data;

  const check = checkPassword(password, role);
  if (!check.valid) {
    const message = check.common
      ? "This password is too common. Choose a different one."
      : "Password doesn't meet all the requirements.";
    return fail(422, "WEAK_PASSWORD", message, { password: message });
  }

  const row = await findValidResetToken(token, toDbRole(role));
  if (!row) return fail(410, "LINK_EXPIRED", "This reset link has expired or has already been used.");

  const { ip } = await clientInfo();
  const passwordHash = await hashPassword(password);
  // Mark the token used in the same write so a second click can't reuse it.
  const used = await db.passwordResetToken.updateMany({
    where: { id: row.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (used.count === 0) return fail(410, "LINK_EXPIRED", "This reset link has expired or has already been used.");

  await db.user.update({ where: { id: row.userId }, data: { passwordHash } });
  await destroyAllSessions(row.userId);
  await audit({ actorId: row.userId, action: "password_reset", targetType: "user", targetId: row.userId, ip });
  return ok({ ok: true });
}
