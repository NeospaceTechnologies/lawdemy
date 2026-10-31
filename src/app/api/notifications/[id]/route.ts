import { db } from "@/lib/db";
import { ok } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";

// Mark one notification read.
export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  await db.notification.updateMany({ where: { id: (await params).id, userId: user.id }, data: { readAt: new Date() } });
  return ok({ ok: true });
}
