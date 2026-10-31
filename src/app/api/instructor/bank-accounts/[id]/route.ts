import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";

type Ctx = { params: Promise<{ id: string }> };

// Make an account the default for withdrawals (INS-PAY-09).
export async function PATCH(req: Request, { params }: Ctx) {
  const { user, error } = await requireUser("INSTRUCTOR");
  if (error) return error;
  const p = z.object({ isDefault: z.literal(true) }).safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  const a = await db.bankAccount.findFirst({ where: { id: (await params).id, instructorId: user.id, deletedAt: null } });
  if (!a) return fail(404, "NOT_FOUND", "Account not found.");
  await db.$transaction([
    db.bankAccount.updateMany({ where: { instructorId: user.id }, data: { isDefault: false } }),
    db.bankAccount.update({ where: { id: a.id }, data: { isDefault: true } }),
  ]);
  return ok({ ok: true });
}

// Remove a saved account (confirm in the UI; "Bank Account Removed").
export async function DELETE(_req: Request, { params }: Ctx) {
  const { user, error } = await requireUser("INSTRUCTOR");
  if (error) return error;
  const a = await db.bankAccount.findFirst({ where: { id: (await params).id, instructorId: user.id, deletedAt: null } });
  if (!a) return fail(404, "NOT_FOUND", "Account not found.");
  const pending = await db.withdrawal.count({ where: { bankAccountId: a.id, status: "PENDING" } });
  if (pending) return fail(409, "IN_USE", "A withdrawal to this account is still processing.");
  await db.bankAccount.update({ where: { id: a.id }, data: { deletedAt: new Date(), isDefault: false } });
  if (a.isDefault) {
    const next = await db.bankAccount.findFirst({ where: { instructorId: user.id, deletedAt: null }, orderBy: { createdAt: "asc" } });
    if (next) await db.bankAccount.update({ where: { id: next.id }, data: { isDefault: true } });
  }
  await audit({ actorId: user.id, action: "bank_removed", targetType: "bank_account", targetId: a.id });
  return ok({ ok: true });
}
