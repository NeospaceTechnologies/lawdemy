import "server-only";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";

// 5 failed sign-ins within 15 minutes lock sign-in for 15 minutes (PRD 4.2 / 7.1).
export const MAX_FAILURES = 5;
export const WINDOW_MS = 15 * 60_000;
export const LOCK_MS = 15 * 60_000;

/** Returns the time the lock lifts, or null if sign-in is allowed. */
export async function lockedUntil(email: string, role: Role): Promise<Date | null> {
  const since = new Date(Date.now() - WINDOW_MS - LOCK_MS);
  const attempts = await db.loginAttempt.findMany({
    where: { email, role, createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
    select: { success: true, createdAt: true },
  });
  return computeLock(attempts, Date.now());
}

/**
 * Pure lock calculation so it can be unit tested. A success resets the count.
 * The lock starts at the 5th failure inside a 15-minute window.
 */
export function computeLock(attempts: { success: boolean; createdAt: Date }[], now: number): Date | null {
  let failures: number[] = [];
  for (const a of attempts) {
    if (a.success) {
      failures = [];
      continue;
    }
    const t = a.createdAt.getTime();
    failures = failures.filter((f) => t - f < WINDOW_MS);
    failures.push(t);
    if (failures.length >= MAX_FAILURES) {
      const until = t + LOCK_MS;
      if (until > now) return new Date(until);
      failures = [];
    }
  }
  return null;
}

export async function recordAttempt(email: string, role: Role, success: boolean, ip: string | null) {
  await db.loginAttempt.create({ data: { email, role, success, ip } });
}
