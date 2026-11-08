import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import type { Role, User } from "@prisma/client";
import { db } from "@/lib/db";
import { newToken, sha256 } from "./hash";

export const SESSION_COOKIE = "lawdemy_session";

// Sliding expiry per role (PRD 9): learners 30 days, instructors 7 days, admins 12 hours.
const TTL_MS: Record<Role, number> = {
  LEARNER: 30 * 24 * 3600_000,
  INSTRUCTOR: 7 * 24 * 3600_000,
  ADMIN: 12 * 3600_000,
};
// Only push the expiry forward once a minute to avoid a write on every request.
const TOUCH_INTERVAL_MS = 60_000;

export async function clientInfo() {
  const h = await headers();
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null,
    userAgent: h.get("user-agent"),
  };
}

export async function createSession(user: Pick<User, "id" | "role">) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + TTL_MS[user.role]);
  const { ip, userAgent } = await clientInfo();
  await db.session.create({ data: { id: sha256(token), userId: user.id, expiresAt, ip, userAgent } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

// One lookup per render: layouts and pages both ask for the session, so share the result.
// Outside a server-component render (route handlers) React's cache() does not memoise.
const loadSession = cache(async (token: string) => {
  const session = await db.session.findUnique({ where: { id: sha256(token) }, include: { user: true } });
  if (!session || session.expiresAt < new Date()) return null;
  const { user } = session;
  if (user.status !== "ACTIVE" || user.deletedAt) return null;

  if (Date.now() - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    await db.session.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date(), expiresAt: new Date(Date.now() + TTL_MS[user.role]) },
    });
  }
  return session;
});

/** The signed-in session and its user (null when signed out, expired, inactive or the wrong role). */
export async function getCurrentSession(role?: Role) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await loadSession(token);
  if (!session || (role && session.user.role !== role)) return null;
  return session;
}

export async function getCurrentUser(role?: Role) {
  return (await getCurrentSession(role))?.user ?? null;
}

/** Records that this session passed the second factor (staff 2FA). */
export async function markSessionMfa(sessionId: string) {
  await db.session.update({ where: { id: sessionId }, data: { mfaAt: new Date() } });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: sha256(token) } });
  jar.delete(SESSION_COOKIE);
}

// Changing a password signs out every session (PRD 9).
export async function destroyAllSessions(userId: string) {
  await db.session.deleteMany({ where: { userId } });
}
