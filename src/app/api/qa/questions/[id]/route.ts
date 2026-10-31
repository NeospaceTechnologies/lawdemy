import { z } from "zod";
import { db } from "@/lib/db";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";

const schema = z.object({ title: z.string().trim().min(1).max(200), body: z.string().trim().min(1).max(5000) });
type Ctx = { params: Promise<{ id: string }> };

async function own(id: string, userId: string) {
  return db.question.findFirst({ where: { id, authorId: userId, deletedAt: null } });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { user, error } = await requireUser();
  if (error) return error;
  const q = await own((await params).id, user.id);
  if (!q) return fail(404, "NOT_FOUND", "Question not found.");
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  await db.question.update({ where: { id: q.id }, data: { ...p.data, editedAt: new Date() } });
  return ok({ ok: true });
}

// Deleting a question removes it and its replies from the discussion (soft delete).
export async function DELETE(_req: Request, { params }: Ctx) {
  const { user, error } = await requireUser();
  if (error) return error;
  const q = await own((await params).id, user.id);
  if (!q) return fail(404, "NOT_FOUND", "Question not found.");
  const now = new Date();
  await db.$transaction([
    db.question.update({ where: { id: q.id }, data: { deletedAt: now } }),
    db.questionReply.updateMany({ where: { questionId: q.id, deletedAt: null }, data: { deletedAt: now } }),
  ]);
  return ok({ ok: true });
}
