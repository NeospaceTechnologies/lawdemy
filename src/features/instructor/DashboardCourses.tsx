"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { COURSE_STATUS_LABEL, StatusBadge } from "@/components/ui/StatusBadge";
import type { CourseRow } from "@/lib/instructor";

const STATUS_FILTERS = ["All", "LIVE", "DRAFT", "UNDER_REVIEW", "REJECTED", "ARCHIVED"] as const;

/** Dashboard "My Courses" table with status and date filters (Inst-Dashboard.dc.html). */
export function DashboardCourses({ rows }: { rows: CourseRow[] }) {
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const shown = useMemo(
    () =>
      rows.filter((r) => {
        if (status !== "All" && r.status !== status) return false;
        const d = r.updatedAt.slice(0, 10);
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      }),
    [rows, status, from, to],
  );
  const sel = "h-9 rounded-control border border-line-input bg-white px-2 text-[13px]";
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-lg font-semibold">My Courses</h2>
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-1.5 text-xs text-ink-3">Status
            <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={sel}>
              {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s === "All" ? "All" : COURSE_STATUS_LABEL[s]}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-ink-3">From <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={sel} /></label>
          <label className="flex items-center gap-1.5 text-xs text-ink-3">To <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={sel} /></label>
        </div>
      </div>
      <div className="overflow-x-auto rounded-card border border-line">
        <table className="w-full min-w-[760px] border-collapse text-[13px]">
          <thead>
            <tr className="bg-surface text-left text-xs text-ink-3">
              {["Course", "Status", "Learners", "Rating", "Earnings", "Last updated"].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <Link href={`/instructor/courses/${r.id}`} className="flex items-center gap-2.5 font-semibold text-ink no-underline hover:underline">
                    <span aria-hidden="true" className="h-7 w-10 flex-none rounded bg-[#2B2F36] bg-cover bg-center" style={r.thumbnailUrl ? { backgroundImage: `url(${r.thumbnailUrl})` } : undefined} />
                    {r.title}
                  </Link>
                </td>
                <td className="px-4 py-3"><StatusBadge status={COURSE_STATUS_LABEL[r.status as keyof typeof COURSE_STATUS_LABEL]} /></td>
                <td className="px-4 py-3 tabular-nums">{r.status === "DRAFT" || r.status === "UNDER_REVIEW" ? "—" : r.learners.toLocaleString("en-NG")}</td>
                <td className="px-4 py-3">{r.rating ?? "—"}</td>
                <td className="px-4 py-3 tabular-nums">{r.earnings ?? "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap text-ink-3">{r.updatedLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 && <p className="m-0 p-6 text-center text-[13px] text-ink-3">No courses match these filters.</p>}
      </div>
    </section>
  );
}
