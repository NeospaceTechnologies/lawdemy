import "server-only";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";
import { appUrl, mailer } from "@/lib/email";
import { newToken, sha256 } from "./hash";

// Verification links expire after 24 h (PRD 4.1).
export const VERIFY_TTL_MS = 24 * 3600_000;

export async function sendVerification(user: Pick<User, "id" | "email" | "firstName" | "role">) {
  const token = newToken();
  await db.$transaction([
    db.emailVerificationToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } }),
    db.emailVerificationToken.create({ data: { id: sha256(token), userId: user.id, expiresAt: new Date(Date.now() + VERIFY_TTL_MS) } }),
  ]);
  // The link hits a route handler so it can sign the person in, then redirects by role.
  const link = appUrl(`/api/auth/verify?token=${encodeURIComponent(token)}`);
  await mailer().send({
    to: user.email,
    subject: "Verify your Lawdemy email",
    text: `Hi ${user.firstName},\n\nConfirm your email to activate your Lawdemy account. The link expires in 24 hours:\n${link}\n`,
  });
}

/** Consumes a verification token. Returns the user, or the expired row's user for a resend, or null. */
export async function consumeVerification(token: string) {
  if (!token) return { status: "invalid" as const };
  const row = await db.emailVerificationToken.findUnique({ where: { id: sha256(token) }, include: { user: true } });
  if (!row) return { status: "invalid" as const };
  if (row.user.emailVerifiedAt && row.usedAt) return { status: "already" as const, user: row.user };
  if (row.usedAt || row.expiresAt < new Date()) return { status: "expired" as const, user: row.user };
  const user = await db.$transaction(async (tx) => {
    await tx.emailVerificationToken.update({ where: { id: row.id }, data: { usedAt: new Date() } });
    return tx.user.update({ where: { id: row.userId }, data: { emailVerifiedAt: row.user.emailVerifiedAt ?? new Date() } });
  });
  return { status: "verified" as const, user };
}
