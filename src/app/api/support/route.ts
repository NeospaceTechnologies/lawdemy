import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { mailer } from "@/lib/email";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { requireUser } from "@/lib/auth/guard";
import { ownAttachment } from "@/lib/discussions";
import { INSTRUCTOR_SUPPORT_CATEGORIES, LEARNER_SUPPORT_CATEGORIES } from "@/lib/support";

const schema = z.object({ category: z.string().min(1, "Choose a category."), message: z.string().trim().min(1, "Tell us about your issue.").max(5000), attachmentId: z.string().nullable().optional() });

// Support form (LRN-ACC-02, INS-SET-01..04): ticket + acknowledgement email.
export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  const allowed = user.role === "INSTRUCTOR" ? INSTRUCTOR_SUPPORT_CATEGORIES : LEARNER_SUPPORT_CATEGORIES;
  if (!allowed.includes(p.data.category)) return fail(422, "VALIDATION_FAILED", "Choose a category.", { category: "Choose a category." });
  if (!rateLimit(`support:${user.id}`, 5, 60 * 60_000).ok) return fail(429, "RATE_LIMITED", "You’ve sent several messages recently. Please wait before sending another.");
  const attachmentId = await ownAttachment(p.data.attachmentId, user.id);
  if (attachmentId === undefined) return fail(422, "BAD_ATTACHMENT", "That attachment isn’t available.");
  const ticket = await db.supportTicket.create({ data: { userId: user.id, category: p.data.category, message: p.data.message, attachmentId } });
  await mailer().send({
    to: user.email,
    subject: `We’ve received your message (ref ${ticket.id.slice(-6).toUpperCase()})`,
    text: `Hi ${user.firstName},\n\nThanks for contacting Lawdemy support about "${p.data.category}". Our team will reply by email within 24 hours.\n\nYour message:\n${p.data.message}\n`,
  });
  await audit({ actorId: user.id, action: "support_ticket_created", targetType: "support_ticket", targetId: ticket.id });
  return ok({ id: ticket.id }, { status: 201 });
}
