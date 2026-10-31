import { db } from "@/lib/db";
import { ok } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";

export async function POST(_req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const { user, error } = await requireUser("LEARNER");
  if (error) return error;
  const courseId = (await params).courseId;
  await db.$transaction([
    db.cartItem.deleteMany({ where: { learnerId: user.id, courseId } }),
    db.wishlistItem.upsert({ where: { learnerId_courseId: { learnerId: user.id, courseId } }, update: {}, create: { learnerId: user.id, courseId } }),
  ]);
  return ok({ count: await db.cartItem.count({ where: { learnerId: user.id } }) });
}
