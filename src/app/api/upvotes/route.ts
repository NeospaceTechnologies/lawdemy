import { z } from "zod";
import { db } from "@/lib/db";
import { invalid, ok, readJson } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";

const schema = z.object({ targetType: z.enum(["question", "question_reply", "post", "post_reply"]), targetId: z.string().min(1) });

// Toggle an upvote. Returns the new count.
export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  const key = { userId_targetType_targetId: { userId: user.id, ...p.data } };
  const existing = await db.upvote.findUnique({ where: key });
  if (existing) await db.upvote.delete({ where: key });
  else await db.upvote.create({ data: { userId: user.id, ...p.data } });
  const count = await db.upvote.count({ where: p.data });
  return ok({ voted: !existing, count });
}
