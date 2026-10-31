import { z } from "zod";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { requireStaff } from "@/lib/auth/staff";
import { reconcile } from "@/lib/reconcile";

const schema = z.object({ days: z.number().int().min(1).max(31).default(1) });

// ADM-06 "Run now": reconciles the last N days up to now.
export async function POST(req: Request) {
  const { user, error } = await requireStaff();
  if (error) return error;
  const p = schema.safeParse((await readJson(req)) ?? {});
  if (!p.success) return invalid(p.error);
  const end = new Date();
  const start = new Date(end.getTime() - p.data.days * 24 * 3600_000);
  if (start > end) return fail(422, "BAD_RANGE", "Bad range.");
  const run = await reconcile(start, end, user.id);
  return ok({ id: run.id, checked: run.checked });
}
