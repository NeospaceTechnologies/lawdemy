import "server-only";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { newToken, sha256 } from "./hash";

// Reset links expire after 1 hour and work once (PRD 4.2).
export const RESET_TTL_MS = 3600_000;

export async function issueResetToken(userId: string) {
  const token = newToken();
  await db.$transaction([
    // A new link replaces any earlier unused one.
    db.passwordResetToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } }),
    db.passwordResetToken.create({
      data: { id: sha256(token), userId, expiresAt: new Date(Date.now() + RESET_TTL_MS) },
    }),
  ]);
  return token;
}

export async function findValidResetToken(token: string, role: Role) {
  if (!token) return null;
  const row = await db.passwordResetToken.findUnique({ where: { id: sha256(token) }, include: { user: true } });
  if (!row || row.usedAt || row.expiresAt < new Date()) return null;
  if (row.user.role !== role || row.user.deletedAt || row.user.status === "DELETED") return null;
  return row;
}

export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  return `${local.slice(0, 3)}****@${domain}`;
}
