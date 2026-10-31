import { db } from "@/lib/db";
import { ok } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const row = await db.recentSearch.findFirst({ where: { id: (await params).id, userId: user.id } });
  if (row) await db.recentSearch.deleteMany({ where: { userId: user.id, query: { equals: row.query, mode: "insensitive" } } });
  return ok({ ok: true });
}
