import { z } from "zod";
import { db } from "@/lib/db";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";
import { issueIfEligible } from "@/lib/certificates";
import { recomputeProgress, activeEnrollment } from "@/lib/learning";

const schema = z.object({
  lessonId: z.string().min(1),
  positionSeconds: z.number().int().min(0).max(24 * 3600).optional(),
  completed: z.boolean().optional(),
});

// Saves resume position and lesson completion (LRN-LEARN-04/05).
export async function POST(req: Request) {
  const { user, error } = await requireUser("LEARNER");
  if (error) return error;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  const { lessonId, positionSeconds, completed } = p.data;
  const lesson = await db.lesson.findUnique({ where: { id: lessonId }, select: { module: { select: { courseId: true } } } });
  if (!lesson) return fail(404, "NOT_FOUND", "Lesson not found.");
  const enrollment = await activeEnrollment(lesson.module.courseId, user.id);
  if (!enrollment) return fail(403, "NOT_ENROLLED", "Enrol in this course to track progress.");

  const key = { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } };
  const update = {
    ...(positionSeconds !== undefined ? { positionSeconds } : {}),
    ...(completed !== undefined ? { completedAt: completed ? new Date() : null } : {}),
  };
  try {
    await db.lessonProgress.upsert({
      where: key,
      update,
      create: { enrollmentId: enrollment.id, lessonId, positionSeconds: positionSeconds ?? 0, completedAt: completed ? new Date() : null },
    });
  } catch (err) {
    // Two requests for the same lesson can race on the insert; the loser updates instead.
    if ((err as { code?: string }).code !== "P2002") throw err;
    await db.lessonProgress.update({ where: key, data: update });
  }
  await db.enrollment.update({ where: { id: enrollment.id }, data: { currentLessonId: lessonId, lastActiveAt: new Date() } });
  const updated = completed !== undefined ? await recomputeProgress(enrollment.id) : enrollment;
  const cert = completed ? await issueIfEligible(enrollment.id) : null;
  return ok({ progressPct: updated?.progressPct ?? enrollment.progressPct, certificateId: cert?.id ?? null });
}
