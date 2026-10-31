import { z } from "zod";
import { db } from "@/lib/db";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { notify } from "@/lib/notify";
import { rateLimit } from "@/lib/rate-limit";
import { requireUser } from "@/lib/auth/guard";
import { canDiscuss, ownAttachment } from "@/lib/discussions";

const schema = z.object({ body: z.string().trim().min(1, "Write a response.").max(5000), attachmentId: z.string().nullable().optional() });

// Reply to a question (learners and the course instructor; LRN-QA-03, INS-ENG-05).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  if (!rateLimit(`qa:${user.id}`, 40, 60 * 60_000).ok) return fail(429, "RATE_LIMITED", "You’re posting too quickly. Please wait a little.");
  const q = await db.question.findFirst({
    where: { id: (await params).id, deletedAt: null },
    include: { lesson: { select: { id: true, module: { select: { course: { select: { id: true, title: true, instructorId: true } } } } } } },
  });
  if (!q) return fail(404, "NOT_FOUND", "Question not found.");
  const course = q.lesson.module.course;
  if (!(await canDiscuss(course.id, user))) return fail(403, "FORBIDDEN", "Enrol in this course to reply.");
  const attachmentId = await ownAttachment(p.data.attachmentId, user.id);
  if (attachmentId === undefined) return fail(422, "BAD_ATTACHMENT", "That attachment isn’t available.");
  const reply = await db.questionReply.create({ data: { questionId: q.id, authorId: user.id, body: p.data.body, attachmentId } });
  if (q.authorId !== user.id) {
    await notify(q.authorId, {
      type: "qa_reply",
      title: user.role === "INSTRUCTOR" ? `${user.firstName} ${user.lastName} (Instructor)` : `${user.firstName} ${user.lastName}`,
      body: `replied to your question “${q.title}”.`,
      link: `/learn/${course.id}/${q.lesson.id}?tab=qa&q=${q.id}`,
    });
  }
  return ok({ id: reply.id }, { status: 201 });
}
