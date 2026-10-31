import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { mailer } from "@/lib/email";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { requireStaff } from "@/lib/auth/staff";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("reply"), body: z.string().trim().min(2, "Write a reply.").max(5000), close: z.boolean().default(false) }),
  z.object({ action: z.literal("assign"), assigneeId: z.string().min(1).nullable() }),
  z.object({ action: z.literal("close") }),
  z.object({ action: z.literal("reopen") }),
]);

// ADM-08: reply by email from the console, assign to staff, close or reopen.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireStaff();
  if (error) return error;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  const t = await db.supportTicket.findUnique({ where: { id: (await params).id }, include: { user: { select: { email: true, firstName: true } } } });
  if (!t) return fail(404, "NOT_FOUND", "Ticket not found.");
  const d = p.data;
  if (d.action === "reply") {
    await db.supportReply.create({ data: { ticketId: t.id, authorId: user.id, body: d.body } });
    await db.supportTicket.update({ where: { id: t.id }, data: { status: d.close ? "closed" : "pending", assigneeId: t.assigneeId ?? user.id } });
    await mailer().send({
      to: t.user.email,
      subject: `Re: your Lawdemy support request (${t.category})`,
      text: `Hi ${t.user.firstName},\n\n${d.body}\n\n— ${user.firstName}, Lawdemy Support\n\nYour original message:\n${t.message}`,
    });
  } else if (d.action === "assign") {
    if (d.assigneeId && !(await db.user.count({ where: { id: d.assigneeId, role: "ADMIN" } }))) return fail(422, "BAD_ASSIGNEE", "Choose a staff member.");
    await db.supportTicket.update({ where: { id: t.id }, data: { assigneeId: d.assigneeId } });
  } else {
    await db.supportTicket.update({ where: { id: t.id }, data: { status: d.action === "close" ? "closed" : "open" } });
  }
  await audit({ actorId: user.id, action: `support_${d.action}`, targetType: "support_ticket", targetId: t.id });
  return ok({ ok: true });
}
