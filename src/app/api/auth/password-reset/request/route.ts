import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { appUrl, mailer } from "@/lib/email";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { issueResetToken } from "@/lib/auth/reset";
import { clientInfo } from "@/lib/auth/session";
import { resetRequestSchema, toDbRole } from "@/lib/auth/schemas";

const RESET_PATH = { learner: "/reset-password/new", instructor: "/instructor/reset-password/new" } as const;

export async function POST(req: Request) {
  const parsed = resetRequestSchema.safeParse(await readJson(req));
  if (!parsed.success) return invalid(parsed.error);
  const { email, role } = parsed.data;
  const { ip } = await clientInfo();

  if (!rateLimit(`reset-ip:${ip}`, 10, 15 * 60_000).ok) {
    return fail(429, "RATE_LIMITED", "Too many requests. Please wait a few minutes and try again.");
  }

  // The response is identical whether or not the account exists (no enumeration, PRD 4.2).
  const response = ok({ ok: true });

  // One email per address per minute; extra requests are silently accepted.
  if (!rateLimit(`reset-email:${role}:${email}`, 1, 60_000).ok) return response;

  const user = await db.user.findUnique({ where: { email_role: { email, role: toDbRole(role) } } });
  if (!user || user.deletedAt || user.status === "DELETED") return response;

  const token = await issueResetToken(user.id);
  const link = appUrl(`${RESET_PATH[role]}?token=${encodeURIComponent(token)}`);
  await mailer().send({
    to: user.email,
    subject: "Reset your Lawdemy password",
    text: `Hi ${user.firstName},\n\nUse this link to set a new password. It expires in 1 hour and works once:\n${link}\n\nIf you didn't ask for this, you can ignore this email.`,
  });
  await audit({ actorId: user.id, action: "password_reset_requested", targetType: "user", targetId: user.id, ip });
  return response;
}
