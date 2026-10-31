import { z } from "zod";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { requireStaff } from "@/lib/auth/staff";
import { moderate, REPORT_TARGETS } from "@/lib/admin/ops";

const schema = z.object({
  targetType: z.enum(REPORT_TARGETS),
  targetId: z.string().min(1),
  action: z.enum(["dismiss", "hide", "warn", "suspend"]),
  note: z.string().trim().max(1000).optional(),
});

// ADM-04: act on every open report for one post or reply.
export async function POST(req: Request) {
  const { user, error } = await requireStaff();
  if (error) return error;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  const r = await moderate(user.id, p.data.targetType, p.data.targetId, p.data.action, p.data.note || undefined);
  return r.ok ? ok({ ok: true }) : fail(409, "NOT_ALLOWED", r.error);
}
