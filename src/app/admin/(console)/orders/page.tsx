import type { Metadata } from "next";
import Link from "next/link";
import { AdminAction } from "@/features/admin/AdminAction";
import { AdminHeader, AdminTable, FilterBar, inputCls, Pill, Td, when } from "@/features/admin/Table";
import { db } from "@/lib/db";
import { formatNaira } from "@/lib/format";

export const metadata: Metadata = { title: "Orders & refunds" };

// ADM-07: find an order and refund it in full or in part; optionally end the learner's access.
export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim();
  const orders = await db.order.findMany({
    where: {
      status: { in: ["PAID", "REFUNDED"] },
      ...(q ? { OR: [{ reference: { contains: q, mode: "insensitive" as const } }, { learner: { email: { contains: q, mode: "insensitive" as const } } }] } : {}),
    },
    orderBy: { paidAt: "desc" },
    take: 50,
    include: { learner: { select: { id: true, firstName: true, lastName: true, email: true } }, items: { include: { course: { select: { title: true } } } } },
  });
  return (
    <>
      <AdminHeader title="Orders & refunds" subtitle="Refunds go back through the payment provider and reverse the instructor’s share of the sale." />
      <FilterBar>
        <input name="q" defaultValue={q} placeholder="Order reference or learner email" className={inputCls + " w-72"} aria-label="Order reference or learner email" />
        <button className="h-9 rounded-control border border-primary bg-white px-3 text-[13px] font-semibold text-primary">Search</button>
      </FilterBar>
      <AdminTable head={["Order", "Learner", "Course", "Paid", "Refunded", ""]} empty="No paid orders match.">
        {orders.flatMap((o) =>
          o.items.map((it) => {
            const left = it.priceKobo - it.refundedKobo;
            return (
              <tr key={it.id}>
                <Td className="text-xs whitespace-nowrap">{o.reference}<span className="block text-ink-3">{when(o.paidAt)}</span></Td>
                <Td><Link href={`/admin/users/${o.learner.id}`}>{o.learner.firstName} {o.learner.lastName}</Link><span className="block text-xs text-ink-3">{o.learner.email}</span></Td>
                <Td>{it.course.title}</Td>
                <Td className="whitespace-nowrap">{formatNaira(it.priceKobo)}</Td>
                <Td>{it.refundedKobo ? <Pill tone={left ? "amber" : "grey"}>{formatNaira(it.refundedKobo)}</Pill> : "—"}</Td>
                <Td className="text-right">
                  {left > 0 && (
                    <AdminAction
                      endpoint="/api/admin/refunds"
                      body={{ itemId: it.id }}
                      label="Refund"
                      variant="outline"
                      title={`Refund “${it.course.title}”`}
                      description={`Up to ${formatNaira(left)} can be refunded on this item.`}
                      fields={[
                        { name: "amountKobo", label: "Amount (₦)", type: "naira", max: left, initial: left },
                        { name: "reason", label: "Reason (kept in the audit log)", type: "textarea", minLength: 5 },
                        { name: "revoke", label: "End the learner’s access to this course", type: "checkbox", hint: "Removes their progress and any certificate." },
                      ]}
                      confirmLabel="Issue refund"
                      busyLabel="Refunding…"
                      success="Refund issued"
                    />
                  )}
                </Td>
              </tr>
            );
          }),
        )}
      </AdminTable>
    </>
  );
}
