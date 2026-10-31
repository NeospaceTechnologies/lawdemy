import { z } from "zod";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { requireStaff } from "@/lib/auth/staff";
import { setWalletFrozen, userAction } from "@/lib/admin/ops";

const schema = z.object({ action: z.enum(["unlock_signin", "reset_pin_lock", "deactivate", "reactivate", "reset_2fa", "freeze_wallet", "unfreeze_wallet"]) });

// ADM-09 (and ADM-05 wallet freeze): account actions from user lookup.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireStaff();
  if (error) return error;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  const id = (await params).id;
  const a = p.data.action;
  const r = a === "freeze_wallet" || a === "unfreeze_wallet" ? await setWalletFrozen(user.id, id, a === "freeze_wallet") : await userAction(user.id, id, a);
  return r.ok ? ok({ ok: true }) : fail(409, "NOT_ALLOWED", r.error);
}
