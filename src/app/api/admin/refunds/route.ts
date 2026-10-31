import { z } from "zod";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { requireStaff } from "@/lib/auth/staff";
import { refundOrderItem } from "@/lib/admin/ops";

const schema = z.object({
  itemId: z.string().min(1),
  amountKobo: z.number().int().positive("Enter an amount."),
  revoke: z.boolean().default(false),
  reason: z.string().trim().min(5, "Add a short reason.").max(500),
});

// ADM-07: full or partial refund; reverses the instructor's share; optional revoke.
export async function POST(req: Request) {
  const { user, error } = await requireStaff();
  if (error) return error;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  const r = await refundOrderItem(user.id, p.data.itemId, p.data.amountKobo, p.data.revoke, p.data.reason);
  return r.ok ? ok({ ok: true }) : fail(409, "NOT_ALLOWED", r.error);
}
