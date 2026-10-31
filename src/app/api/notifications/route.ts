import { db } from "@/lib/db";
import { ok } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  const [items, unread] = await Promise.all([
    db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 30 }),
    db.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);
  return ok({ unread, items });
}

// Mark all as read.
export async function POST() {
  const { user, error } = await requireUser();
  if (error) return error;
  await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  return ok({ ok: true });
}
