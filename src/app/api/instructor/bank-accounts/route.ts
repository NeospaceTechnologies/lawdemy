import { z } from "zod";
import { db } from "@/lib/db";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";
import { clientInfo } from "@/lib/auth/session";
import { addAccount, listAccounts } from "@/lib/banking";
import { pinProblem, setPin } from "@/lib/pin";

const schema = z.object({ accountNumber: z.string().regex(/^\d{10}$/), bankCode: z.string().min(1), pin: z.string().optional() });

export async function GET() {
  const { user, error } = await requireUser("INSTRUCTOR");
  if (error) return error;
  return ok({ accounts: await listAccounts(user.id) });
}

// Add a bank account. The first setup also creates the transaction PIN (INS-PAY-03).
export async function POST(req: Request) {
  const { user, error } = await requireUser("INSTRUCTOR");
  if (error) return error;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  const hasPin = !!(await db.transactionPin.findUnique({ where: { instructorId: user.id }, select: { instructorId: true } }));
  if (!hasPin) {
    const problem = p.data.pin === undefined ? "Create a 4-digit transaction PIN." : pinProblem(p.data.pin);
    if (problem) return fail(422, "BAD_PIN", problem, { pin: problem });
  }
  const { ip } = await clientInfo();
  const r = await addAccount(user, p.data.accountNumber, p.data.bankCode, { ip });
  if ("error" in r) return fail(422, "NOT_VERIFIED", r.error!);
  if (!hasPin) await setPin(user.id, p.data.pin!);
  return ok({ account: r.account }, { status: 201 });
}
