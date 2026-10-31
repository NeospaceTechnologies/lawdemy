import { z } from "zod";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { fail, ok, readJson } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { balances } from "@/lib/wallet";

const schema = z.object({ reason: z.string().max(200).optional(), details: z.string().max(1000).optional() });

/**
 * Delete account (LRN-ACC-03, INS-SET). Personal data is anonymised now; the
 * 30-day purge and statutory financial retention run in a back-office job (PRD 9).
 */
export async function DELETE(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const p = schema.safeParse((await readJson(req)) ?? {});
  if (user.role === "INSTRUCTOR") {
    const b = await balances(user.id);
    if (b.availableKobo > 0 || b.pendingKobo > 0) {
      return fail(409, "HAS_BALANCE", "Withdraw your available balance and wait for pending earnings to clear before deleting your account.");
    }
    const live = await db.course.count({ where: { instructorId: user.id, status: { in: ["LIVE", "UNDER_REVIEW"] }, deletedAt: null } });
    if (live) return fail(409, "HAS_COURSES", "Archive your live courses (or wait for reviews to finish) before deleting your account.");
  }
  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { status: "DELETED", deletedAt: new Date(), email: `deleted+${user.id}@lawdemy.invalid`, firstName: "Deleted", lastName: "User", photoAssetId: null, marketingOptIn: false },
    }),
    db.session.deleteMany({ where: { userId: user.id } }),
    db.cartItem.deleteMany({ where: { learnerId: user.id } }),
    db.wishlistItem.deleteMany({ where: { learnerId: user.id } }),
  ]);
  await audit({ actorId: user.id, action: "account_deleted", targetType: "user", targetId: user.id, after: p.success ? { reason: p.data.reason ?? null } : undefined });
  (await cookies()).delete(SESSION_COOKIE);
  return ok({ ok: true });
}
