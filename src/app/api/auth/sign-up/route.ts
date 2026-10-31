import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { hashPassword } from "@/lib/auth/hash";
import { checkPassword } from "@/lib/auth/password-rules";
import { clientInfo } from "@/lib/auth/session";
import { roleParam, toDbRole } from "@/lib/auth/schemas";
import { sendVerification } from "@/lib/auth/verify";

const schema = z
  .object({
    email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
    firstName: z.string().trim().min(1, "Enter your first name.").max(60),
    lastName: z.string().trim().min(1, "Enter your last name.").max(60),
    password: z.string().max(256),
    confirm: z.string(),
    role: roleParam,
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match." });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return invalid(parsed.error);
  const { email, firstName, lastName, password, role } = parsed.data;
  const { ip } = await clientInfo();
  if (!rateLimit(`sign-up:${ip}`, 10, 60 * 60_000).ok) return fail(429, "RATE_LIMITED", "Too many sign-ups from this network. Please try later.");

  const check = checkPassword(password, role);
  if (!check.valid) {
    const message = check.common ? "This password is too common. Choose a different one." : "Password doesn't meet all the requirements.";
    return fail(422, "WEAK_PASSWORD", message, { password: message });
  }

  const dbRole = toDbRole(role);
  const exists = await db.user.findUnique({ where: { email_role: { email, role: dbRole } }, select: { id: true } });
  if (exists) return fail(409, "EMAIL_TAKEN", "An account with this email already exists");

  const user = await db.user.create({
    data: {
      email,
      role: dbRole,
      firstName,
      lastName,
      passwordHash: await hashPassword(password),
      ...(dbRole === "LEARNER" ? { learnerProfile: { create: {} } } : { instructorProfile: { create: {} } }),
    },
  });
  await sendVerification(user);
  await audit({ actorId: user.id, action: "signup_completed", targetType: "user", targetId: user.id, ip });
  return ok({ ok: true }, { status: 201 });
}
