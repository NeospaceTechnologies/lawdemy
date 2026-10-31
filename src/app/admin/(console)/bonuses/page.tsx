import type { Metadata } from "next";
import Link from "next/link";
import { AdminAction } from "@/features/admin/AdminAction";
import { AdminHeader, AdminTable, Td, when } from "@/features/admin/Table";
import { db } from "@/lib/db";
import { formatNaira } from "@/lib/format";

export const metadata: Metadata = { title: "Bonuses" };

// ADM-10: credit a Promotional Bonus; it appears in the instructor's transaction history.
export default async function BonusesPage() {
  const bonuses = await db.walletTransaction.findMany({
    where: { type: "BONUS" },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { instructor: { select: { id: true, firstName: true, lastName: true, email: true } } },
  });
  return (
    <>
      <AdminHeader title="Bonuses" subtitle="Bonuses are available to withdraw immediately.">
        <AdminAction
          endpoint="/api/admin/bonuses"
          label="Credit a bonus"
          fields={[
            { name: "instructorEmail", label: "Instructor email", type: "text", minLength: 5 },
            { name: "amountKobo", label: "Amount (₦)", type: "naira", max: 100_000_000 },
            { name: "description", label: "Description (shown to the instructor)", type: "text", minLength: 5, placeholder: "First-time instructor reward" },
          ]}
          confirmLabel="Credit bonus"
          busyLabel="Crediting…"
          success="Bonus credited"
        />
      </AdminHeader>
      <AdminTable head={["Date", "Instructor", "Description", "Amount"]} empty="No bonuses yet.">
        {bonuses.map((b) => (
          <tr key={b.id}>
            <Td className="text-ink-3">{when(b.createdAt)}</Td>
            <Td><Link href={`/admin/users/${b.instructor.id}`}>{b.instructor.firstName} {b.instructor.lastName}</Link><span className="block text-xs text-ink-3">{b.instructor.email}</span></Td>
            <Td>{b.notes}</Td>
            <Td className="text-success">{formatNaira(b.amountKobo)}</Td>
          </tr>
        ))}
      </AdminTable>
    </>
  );
}
