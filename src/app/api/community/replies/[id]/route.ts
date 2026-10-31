import { z } from "zod";
import { db } from "@/lib/db";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";

const schema = z.object({ body: z.string().trim().min(1).max(5000) });
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { user, error } = await requireUser();
  if (error) return error;
  const r = await db.postReply.findFirst({ where: { id: (await params).id, authorId: user.id, deletedAt: null } });
  if (!r) return fail(404, "NOT_FOUND", "Reply not found.");
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  await db.postReply.update({ where: { id: r.id }, data: { body: p.data.body, editedAt: new Date() } });
  return ok({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { user, error } = await requireUser();
  if (error) return error;
  const r = await db.postReply.findFirst({ where: { id: (await params).id, authorId: user.id, deletedAt: null } });
  if (!r) return fail(404, "NOT_FOUND", "Reply not found.");
  await db.postReply.update({ where: { id: r.id }, data: { deletedAt: new Date() } });
  return ok({ ok: true });
}
