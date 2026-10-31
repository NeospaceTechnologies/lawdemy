import type { ReactNode } from "react";
import clsx from "clsx";

// Plain table and page chrome for the staff console (no designs exist; PRD 11 asks for table-based).

export function AdminHeader({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-2xl font-bold">{title}</h1>
        {subtitle && <p className="m-0 text-sm text-ink-3">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function AdminTable({ head, children, empty }: { head: string[]; children: ReactNode; empty?: string }) {
  const rows = Array.isArray(children) ? children.flat().filter(Boolean) : children ? [children] : [];
  if (!rows.length) return <p className="m-0 rounded-card border border-dashed border-line-input p-6 text-center text-[13px] text-ink-3">{empty ?? "Nothing here."}</p>;
  return (
    <div className="overflow-x-auto rounded-card border border-line">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="bg-surface text-left text-xs text-ink-3">
            {head.map((h, i) => <th key={i} scope="col" className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={clsx("border-t border-line px-4 py-3 align-top", className)}>{children}</td>;
}

export function Pill({ tone = "grey", children }: { tone?: "grey" | "green" | "amber" | "red" | "blue"; children: ReactNode }) {
  const tones = { grey: "bg-surface-2 text-ink-2", green: "bg-success-bg text-success", amber: "bg-warning-bg text-warning-text", red: "bg-danger-bg text-danger-text", blue: "bg-info-tint text-info-text" };
  return <span className={clsx("inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap", tones[tone])}>{children}</span>;
}

/** GET search/filter form; works without JavaScript. */
export function FilterBar({ children }: { children: ReactNode }) {
  return <form method="get" className="flex flex-wrap items-end gap-2">{children}</form>;
}

export const inputCls = "h-9 rounded-control border border-line-input bg-white px-3 text-[13px]";
export const linkBtn = "inline-flex h-9 items-center rounded-control bg-primary px-3 text-[13px] font-semibold text-white no-underline hover:bg-primary-hover hover:text-white";

export function when(d: Date | null | undefined) {
  return d ? d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" }) : "—";
}
