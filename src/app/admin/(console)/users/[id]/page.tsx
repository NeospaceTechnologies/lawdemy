import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminAction } from "@/features/admin/AdminAction";
import { AdminHeader, AdminTable, Pill, Td, when } from "@/features/admin/Table";
import { db } from "@/lib/db";
import { formatNaira } from "@/lib/format";
import { balances } from "@/lib/wallet";
import { lockedUntil } from "@/lib/auth/lockout";

export const metadata: Metadata = { title: "User" };

// ADM-09: profile, courses, orders and wallet in one place, with account actions.
export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await db.user.findUnique({
    where: { id: (await params).id },
    include: {
      learnerProfile: true,
      instructorProfile: true,
      transactionPin: true,
      enrollments: { include: { course: { select: { id: true, title: true } } }, orderBy: { createdAt: "desc" }, take: 50 },
      orders: { include: { items: { include: { course: { select: { title: true } } } } }, orderBy: { createdAt: "desc" }, take: 30 },
      courses: { where: { deletedAt: null }, select: { id: true, title: true, status: true, takenDownAt: true }, orderBy: { updatedAt: "desc" } },
    },
  });
  if (!u) notFound();
  const [wallet, signInLock, tx] = await Promise.all([
    u.role === "INSTRUCTOR" ? balances(u.id) : null,
    lockedUntil(u.email, u.role),
    u.role === "INSTRUCTOR" ? db.walletTransaction.findMany({ where: { instructorId: u.id }, orderBy: { createdAt: "desc" }, take: 20 }) : [],
  ]);
  const pinLocked = !!u.transactionPin?.lockedUntil && u.transactionPin.lockedUntil > new Date();
  const act = (action: string, label: string, success: string, opts: { variant?: "primary" | "outline" | "danger"; title?: string; description?: string } = {}) => (
    <AdminAction endpoint={`/api/admin/users/${u.id}`} body={{ action }} label={label} success={success} variant={opts.variant ?? "outline"} title={opts.title} description={opts.description} />
  );
  return (
    <>
      <Link href="/admin/users" className="text-[13px]">← Users</Link>
      <AdminHeader title={`${u.firstName} ${u.lastName}`} subtitle={<>{u.email} · {u.role === "ADMIN" ? "Staff" : u.role === "INSTRUCTOR" ? "Instructor" : "Learner"} · joined {when(u.createdAt)}{u.emailVerifiedAt ? "" : " · email not verified"}</>}>
        <div className="flex flex-wrap gap-1.5">
          {u.status === "ACTIVE" ? <Pill tone="green">Active</Pill> : <Pill tone="red">Deactivated</Pill>}
          {signInLock && <Pill tone="amber">Sign-in locked until {when(signInLock)}</Pill>}
          {pinLocked && <Pill tone="amber">PIN locked</Pill>}
          {u.walletFrozenAt && <Pill tone="red">Wallet frozen</Pill>}
          {u.role === "ADMIN" && (u.totpEnabledAt ? <Pill tone="green">2FA on</Pill> : <Pill tone="amber">2FA not set up</Pill>)}
        </div>
      </AdminHeader>

      <section className="flex flex-wrap gap-2">
        {act("unlock_signin", "Clear failed sign-ins", "Sign-in unlocked")}
        {u.role === "INSTRUCTOR" && act("reset_pin_lock", "Unlock PIN", "PIN attempts reset")}
        {u.role === "INSTRUCTOR" && (u.walletFrozenAt
          ? act("unfreeze_wallet", "Unfreeze wallet", "Wallet unfrozen")
          : act("freeze_wallet", "Freeze wallet", "Wallet frozen", { variant: "danger", title: "Freeze this wallet?", description: "The instructor can’t start withdrawals, and pending approvals can’t be sent, until it’s unfrozen." }))}
        {u.role === "ADMIN" && act("reset_2fa", "Reset 2FA", "2FA reset", { variant: "danger", title: "Reset this person’s 2FA?", description: "They’ll be signed out and must set up their authenticator again." })}
        {u.status === "ACTIVE"
          ? act("deactivate", "Deactivate account", "Account deactivated", { variant: "danger", title: "Deactivate this account?", description: "Signs them out everywhere and blocks sign-in until reactivated." })
          : act("reactivate", "Reactivate account", "Account reactivated", { variant: "primary" })}
      </section>

      {u.learnerProfile && (
        <section className="flex flex-col gap-1 text-[13px]">
          <h2 className="m-0 text-lg font-semibold">Profile</h2>
          <span>{u.learnerProfile.isLawyer ? `Lawyer, called ${u.learnerProfile.callYear ?? "—"}` : "Not a lawyer"} · {u.learnerProfile.jurisdictions.join(", ") || "No jurisdictions"}</span>
          <span className="text-ink-3">Interests: {u.learnerProfile.interests.join(", ") || "—"}</span>
        </section>
      )}
      {u.instructorProfile && (
        <section className="flex flex-col gap-1 text-[13px]">
          <h2 className="m-0 text-lg font-semibold">Profile</h2>
          <span>{u.instructorProfile.professionalTitle ?? "—"} · {u.instructorProfile.yearsExperience ?? "—"} years · {u.instructorProfile.jurisdictions.join(", ")}</span>
          <span className="text-ink-3">{u.instructorProfile.bio}</span>
        </section>
      )}

      {wallet && (
        <section className="flex flex-col gap-3">
          <h2 className="m-0 text-lg font-semibold">Wallet</h2>
          <div className="flex flex-wrap gap-6 text-[13px]">
            <span>Total <strong className="block text-base">{formatNaira(wallet.totalKobo)}</strong></span>
            <span>Available <strong className="block text-base">{formatNaira(wallet.availableKobo)}</strong></span>
            <span>Pending <strong className="block text-base">{formatNaira(wallet.pendingKobo)}</strong></span>
          </div>
          <AdminTable head={["Date", "Type", "Description", "Amount", "Status"]} empty="No transactions.">
            {tx.map((t) => (
              <tr key={t.id}>
                <Td className="text-ink-3">{when(t.createdAt)}</Td>
                <Td>{t.type}</Td>
                <Td className="text-ink-2">{t.notes ?? t.reference}</Td>
                <Td className={t.amountKobo < 0 ? "" : "text-success"}>{formatNaira(t.amountKobo)}</Td>
                <Td><Pill tone={t.status === "FAILED" ? "red" : t.status === "PENDING" ? "amber" : "green"}>{t.status}</Pill></Td>
              </tr>
            ))}
          </AdminTable>
        </section>
      )}

      {u.courses.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="m-0 text-lg font-semibold">Courses</h2>
          <AdminTable head={["Course", "Status"]}>
            {u.courses.map((c) => (
              <tr key={c.id}><Td><Link href={`/admin/courses/${c.id}`}>{c.title}</Link></Td><Td>{c.takenDownAt ? <Pill tone="red">Taken down</Pill> : <Pill>{c.status}</Pill>}</Td></tr>
            ))}
          </AdminTable>
        </section>
      )}

      {u.role === "LEARNER" && (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="m-0 text-lg font-semibold">Enrolments</h2>
            <AdminTable head={["Course", "Progress", "Enrolled"]} empty="Not enrolled in any course.">
              {u.enrollments.map((e) => (
                <tr key={e.id}><Td>{e.course.title}</Td><Td>{e.progressPct}%{e.completedAt ? " · completed" : ""}</Td><Td className="text-ink-3">{when(e.createdAt)}</Td></tr>
              ))}
            </AdminTable>
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="m-0 text-lg font-semibold">Orders</h2>
            <AdminTable head={["Reference", "Courses", "Total", "Status", "Date"]} empty="No orders.">
              {u.orders.map((o) => (
                <tr key={o.id}>
                  <Td className="text-xs"><Link href={`/admin/orders?q=${o.reference}`}>{o.reference}</Link></Td>
                  <Td>{o.items.map((i) => i.course.title).join(", ")}</Td>
                  <Td>{formatNaira(o.totalKobo)}{o.refundedKobo ? <span className="block text-xs text-ink-3">refunded {formatNaira(o.refundedKobo)}</span> : null}</Td>
                  <Td><Pill tone={o.status === "PAID" ? "green" : o.status === "FAILED" ? "red" : "grey"}>{o.status}</Pill></Td>
                  <Td className="text-ink-3">{when(o.createdAt)}</Td>
                </tr>
              ))}
            </AdminTable>
          </section>
        </>
      )}
    </>
  );
}
