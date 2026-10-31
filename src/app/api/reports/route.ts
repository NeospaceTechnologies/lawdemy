import { z } from "zod";
import { db } from "@/lib/db";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";
import { isKnown } from "@/lib/taxonomy-store";


const schema = z.object({
  targetType: z.enum(["question", "question_reply", "post", "post_reply"]),
  targetId: z.string().min(1),
  reason: z.string().trim().min(1, "Choose a reason.").max(120),
  details: z.string().trim().max(1000).optional(),
});

async function authorOf(type: string, id: string) {
  if (type === "question") return (await db.question.findUnique({ where: { id }, select: { authorId: true } }))?.authorId;
  if (type === "question_reply") return (await db.questionReply.findUnique({ where: { id }, select: { authorId: true } }))?.authorId;
  if (type === "post") return (await db.post.findUnique({ where: { id }, select: { authorId: true } }))?.authorId;
  return (await db.postReply.findUnique({ where: { id }, select: { authorId: true } }))?.authorId;
}

// Report a post or reply into the admin moderation queue (PRD 6.6, ADM-04).
export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  if (!(await isKnown("report_reason", [p.data.reason]))) return fail(422, "VALIDATION_FAILED", "Choose a reason.", { reason: "Choose a reason." });
  const authorId = await authorOf(p.data.targetType, p.data.targetId);
  if (!authorId) return fail(404, "NOT_FOUND", "That post no longer exists.");
  if (authorId === user.id) return fail(422, "OWN_POST", "You can’t report your own post.");
  await db.report.upsert({
    where: { reporterId_targetType_targetId: { reporterId: user.id, targetType: p.data.targetType, targetId: p.data.targetId } },
    update: { reason: p.data.reason, details: p.data.details },
    create: { reporterId: user.id, ...p.data },
  });
  return ok({ ok: true });
}
