import { z } from "zod";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { requireStaff } from "@/lib/auth/staff";
import { approveWithdrawal, rejectWithdrawal, retryWithdrawal } from "@/lib/admin/ops";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("reject"), reason: z.string().trim().min(10, "Give a reason of at least 10 characters.").max(500) }),
  z.object({ action: z.literal("retry") }),
]);

// ADM-05: approve large withdrawals, decline them, or retry failed transfers.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireStaff();
  if (error) return error;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  const id = (await params).id;
  const r =
    p.data.action === "approve" ? await approveWithdrawal(user.id, id) : p.data.action === "reject" ? await rejectWithdrawal(user.id, id, p.data.reason) : await retryWithdrawal(user.id, id);
  return r.ok ? ok({ ok: true }) : fail(409, "NOT_ALLOWED", r.error);
}
