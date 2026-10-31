import "server-only";
import { db } from "@/lib/db";
import { LIVE } from "@/lib/catalog";

/** A Live course the learner doesn't already own, or a reason why not. */
export async function purchasable(courseId: string, learnerId: string) {
  const course = await db.course.findFirst({ where: { AND: [LIVE, { id: courseId }] }, select: { id: true, access: true, priceKobo: true, instructorId: true, title: true } });
  if (!course) return { error: "This course isn’t available." as const };
  const owned = await db.enrollment.count({ where: { courseId, learnerId } });
  if (owned) return { error: "You’re already enrolled in this course." as const };
  return { course };
}
