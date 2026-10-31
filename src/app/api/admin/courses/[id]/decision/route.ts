import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { mailer } from "@/lib/email";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { notify } from "@/lib/notify";
import { requireStaff } from "@/lib/auth/staff";

const schema = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("approved") }),
  z.object({ decision: z.literal("rejected"), reason: z.string().trim().min(20, "Give a reason of at least 20 characters.").max(2000) }),
]);

// Review decision (ADM-02): approve → Live; reject → Rejected with the reason shown verbatim to the instructor.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireStaff();
  if (error) return error;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  const course = await db.course.findFirst({ where: { id: (await params).id, deletedAt: null }, include: { instructor: { select: { id: true, email: true, firstName: true } } } });
  if (!course) return fail(404, "NOT_FOUND", "Course not found.");
  if (course.status !== "UNDER_REVIEW") return fail(409, "NOT_IN_REVIEW", "This course isn’t waiting for review.");
  const approved = p.data.decision === "approved";
  const reason = p.data.decision === "rejected" ? p.data.reason : null;
  await db.$transaction(async (tx) => {
    await tx.course.update({ where: { id: course.id }, data: { status: approved ? "LIVE" : "REJECTED", publishedAt: approved ? (course.publishedAt ?? new Date()) : course.publishedAt } });
    await tx.reviewDecision.create({ data: { courseId: course.id, reviewerId: user.id, decision: p.data.decision, reason } });
    await audit({ actorId: user.id, action: approved ? "course_approved" : "course_rejected", targetType: "course", targetId: course.id, before: { status: "UNDER_REVIEW" }, after: { status: approved ? "LIVE" : "REJECTED", reason } }, tx);
    await notify(
      course.instructorId,
      approved
        ? { type: "review_approved", title: "Course approved", body: `“${course.title}” is now live for learners.`, link: `/instructor/courses/${course.id}` }
        : { type: "review_rejected", title: "Course not approved", body: `“${course.title}” wasn’t approved. Open the course to see the reviewer’s notes.`, link: `/instructor/courses/${course.id}` },
      tx,
    );
  });
  await mailer().send({
    to: course.instructor.email,
    subject: approved ? `“${course.title}” is live on Lawdemy` : `“${course.title}” needs changes`,
    text: approved ? `Hi ${course.instructor.firstName},\n\nYour course has been approved and is now visible to learners.` : `Hi ${course.instructor.firstName},\n\nYour course wasn’t approved yet. Reason:\n${reason}\n\nUpdate it and resubmit for review.`,
  });
  return ok({ status: approved ? "LIVE" : "REJECTED" });
}
