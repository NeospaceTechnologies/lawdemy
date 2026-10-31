import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// In-app notifications (LRN-DASH, INS-DASH-03). Types drive the icon in the panel.
export type NotificationType =
  | "course_update" | "quiz_pending" | "qa_reply" | "new_question" | "enrollment"
  | "review_approved" | "review_rejected" | "payout_success" | "payout_failed"
  | "certificate" | "community_reply" | "announcement" | "purchase" | "moderation";

export const PREF_KEYS = ["courseUpdates", "qaReplies", "communityReplies", "enrolments"] as const;
export type PrefKey = (typeof PREF_KEYS)[number];
export type NotificationPrefs = Partial<Record<PrefKey, boolean>>;

// Types not listed (purchases, payouts, review outcomes) are always sent.
const PREF_FOR: Partial<Record<NotificationType, PrefKey>> = {
  course_update: "courseUpdates",
  announcement: "courseUpdates",
  quiz_pending: "courseUpdates",
  qa_reply: "qaReplies",
  new_question: "qaReplies",
  community_reply: "communityReplies",
  enrollment: "enrolments",
};

function wants(prefs: unknown, type: NotificationType) {
  const key = PREF_FOR[type];
  if (!key || !prefs || typeof prefs !== "object") return true;
  return (prefs as NotificationPrefs)[key] !== false;
}

export async function notify(
  userId: string,
  n: { type: NotificationType; title: string; body: string; link?: string },
  tx: Prisma.TransactionClient = db,
) {
  const u = await tx.user.findUnique({ where: { id: userId }, select: { notificationPrefs: true, deletedAt: true } });
  if (!u || u.deletedAt || !wants(u.notificationPrefs, n.type)) return;
  await tx.notification.create({ data: { userId, ...n } });
}

export async function notifyMany(userIds: string[], n: { type: NotificationType; title: string; body: string; link?: string }) {
  if (!userIds.length) return;
  const users = await db.user.findMany({ where: { id: { in: userIds }, deletedAt: null }, select: { id: true, notificationPrefs: true } });
  const to = users.filter((u) => wants(u.notificationPrefs, n.type));
  if (to.length) await db.notification.createMany({ data: to.map((u) => ({ userId: u.id, ...n })) });
}
