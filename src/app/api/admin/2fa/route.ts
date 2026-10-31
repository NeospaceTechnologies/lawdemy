import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { decrypt } from "@/lib/crypto";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { getCurrentSession, markSessionMfa } from "@/lib/auth/session";
import { verifyTotp } from "@/lib/auth/totp";

const schema = z.object({ code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code.") });

// Second factor for staff (PRD 9). The first valid code also turns 2FA on for the account.
export async function POST(req: Request) {
  const session = await getCurrentSession("ADMIN");
  if (!session) return fail(401, "UNAUTHENTICATED", "Please sign in again.");
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  if (!rateLimit(`totp:${session.userId}`, 5, 5 * 60_000).ok) return fail(429, "RATE_LIMITED", "Too many attempts. Wait 5 minutes and try again.");
  const { user } = session;
  if (!user.totpSecretEnc) return fail(409, "NO_SECRET", "Reload this page to set up your authenticator.");
  if (!verifyTotp(decrypt(user.totpSecretEnc), p.data.code)) {
    await audit({ actorId: user.id, action: "staff_2fa_failed", targetType: "user", targetId: user.id });
    return fail(422, "BAD_CODE", "That code didn’t match. Check the time on your phone and try the newest code.");
  }
  if (!user.totpEnabledAt) {
    await db.user.update({ where: { id: user.id }, data: { totpEnabledAt: new Date() } });
    await audit({ actorId: user.id, action: "staff_2fa_enabled", targetType: "user", targetId: user.id });
  }
  await markSessionMfa(session.id);
  return ok({ redirectTo: "/admin" });
}
