import { z } from "zod";
import { db } from "@/lib/db";
import { LIVE } from "@/lib/catalog";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";

const schema = z.object({ courseId: z.string().min(1) });

export async function POST(req: Request) {
  const { user, error } = await requireUser("LEARNER");
  if (error) return error;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  const course = await db.course.findFirst({ where: { AND: [LIVE, { id: p.data.courseId }] }, select: { id: true } });
  if (!course) return fail(404, "NOT_FOUND", "This course isn’t available.");
  await db.wishlistItem.upsert({ where: { learnerId_courseId: { learnerId: user.id, courseId: course.id } }, update: {}, create: { learnerId: user.id, courseId: course.id } });
  return ok({ ok: true });
}
