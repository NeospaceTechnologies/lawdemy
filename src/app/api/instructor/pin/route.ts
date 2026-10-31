import { z } from "zod";
import { audit } from "@/lib/audit";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { requireUser } from "@/lib/auth/guard";
import { verifyPassword } from "@/lib/auth/hash";
import { pinProblem, setPin } from "@/lib/pin";

const schema = z
  .object({ password: z.string().min(1), pin: z.string(), confirm: z.string() })
  .refine((v) => v.pin === v.confirm, { path: ["confirm"], message: "PINs do not match." });

// Forgot / change PIN: verify the account password, then set a new PIN (INS-PAY-08, INS-SET).
export async function PUT(req: Request) {
  const { user, error } = await requireUser("INSTRUCTOR");
  if (error) return error;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  if (!rateLimit(`pin-reset:${user.id}`, 5, 60 * 60_000).ok) return fail(429, "RATE_LIMITED", "Too many attempts. Please wait.");
  if (!(await verifyPassword(user.passwordHash, p.data.password))) return fail(422, "WRONG_PASSWORD", "The password you entered is incorrect.");
  const problem = pinProblem(p.data.pin);
  if (problem) return fail(422, "BAD_PIN", problem, { pin: problem });
  await setPin(user.id, p.data.pin);
  await audit({ actorId: user.id, action: "pin_reset", targetType: "user", targetId: user.id });
  return ok({ ok: true });
}
