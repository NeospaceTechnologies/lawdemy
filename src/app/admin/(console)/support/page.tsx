import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader, AdminTable, FilterBar, inputCls, Pill, Td, when } from "@/features/admin/Table";
import { db } from "@/lib/db";
import { INSTRUCTOR_SUPPORT_CATEGORIES, LEARNER_SUPPORT_CATEGORIES } from "@/lib/support";

export const metadata: Metadata = { title: "Support inbox" };

const STATUSES = ["open", "pending", "closed"] as const;
const TONE = { open: "amber", pending: "blue", closed: "grey" } as const;

// ADM-08: tickets from both apps, filtered by category and status.
export default async function SupportInboxPage({ searchParams }: { searchParams: Promise<{ status?: string; category?: string; mine?: string }> }) {
  const sp = await searchParams;
  const status = STATUSES.find((s) => s === sp.status) ?? "open";
  const categories = [...new Set([...LEARNER_SUPPORT_CATEGORIES, ...INSTRUCTOR_SUPPORT_CATEGORIES])];
  const tickets = await db.supportTicket.findMany({
    where: { status, ...(sp.category ? { category: sp.category } : {}) },
    orderBy: { createdAt: status === "closed" ? "desc" : "asc" },
    take: 200,
    include: { user: { select: { firstName: true, lastName: true, email: true, role: true } }, _count: { select: { replies: true } } },
  });
  const staff = await db.user.findMany({ where: { role: "ADMIN" }, select: { id: true, firstName: true } });
  return (
    <>
      <AdminHeader title="Support inbox" subtitle="Replies are emailed to the user from the console." />
      <FilterBar>
        <select name="status" defaultValue={status} className={inputCls} aria-label="Status">{STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select>
        <select name="category" defaultValue={sp.category ?? ""} className={inputCls} aria-label="Category"><option value="">All categories</option>{categories.map((c) => <option key={c}>{c}</option>)}</select>
        <button className="h-9 rounded-control border border-primary bg-white px-3 text-[13px] font-semibold text-primary">Filter</button>
      </FilterBar>
      <AdminTable head={["Received", "From", "App", "Category", "Message", "Assignee", "Status"]} empty="No tickets here.">
        {tickets.map((t) => (
          <tr key={t.id}>
            <Td className="whitespace-nowrap text-ink-3">{when(t.createdAt)}</Td>
            <Td>{t.user.firstName} {t.user.lastName}<span className="block text-xs text-ink-3">{t.user.email}</span></Td>
            <Td>{t.user.role === "INSTRUCTOR" ? "Instructor" : "Learner"}</Td>
            <Td>{t.category}</Td>
            <Td className="max-w-[320px]"><Link href={`/admin/support/${t.id}`} className="line-clamp-2">{t.message}</Link>{t._count.replies > 0 && <span className="text-xs text-ink-3">{t._count.replies} repl{t._count.replies === 1 ? "y" : "ies"}</span>}</Td>
            <Td className="text-ink-3">{staff.find((s) => s.id === t.assigneeId)?.firstName ?? "—"}</Td>
            <Td><Pill tone={TONE[t.status as keyof typeof TONE] ?? "grey"}>{t.status}</Pill></Td>
          </tr>
        ))}
      </AdminTable>
    </>
  );
}
