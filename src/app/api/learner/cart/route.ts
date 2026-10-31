import { z } from "zod";
import { db } from "@/lib/db";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";
import { purchasable } from "@/lib/shop";

const schema = z.object({ courseId: z.string().min(1) });

export async function POST(req: Request) {
  const { user, error } = await requireUser("LEARNER");
  if (error) return error;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  const r = await purchasable(p.data.courseId, user.id);
  if (r.error) return fail(409, "NOT_PURCHASABLE", r.error);
  if (r.course.access === "FREE") return fail(409, "FREE_COURSE", "Free courses don’t need checkout. Enrol directly.");
  await db.cartItem.upsert({ where: { learnerId_courseId: { learnerId: user.id, courseId: r.course.id } }, update: {}, create: { learnerId: user.id, courseId: r.course.id } });
  const count = await db.cartItem.count({ where: { learnerId: user.id } });
  return ok({ count });
}
