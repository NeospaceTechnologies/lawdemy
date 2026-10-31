import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { burnPasswordCheck, verifyPassword } from "@/lib/auth/hash";
import { lockedUntil, recordAttempt } from "@/lib/auth/lockout";
import { clientInfo, createSession } from "@/lib/auth/session";
import { signInSchema, toDbSignInRole } from "@/lib/auth/schemas";

// Staff go through the second factor before the console (PRD 9: admin actions need 2FA).
const HOME = { LEARNER: "/dashboard", INSTRUCTOR: "/instructor/dashboard", ADMIN: "/admin/2fa" } as const;

function lockedResponse(until: Date) {
  const minutes = Math.max(1, Math.ceil((until.getTime() - Date.now()) / 60_000));
  return fail(
    423,
    "LOCKED",
    `Too many failed attempts. Sign-in is locked for ${minutes} minute${minutes === 1 ? "" : "s"}. You can reset your password instead.`,
  );
}

export async function POST(req: Request) {
  const parsed = signInSchema.safeParse(await readJson(req));
  if (!parsed.success) return invalid(parsed.error);
  const { email, password } = parsed.data;
  const role = toDbSignInRole(parsed.data.role);
  const { ip } = await clientInfo();

  const limit = rateLimit(`sign-in:${ip}`, 30, 60_000);
  if (!limit.ok) return fail(429, "RATE_LIMITED", "Too many requests. Please wait a moment and try again.");

  const lock = await lockedUntil(email, role);
  if (lock) return lockedResponse(lock);

  const user = await db.user.findUnique({ where: { email_role: { email, role } } });
  const usable = user && !user.deletedAt && user.status !== "DELETED";
  const valid = usable ? await verifyPassword(user.passwordHash, password) : (await burnPasswordCheck(password), false);

  if (!valid || !user) {
    await recordAttempt(email, role, false, ip);
    await audit({ actorId: user?.id ?? null, action: "sign_in_failed", targetType: "user", targetId: user?.id, ip });
    const nowLocked = await lockedUntil(email, role);
    if (nowLocked) return lockedResponse(nowLocked);
    // Never say which of the two was wrong (PRD 4.2 acceptance criteria).
    return fail(401, "INVALID_CREDENTIALS", "Incorrect email or password");
  }

  if (user.status === "LOCKED") {
    return fail(423, "ACCOUNT_LOCKED", "Your account has been locked. Please contact support.");
  }
  if (!user.emailVerifiedAt) {
    return fail(403, "EMAIL_UNVERIFIED", "Please verify your email address. Check your inbox for the verification link.");
  }

  await recordAttempt(email, role, true, ip);
  await createSession(user);
  await audit({ actorId: user.id, action: "sign_in", targetType: "user", targetId: user.id, ip });
  return ok({ redirectTo: HOME[role] });
}
