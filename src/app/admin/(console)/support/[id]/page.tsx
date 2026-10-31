import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminAction } from "@/features/admin/AdminAction";
import { AdminHeader, Pill, when } from "@/features/admin/Table";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Support ticket" };

// ADM-08: one ticket with its replies; reply by email, assign, close or reopen.
export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await db.supportTicket.findUnique({
    where: { id: (await params).id },
    include: { user: true, replies: { orderBy: { createdAt: "asc" }, include: { author: { select: { firstName: true, lastName: true } } } } },
  });
  if (!t) notFound();
  const [staff, attachment] = await Promise.all([
    db.user.findMany({ where: { role: "ADMIN", deletedAt: null }, select: { id: true, firstName: true, lastName: true } }),
    t.attachmentId ? db.mediaAsset.findUnique({ where: { id: t.attachmentId }, select: { id: true, fileName: true } }) : null,
  ]);
  return (
    <>
      <Link href="/admin/support" className="text-[13px]">← Support inbox</Link>
      <AdminHeader title={`${t.category} request`} subtitle={<>From <Link href={`/admin/users/${t.user.id}`}>{t.user.firstName} {t.user.lastName}</Link> ({t.user.email}, {t.user.role === "INSTRUCTOR" ? "instructor" : "learner"}) · {when(t.createdAt)}</>}>
        <Pill tone={t.status === "open" ? "amber" : t.status === "pending" ? "blue" : "grey"}>{t.status}</Pill>
      </AdminHeader>
      <article className="flex flex-col gap-2 rounded-card border border-line p-4">
        <p className="m-0 text-sm whitespace-pre-line">{t.message}</p>
        {attachment && <a href={`/api/media/${attachment.id}`} className="text-[13px]">Attachment: {attachment.fileName}</a>}
      </article>
      {t.replies.map((r) => (
        <article key={r.id} className="ml-8 flex flex-col gap-1 rounded-card border border-info-border bg-info-tint-2 p-4">
          <span className="text-xs text-ink-3">{r.author.firstName} {r.author.lastName} (staff) · {when(r.createdAt)} · emailed</span>
          <p className="m-0 text-sm whitespace-pre-line">{r.body}</p>
        </article>
      ))}
      <div className="flex flex-wrap gap-2">
        <AdminAction endpoint={`/api/admin/support/${t.id}`} body={{ action: "reply", close: false }} label="Reply by email" title="Reply by email" description={`Sent to ${t.user.email}. The ticket moves to Pending.`} fields={[{ name: "body", label: "Your reply", type: "textarea", minLength: 2 }]} confirmLabel="Send reply" busyLabel="Sending…" success="Reply sent" />
        <AdminAction endpoint={`/api/admin/support/${t.id}`} body={{ action: "reply", close: true }} label="Reply and close" variant="outline" title="Reply and close" fields={[{ name: "body", label: "Your reply", type: "textarea", minLength: 2 }]} confirmLabel="Send and close" busyLabel="Sending…" success="Reply sent and ticket closed" />
        <AdminAction
          endpoint={`/api/admin/support/${t.id}`}
          body={{ action: "assign" }}
          label="Assign"
          variant="outline"
          fields={[{ name: "assigneeId", label: "Assign to", type: "select", initial: t.assigneeId ?? staff[0]?.id, options: staff.map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName}` })) }]}
          confirmLabel="Assign"
          success="Ticket assigned"
        />
        {t.status === "closed" ? (
          <AdminAction endpoint={`/api/admin/support/${t.id}`} body={{ action: "reopen" }} label="Reopen" variant="outline" success="Ticket reopened" />
        ) : (
          <AdminAction endpoint={`/api/admin/support/${t.id}`} body={{ action: "close" }} label="Close without reply" variant="ghost" success="Ticket closed" />
        )}
      </div>
    </>
  );
}
