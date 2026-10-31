import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { fail, ok } from "@/lib/http";
import { clientInfo, getCurrentUser } from "@/lib/auth/session";
import { publishIssues, todayInWAT } from "@/lib/course/rules";
import { isKnown } from "@/lib/taxonomy-store";
import { EDITABLE_STATUSES, findOwnedCourse, toDraft } from "@/lib/course/repository";

type Ctx = { params: Promise<{ id: string }> };

// Publish Course: Draft or Rejected → Under Review (PRD 5.3 INS-CRS-10, 6.7, 7.2).
// The admin review queue reads courses with status UNDER_REVIEW ordered by submittedAt.
export async function POST(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser("INSTRUCTOR");
  if (!user) return fail(401, "UNAUTHENTICATED", "Please sign in again.");
  const course = await findOwnedCourse((await params).id, user.id);
  if (!course) return fail(404, "NOT_FOUND", "Course not found.");
  if (!EDITABLE_STATUSES.includes(course.status)) {
    return fail(409, "NOT_SUBMITTABLE", "This course has already been submitted.");
  }

  // Validate what is stored, not what the browser says.
  const issues = publishIssues(toDraft(course), todayInWAT());
  if (course.modules.some((m) => m.lessons.some((l) => l.video && l.video.status !== "READY"))) {
    issues.push("A lesson video is still processing.");
  }
  if (course.category && !(await isKnown("category", [course.category]))) issues.push("Choose a course category.");
  if (issues.length) return fail(422, "NOT_READY", issues[0], { issues: issues.join("\n") });

  const { ip } = await clientInfo();
  const updated = await db.$transaction(async (tx) => {
    const res = await tx.course.updateMany({
      where: { id: course.id, status: { in: EDITABLE_STATUSES } },
      data: { status: "UNDER_REVIEW", submittedAt: new Date() },
    });
    if (res.count === 0) return null;
    await audit(
      {
        actorId: user.id,
        action: course.status === "REJECTED" ? "course_resubmitted" : "course_submitted",
        targetType: "course",
        targetId: course.id,
        before: { status: course.status },
        after: { status: "UNDER_REVIEW" },
        ip,
      },
      tx,
    );
    return res;
  });
  if (!updated) return fail(409, "NOT_SUBMITTABLE", "This course has already been submitted.");
  return ok({ id: course.id, status: "UNDER_REVIEW" });
}
