import "server-only";
import { hash, verify } from "@node-rs/argon2";
import { db } from "@/lib/db";
import { isWeakPin } from "@/components/ui/PinInput";

// Transaction PIN (PRD 7.1): 4 digits, 3 tries then a 30-minute lock; weak PINs blocked.
// Hashed separately from the password and never logged or returned (PRD 9).
export const PIN_TRIES = 3;
export const PIN_LOCK_MS = 30 * 60_000;

export function pinProblem(pin: string) {
  if (!/^\d{4}$/.test(pin)) return "Your PIN must be 4 digits.";
  if (isWeakPin(pin)) return "Choose a less predictable PIN (avoid 0000, 1234 or repeated digits).";
  return null;
}

export async function setPin(instructorId: string, pin: string) {
  const pinHash = await hash(pin, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
  await db.transactionPin.upsert({ where: { instructorId }, update: { pinHash, failedAttempts: 0, lockedUntil: null }, create: { instructorId, pinHash } });
}

export type PinCheck = { ok: true } | { ok: false; code: "NO_PIN" | "PIN_LOCKED" | "WRONG_PIN"; triesLeft?: number; lockedUntil?: Date };

export async function checkPin(instructorId: string, pin: string): Promise<PinCheck> {
  const row = await db.transactionPin.findUnique({ where: { instructorId } });
  if (!row) return { ok: false, code: "NO_PIN" };
  if (row.lockedUntil && row.lockedUntil > new Date()) return { ok: false, code: "PIN_LOCKED", lockedUntil: row.lockedUntil, triesLeft: 0 };
  let good = false;
  try {
    good = await verify(row.pinHash, pin);
  } catch {}
  if (good) {
    if (row.failedAttempts) await db.transactionPin.update({ where: { instructorId }, data: { failedAttempts: 0, lockedUntil: null } });
    return { ok: true };
  }
  const fails = (row.lockedUntil && row.lockedUntil <= new Date() ? 0 : row.failedAttempts) + 1;
  const lock = fails >= PIN_TRIES ? new Date(Date.now() + PIN_LOCK_MS) : null;
  await db.transactionPin.update({ where: { instructorId }, data: { failedAttempts: lock ? 0 : fails, lockedUntil: lock } });
  return lock ? { ok: false, code: "PIN_LOCKED", lockedUntil: lock, triesLeft: 0 } : { ok: false, code: "WRONG_PIN", triesLeft: PIN_TRIES - fails };
}
