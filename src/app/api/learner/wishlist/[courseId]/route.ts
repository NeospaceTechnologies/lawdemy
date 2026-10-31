import { db } from "@/lib/db";
import { ok } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";

export async function DELETE(_req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const { user, error } = await requireUser("LEARNER");
  if (error) return error;
  await db.wishlistItem.deleteMany({ where: { learnerId: user.id, courseId: (await params).courseId } });
  return ok({ ok: true });
}
