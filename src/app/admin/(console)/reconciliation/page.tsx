import type { Metadata } from "next";
import { AdminAction } from "@/features/admin/AdminAction";
import { AdminHeader, AdminTable, Pill, Td, when } from "@/features/admin/Table";
import { db } from "@/lib/db";
import type { Mismatch } from "@/lib/reconcile";

export const metadata: Metadata = { title: "Reconciliation" };

// ADM-06: daily ledger vs provider comparison. The nightly job calls /api/cron/reconcile.
export default async function ReconciliationPage() {
  const runs = await db.reconciliationRun.findMany({ orderBy: { createdAt: "desc" }, take: 30 });
  const latest = runs[0];
  const latestMismatches = (latest?.mismatches ?? []) as unknown as Mismatch[];
  return (
    <>
      <AdminHeader title="Reconciliation" subtitle="Compares paid orders and withdrawals in our ledger with the payment provider. Runs nightly for the previous day (WAT).">
        <div className="flex gap-2">
          <AdminAction endpoint="/api/admin/reconcile" body={{ days: 1 }} label="Run last 24 h" success="Reconciliation finished" busyLabel="Running…" />
          <AdminAction endpoint="/api/admin/reconcile" body={{ days: 30 }} label="Run last 30 days" variant="outline" success="Reconciliation finished" busyLabel="Running…" />
        </div>
      </AdminHeader>
      {latest && (
        <section className="flex flex-col gap-3">
          <h2 className="m-0 text-lg font-semibold">Latest run · {when(latest.createdAt)}</h2>
          <AdminTable head={["Type", "Reference", "Detail"]} empty={`All ${latest.checked} records match.`}>
            {latestMismatches.map((m, i) => (
              <tr key={i}>
                <Td><Pill tone="red">{m.kind.replace(/_/g, " ")}</Pill></Td>
                <Td className="text-xs">{m.reference}</Td>
                <Td className="text-ink-2">{m.detail}</Td>
              </tr>
            ))}
          </AdminTable>
        </section>
      )}
      <h2 className="m-0 text-lg font-semibold">History</h2>
      <AdminTable head={["Run at", "Period", "Records checked", "Mismatches", "Started by"]} empty="No runs yet. Run one now, or schedule the nightly job (see docs/BUILD-NOTES.md).">
        {runs.map((r) => {
          const n = Array.isArray(r.mismatches) ? r.mismatches.length : 0;
          return (
            <tr key={r.id}>
              <Td>{when(r.createdAt)}</Td>
              <Td className="text-ink-3">{when(r.periodStart)} → {when(r.periodEnd)}</Td>
              <Td>{r.checked}</Td>
              <Td>{n ? <Pill tone="red">{n}</Pill> : <Pill tone="green">0</Pill>}</Td>
              <Td className="text-ink-3">{r.runById ? "Staff" : "Nightly job"}</Td>
            </tr>
          );
        })}
      </AdminTable>
    </>
  );
}
