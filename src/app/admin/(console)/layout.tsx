import { Logo } from "@/components/ui/Logo";
import { AdminNav } from "@/features/admin/AdminNav";
import { requireStaffPage } from "@/lib/auth/staff";
import { db } from "@/lib/db";

// Minimal staff console (PRD 11): no designs exist, so it is plain and table-based.
export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaffPage();
  const [queue, reports, payouts, tickets] = await Promise.all([
    db.course.count({ where: { status: "UNDER_REVIEW", deletedAt: null } }),
    db.report.groupBy({ by: ["targetType", "targetId"], where: { status: "open" } }).then((r) => r.length),
    db.withdrawal.count({ where: { status: { in: ["AWAITING_APPROVAL", "FAILED"] } } }),
    db.supportTicket.count({ where: { status: "open" } }),
  ]);
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-none flex-col gap-5 border-r border-line bg-surface px-3 py-4">
        <span className="flex items-center gap-2 px-2"><Logo /><span className="rounded bg-ink px-1.5 py-0.5 text-[10px] font-semibold text-white">Staff</span></span>
        <AdminNav counts={{ queue, reports, payouts, tickets }} />
        <div className="mt-auto flex flex-col gap-1 px-2 text-xs text-ink-3">
          <span className="font-semibold text-ink">{user.firstName} {user.lastName}</span>
          <span className="truncate">{user.email}</span>
          <form action="/api/auth/sign-out?to=/admin/sign-in" method="post"><button type="submit" className="mt-1 border-0 bg-transparent p-0 text-xs font-semibold text-danger-text">Sign out</button></form>
        </div>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col gap-6 px-6 py-6">{children}</main>
    </div>
  );
}
