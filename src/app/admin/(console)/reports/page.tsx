import type { Metadata } from "next";
import { AdminAction } from "@/features/admin/AdminAction";
import { AdminHeader, Pill, when } from "@/features/admin/Table";
import { db } from "@/lib/db";
import { reportedContent, type ReportTarget } from "@/lib/admin/ops";

export const metadata: Metadata = { title: "Reports" };

const LABEL: Record<ReportTarget, string> = { question: "Q&A question", question_reply: "Q&A reply", post: "Community post", post_reply: "Community reply" };

// ADM-04: open reports grouped by the reported post or reply, most reported first.
export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const status = (await searchParams).status === "handled" ? "handled" : "open";
  const reports = await db.report.findMany({
    where: status === "open" ? { status: "open" } : { status: { not: "open" } },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  const reporters = await db.user.findMany({ where: { id: { in: [...new Set(reports.map((r) => r.reporterId))] } }, select: { id: true, firstName: true, lastName: true, email: true } });
  const groups = new Map<string, typeof reports>();
  for (const r of reports) groups.set(`${r.targetType}:${r.targetId}`, [...(groups.get(`${r.targetType}:${r.targetId}`) ?? []), r]);
  const items = await Promise.all(
    [...groups.entries()].map(async ([key, rs]) => {
      const [type, id] = key.split(":") as [ReportTarget, string];
      return { type, id, rs, content: await reportedContent(type, id) };
    }),
  );
  items.sort((a, b) => b.rs.length - a.rs.length);
  return (
    <>
      <AdminHeader title="Reported content" subtitle="Reporters are never shown to the author.">
        <nav className="flex gap-3 text-[13px]">
          <a href="/admin/reports" className={status === "open" ? "font-semibold" : "text-ink-3"}>Open</a>
          <a href="/admin/reports?status=handled" className={status === "handled" ? "font-semibold" : "text-ink-3"}>Handled</a>
        </nav>
      </AdminHeader>
      {items.length === 0 && <p className="m-0 rounded-card border border-dashed border-line-input p-6 text-center text-[13px] text-ink-3">No {status} reports.</p>}
      {items.map(({ type, id, rs, content }) => (
        <article key={`${type}:${id}`} className="flex flex-col gap-3 rounded-card border border-line p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-3">
            <Pill tone="blue">{LABEL[type]}</Pill>
            <Pill tone={rs.length > 2 ? "red" : "amber"}>{rs.length} report{rs.length === 1 ? "" : "s"}</Pill>
            {content?.hidden && <Pill>Hidden</Pill>}
            {content && <span>by {content.author.firstName} {content.author.lastName} ({content.author.email}) · {when(content.createdAt)}</span>}
          </div>
          {content ? (
            <div className="flex flex-col gap-1 rounded-control bg-surface p-3">
              {content.title && <strong className="text-sm">{content.title}</strong>}
              <p className="m-0 text-[13px] whitespace-pre-line text-ink-2">{content.body}</p>
            </div>
          ) : (
            <p className="m-0 text-[13px] text-ink-3">This content has been deleted.</p>
          )}
          <ul className="m-0 flex list-none flex-col gap-1 p-0 text-xs text-ink-2">
            {rs.map((r) => {
              const who = reporters.find((u) => u.id === r.reporterId);
              return (
                <li key={r.id}>
                  <strong>{r.reason}</strong>{r.details ? ` — ${r.details}` : ""} <span className="text-ink-3">· {who ? `${who.firstName} ${who.lastName}` : "Deleted user"} · {when(r.createdAt)}{r.action ? ` · ${r.action}` : ""}</span>
                </li>
              );
            })}
          </ul>
          {status === "open" && content && (
            <div className="flex flex-wrap gap-2">
              <AdminAction endpoint="/api/admin/reports" body={{ targetType: type, targetId: id, action: "dismiss" }} label="Dismiss" variant="outline" success="Reports dismissed" busyLabel="Dismissing…" />
              <AdminAction endpoint="/api/admin/reports" body={{ targetType: type, targetId: id, action: "hide" }} label="Hide content" title="Hide this content?" description="It disappears for everyone and the author is told it broke the guidelines." fields={[{ name: "note", label: "Message to the author (optional)", type: "textarea" }]} confirmLabel="Hide" success="Content hidden" busyLabel="Hiding…" />
              <AdminAction endpoint="/api/admin/reports" body={{ targetType: type, targetId: id, action: "warn" }} label="Warn author" variant="outline" title="Warn the author" fields={[{ name: "note", label: "Message to the author", type: "textarea", minLength: 10, initial: "One of your posts was reported. Please keep discussions respectful and on topic." }]} confirmLabel="Send warning" success="Warning sent" busyLabel="Sending…" />
              <AdminAction endpoint="/api/admin/reports" body={{ targetType: type, targetId: id, action: "suspend" }} label="Suspend author" variant="danger" title="Suspend the author?" description="Hides this content, signs the author out everywhere and blocks sign-in until staff reactivate the account under Users." confirmLabel="Suspend" success="Author suspended" busyLabel="Suspending…" />
            </div>
          )}
        </article>
      ))}
    </>
  );
}
