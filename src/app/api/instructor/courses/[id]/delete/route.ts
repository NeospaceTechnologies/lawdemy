import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { fail, ok } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";
import { allowedActions } from "@/lib/course/status-rules";

// Delete permanently: Draft, Rejected, or Archived with no learners (PRD 7.2, INS-MGT-07).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser("INSTRUCTOR");
  if (error) return error;
  const course = await db.course.findFirst({ where: { id: (await params).id, instructorId: user.id, deletedAt: null }, include: { _count: { select: { enrollments: true } } } });
  if (!course) return fail(404, "NOT_FOUND", "Course not found.");
  if (!allowedActions(course.status, course._count.enrollments).includes("delete")) {
    return fail(409, "NOT_ALLOWED", course._count.enrollments ? "Learners are enrolled in this course, so it can’t be deleted." : "This course can’t be deleted in its current status.");
  }
  await db.course.update({ where: { id: course.id }, data: { deletedAt: new Date() } });
  await db.cartItem.deleteMany({ where: { courseId: course.id } });
  await db.wishlistItem.deleteMany({ where: { courseId: course.id } });
  await audit({ actorId: user.id, action: "course_deleted", targetType: "course", targetId: course.id, before: { status: course.status } });
  return ok({ ok: true });
}
