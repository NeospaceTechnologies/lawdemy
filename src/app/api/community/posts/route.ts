import { z } from "zod";
import { db } from "@/lib/db";
import { BUSINESS } from "@/lib/config";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { notifyMany } from "@/lib/notify";
import { rateLimit } from "@/lib/rate-limit";
import { requireUser } from "@/lib/auth/guard";
import { ANNOUNCEMENT_LIMIT, announcementsThisMonth, checkPostAttachment } from "@/lib/community";

const schema = z.object({
  kind: z.enum(["discussion", "announcement"]),
  title: z.string().trim().min(1, "Add a title.").max(200),
  body: z.string().trim().min(1, "Add some content.").max(10000),
  attachmentId: z.string().nullable().optional(),
  courseId: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  if (!rateLimit(`post:${user.id}`, 10, 60 * 60_000).ok) return fail(429, "RATE_LIMITED", "You’re posting too quickly. Please wait a little.");
  const attachmentId = await checkPostAttachment(p.data.attachmentId, user.id);
  if (attachmentId === undefined) return fail(422, "BAD_ATTACHMENT", "Attachments must be JPEG, PNG or PDF files up to 5MB.");

  if (p.data.kind === "announcement") {
    if (user.role !== "INSTRUCTOR") return fail(403, "FORBIDDEN", "Only instructors can post announcements.");
    if (!p.data.courseId) return fail(422, "VALIDATION_FAILED", "Choose a course.", { courseId: "Choose a course." });
    const course = await db.course.findFirst({ where: { id: p.data.courseId, instructorId: user.id, deletedAt: null }, select: { id: true, title: true } });
    if (!course) return fail(404, "NOT_FOUND", "Course not found.");
    if ((await announcementsThisMonth(course.id)) >= ANNOUNCEMENT_LIMIT) {
      return fail(422, "ANNOUNCEMENT_LIMIT", `You’ve already posted ${ANNOUNCEMENT_LIMIT} announcements for this course this month. You can post again next month.`);
    }
    const post = await db.post.create({
      data: { authorId: user.id, kind: "announcement", title: p.data.title, body: p.data.body, courseId: course.id, attachmentId, expiresAt: new Date(Date.now() + BUSINESS.announcementDays * 86400_000) },
    });
    const learners = await db.enrollment.findMany({ where: { courseId: course.id }, select: { learnerId: true } });
    await notifyMany(learners.map((l) => l.learnerId), { type: "announcement", title: `${user.firstName} ${user.lastName}`, body: `posted an announcement in ${course.title}: “${p.data.title}”`, link: `/community/${post.id}` });
    return ok({ id: post.id }, { status: 201 });
  }

  const post = await db.post.create({ data: { authorId: user.id, kind: "discussion", title: p.data.title, body: p.data.body, attachmentId } });
  return ok({ id: post.id }, { status: 201 });
}
