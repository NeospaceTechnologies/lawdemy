import { z } from "zod";
import { db } from "@/lib/db";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { notifyMany } from "@/lib/notify";
import { requireUser } from "@/lib/auth/guard";
import { checkPostAttachment } from "@/lib/community";

const schema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(10000),
  attachmentId: z.string().nullable().optional(),
});
type Ctx = { params: Promise<{ id: string }> };

// Edit own post ("Update and Publish", marked Edited). Editing an announcement notifies learners again.
export async function PATCH(req: Request, { params }: Ctx) {
  const { user, error } = await requireUser();
  if (error) return error;
  const post = await db.post.findFirst({ where: { id: (await params).id, authorId: user.id, deletedAt: null }, include: { course: { select: { title: true } } } });
  if (!post) return fail(404, "NOT_FOUND", "Post not found.");
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  const attachmentId = p.data.attachmentId === undefined ? post.attachmentId : await checkPostAttachment(p.data.attachmentId, user.id);
  if (attachmentId === undefined) return fail(422, "BAD_ATTACHMENT", "Attachments must be JPEG, PNG or PDF files up to 5MB.");
  await db.post.update({ where: { id: post.id }, data: { title: p.data.title, body: p.data.body, attachmentId, editedAt: new Date() } });
  if (post.kind === "announcement" && post.courseId && post.status === "published") {
    const learners = await db.enrollment.findMany({ where: { courseId: post.courseId }, select: { learnerId: true } });
    await notifyMany(learners.map((l) => l.learnerId), { type: "announcement", title: `${user.firstName} ${user.lastName}`, body: `updated an announcement in ${post.course?.title ?? "your course"}: “${p.data.title}”`, link: `/community/${post.id}` });
  }
  return ok({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { user, error } = await requireUser();
  if (error) return error;
  const post = await db.post.findFirst({ where: { id: (await params).id, authorId: user.id, deletedAt: null } });
  if (!post) return fail(404, "NOT_FOUND", "Post not found.");
  const now = new Date();
  await db.$transaction([
    db.post.update({ where: { id: post.id }, data: { deletedAt: now } }),
    db.postReply.updateMany({ where: { postId: post.id, deletedAt: null }, data: { deletedAt: now } }),
  ]);
  return ok({ ok: true });
}
