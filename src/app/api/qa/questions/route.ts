import { z } from "zod";
import { db } from "@/lib/db";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { notify } from "@/lib/notify";
import { rateLimit } from "@/lib/rate-limit";
import { requireUser } from "@/lib/auth/guard";
import { canDiscuss, ownAttachment } from "@/lib/discussions";

const schema = z.object({
  lessonId: z.string().min(1),
  title: z.string().trim().min(1, "Add a title.").max(200),
  body: z.string().trim().min(1, "Add some details.").max(5000),
  attachmentId: z.string().nullable().optional(),
});

// Ask a question on a lesson (LRN-QA-01).
export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  if (!rateLimit(`qa:${user.id}`, 20, 60 * 60_000).ok) return fail(429, "RATE_LIMITED", "You’re posting too quickly. Please wait a little.");
  const lesson = await db.lesson.findUnique({ where: { id: p.data.lessonId }, select: { title: true, module: { select: { course: { select: { id: true, title: true, instructorId: true } } } } } });
  if (!lesson) return fail(404, "NOT_FOUND", "Lesson not found.");
  const course = lesson.module.course;
  if (!(await canDiscuss(course.id, user))) return fail(403, "FORBIDDEN", "Enrol in this course to ask questions.");
  const attachmentId = await ownAttachment(p.data.attachmentId, user.id);
  if (attachmentId === undefined) return fail(422, "BAD_ATTACHMENT", "That attachment isn’t available.");

  const q = await db.question.create({ data: { lessonId: p.data.lessonId, authorId: user.id, title: p.data.title, body: p.data.body, attachmentId } });
  if (course.instructorId !== user.id) {
    await notify(course.instructorId, { type: "new_question", title: `${user.firstName} ${user.lastName}`, body: `asked a question in ${course.title}: “${p.data.title}”`, link: `/instructor/questions/${q.id}` });
  }
  return ok({ id: q.id }, { status: 201 });
}
