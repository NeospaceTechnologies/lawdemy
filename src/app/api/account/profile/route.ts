import { z } from "zod";
import { db } from "@/lib/db";
import { invalid, ok, readJson } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";

const schema = z.object({ firstName: z.string().trim().min(1).max(60), lastName: z.string().trim().min(1).max(60) });

export async function PATCH(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  await db.user.update({ where: { id: user.id }, data: p.data });
  return ok({ ok: true });
}
