import { db } from "@/lib/db";
import { ok } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";

export async function GET() {
  const { user, error } = await requireUser("LEARNER");
  if (error) return error;
  const [cart, unread] = await Promise.all([
    db.cartItem.count({ where: { learnerId: user.id } }),
    db.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);
  return ok({ cart, unread });
}
