import { z } from "zod";
import { db } from "@/lib/db";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";
import { activeEnrollment } from "@/lib/learning";

const schema = z.object({ courseId: z.string().min(1), stars: z.number().int().min(1, "Choose 1 to 5 stars.").max(5, "Choose 1 to 5 stars.") });

// Course rating (PRD 4.4 shows ratings on courses; INS-DASH shows the average to instructors).
// Only enrolled learners can rate, one rating each, which they can change.
export async function PUT(req: Request) {
  const { user, error } = await requireUser("LEARNER");
  if (error) return error;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  const { courseId, stars } = p.data;
  if (!(await activeEnrollment(courseId, user.id))) return fail(403, "NOT_ENROLLED", "Enrol in this course to rate it.");
  await db.courseRating.upsert({
    where: { courseId_learnerId: { courseId, learnerId: user.id } },
    update: { stars },
    create: { courseId, learnerId: user.id, stars },
  });
  const agg = await db.courseRating.aggregate({ where: { courseId }, _avg: { stars: true }, _count: true });
  return ok({ stars, avg: agg._avg.stars ?? stars, count: agg._count });
}
