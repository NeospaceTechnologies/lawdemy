import { z } from "zod";
import { db } from "@/lib/db";
import { invalid, ok, readJson } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";

const schema = z.object({
  marketingOptIn: z.boolean(),
  prefs: z.object({ courseUpdates: z.boolean(), qaReplies: z.boolean(), communityReplies: z.boolean(), enrolments: z.boolean() }).partial(),
});

export async function PUT(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  await db.user.update({ where: { id: user.id }, data: { marketingOptIn: p.data.marketingOptIn, notificationPrefs: p.data.prefs } });
  return ok({ ok: true });
}
