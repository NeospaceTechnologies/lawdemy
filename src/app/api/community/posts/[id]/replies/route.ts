import { z } from "zod";
import { db } from "@/lib/db";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { notify } from "@/lib/notify";
import { rateLimit } from "@/lib/rate-limit";
import { requireUser } from "@/lib/auth/guard";
import { canSeePost, checkPostAttachment } from "@/lib/community";

const schema = z.object({ body: z.string().trim().min(1, "Write a reply.").max(5000), attachmentId: z.string().nullable().optional() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  if (!rateLimit(`post:${user.id}`, 40, 60 * 60_000).ok) return fail(429, "RATE_LIMITED", "You’re posting too quickly. Please wait a little.");
  const post = await db.post.findFirst({ where: { id: (await params).id, deletedAt: null, status: { not: "hidden" } }, include: { author: { select: { role: true } } } });
  if (!post || !(await canSeePost(post, user))) return fail(404, "NOT_FOUND", "Post not found.");
  if (post.kind === "announcement") return fail(422, "READ_ONLY", "Announcements don’t take replies.");
  const attachmentId = await checkPostAttachment(p.data.attachmentId, user.id);
  if (attachmentId === undefined) return fail(422, "BAD_ATTACHMENT", "Attachments must be JPEG, PNG or PDF files up to 5MB.");
  const reply = await db.postReply.create({ data: { postId: post.id, authorId: user.id, body: p.data.body, attachmentId } });
  if (post.authorId !== user.id) {
    await notify(post.authorId, { type: "community_reply", title: `${user.firstName} ${user.lastName}`, body: `replied to your post “${post.title}”.`, link: post.author.role === "INSTRUCTOR" ? `/instructor/community/${post.id}` : `/community/${post.id}` });
  }
  return ok({ id: reply.id }, { status: 201 });
}
