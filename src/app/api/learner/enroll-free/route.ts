import { z } from "zod";
import { db } from "@/lib/db";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { notify } from "@/lib/notify";
import { requireUser } from "@/lib/auth/guard";
import { purchasable } from "@/lib/shop";

// Free courses enrol directly without checkout (LRN-BUY-07).
export async function POST(req: Request) {
  const { user, error } = await requireUser("LEARNER");
  if (error) return error;
  const p = z.object({ courseId: z.string().min(1) }).safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  const r = await purchasable(p.data.courseId, user.id);
  if (r.error) return fail(409, "NOT_PURCHASABLE", r.error);
  if (r.course.access !== "FREE") return fail(409, "PAID_COURSE", "This course needs checkout.");
  await db.enrollment.create({ data: { courseId: r.course.id, learnerId: user.id } });
  await db.wishlistItem.deleteMany({ where: { learnerId: user.id, courseId: r.course.id } });
  await notify(r.course.instructorId, {
    type: "enrollment",
    title: "New enrolment",
    body: `${user.firstName} ${user.lastName} enrolled in ${r.course.title}.`,
    link: `/instructor/courses/${r.course.id}?tab=engagement`,
  });
  return ok({ courseId: r.course.id });
}
