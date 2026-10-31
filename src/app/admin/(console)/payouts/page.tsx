import type { Metadata } from "next";
import Link from "next/link";
import type { WithdrawalStatus } from "@prisma/client";
import { AdminAction } from "@/features/admin/AdminAction";
import { AdminHeader, AdminTable, Pill, Td, when } from "@/features/admin/Table";
import { BUSINESS } from "@/lib/config";
import { db } from "@/lib/db";
import { formatNaira } from "@/lib/format";

export const metadata: Metadata = { title: "Payouts" };

const TABS: { id: WithdrawalStatus; label: string }[] = [
  { id: "AWAITING_APPROVAL", label: "Awaiting approval" },
  { id: "FAILED", label: "Failed" },
  { id: "PENDING", label: "In progress" },
  { id: "SUCCESSFUL", label: "Successful" },
];
const TONE = { AWAITING_APPROVAL: "amber", FAILED: "red", PENDING: "blue", SUCCESSFUL: "green" } as const;

// ADM-05: withdrawals by status with provider responses; approve, decline, retry; freeze wallets.
export default async function PayoutsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const raw = (await searchParams).status;
  const status = TABS.find((t) => t.id === raw)?.id ?? "AWAITING_APPROVAL";
  const [rows, counts] = await Promise.all([
    db.withdrawal.findMany({
      where: { status },
      orderBy: { requestedAt: "desc" },
      take: 200,
      include: { bankAccount: true, instructor: { select: { id: true, firstName: true, lastName: true, email: true, walletFrozenAt: true } } },
    }),
    db.withdrawal.groupBy({ by: ["status"], _count: true }),
  ]);
  return (
    <>
      <AdminHeader title="Payouts" subtitle={`Withdrawals over ${formatNaira(BUSINESS.withdrawalApprovalKobo)} wait here for approval. The instructor’s funds stay reserved meanwhile.`} />
      <nav className="flex flex-wrap gap-2 text-[13px]">
        {TABS.map((t) => (
          <Link key={t.id} href={`/admin/payouts?status=${t.id}`} className={t.id === status ? "rounded-full bg-primary px-3 py-1 font-semibold text-white no-underline hover:text-white" : "rounded-full border border-line px-3 py-1 text-ink-2 no-underline"}>
            {t.label} ({counts.find((c) => c.status === t.id)?._count ?? 0})
          </Link>
        ))}
      </nav>
      <AdminTable head={["Reference", "Instructor", "Amount", "Bank", "Requested", "Provider", ""]} empty="No withdrawals in this state.">
        {rows.map((w) => (
          <tr key={w.id}>
            <Td className="text-xs whitespace-nowrap">{w.reference}{w.attempts > 1 && <span className="block text-ink-3">Attempt {w.attempts}</span>}</Td>
            <Td>
              <Link href={`/admin/users/${w.instructor.id}`}>{w.instructor.firstName} {w.instructor.lastName}</Link>
              {w.instructor.walletFrozenAt && <span className="ml-1"><Pill tone="red">Frozen</Pill></span>}
            </Td>
            <Td className="whitespace-nowrap">{formatNaira(w.amountKobo)}<span className="block text-xs text-ink-3">+ {formatNaira(w.feeKobo)} fee</span></Td>
            <Td className="text-ink-3">{w.bankAccount.bankName} ••••{w.bankAccount.accountNumberLast4}<span className="block text-xs">{w.bankAccount.accountName}</span></Td>
            <Td className="text-ink-3">{when(w.requestedAt)}</Td>
            <Td className="max-w-[240px] text-xs text-ink-2">
              <Pill tone={TONE[w.status]}>{TABS.find((t) => t.id === w.status)?.label}</Pill>
              {w.providerRef && <span className="mt-1 block text-ink-3">{w.providerRef}</span>}
              {w.failureReason && <span className="mt-1 block text-danger-text">{w.failureReason}</span>}
            </Td>
            <Td className="text-right">
              <div className="flex justify-end gap-2">
                {w.status === "AWAITING_APPROVAL" && (
                  <>
                    <AdminAction endpoint={`/api/admin/withdrawals/${w.id}`} body={{ action: "reject" }} label="Decline" variant="outline" title="Decline this withdrawal?" description="The funds go back to the instructor’s available balance." fields={[{ name: "reason", label: "Reason (shown to the instructor)", type: "textarea", minLength: 10 }]} success="Withdrawal declined" busyLabel="Declining…" />
                    <AdminAction endpoint={`/api/admin/withdrawals/${w.id}`} body={{ action: "approve" }} label="Approve" title={`Send ${formatNaira(w.amountKobo)}?`} description={`The transfer to ${w.bankAccount.bankName} ••••${w.bankAccount.accountNumberLast4} starts immediately.`} confirmLabel="Approve and send" success="Withdrawal approved" busyLabel="Sending…" />
                  </>
                )}
                {w.status === "FAILED" && (
                  <AdminAction endpoint={`/api/admin/withdrawals/${w.id}`} body={{ action: "retry" }} label="Retry transfer" title="Retry this transfer?" description="The amount is reserved again from the instructor’s available balance and the transfer restarts." confirmLabel="Retry" success="Transfer retried" busyLabel="Retrying…" />
                )}
              </div>
            </Td>
          </tr>
        ))}
      </AdminTable>
    </>
  );
}
