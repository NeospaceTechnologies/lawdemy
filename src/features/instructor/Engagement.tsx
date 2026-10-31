"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { CloseIcon, FilterIcon, SearchIcon, SortIcon } from "@/components/ui/icons";
import { SlideOver } from "@/components/ui/SlideOver";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { LearnerRow } from "@/lib/engagement";

const PER_PAGE = 8;
const lastLabel = (d: number) => (d === 0 ? "Today" : d === 1 ? "Yesterday" : `${d} days ago`);
const COMP_ORDER = { Completed: 0, "In Progress": 1, "Not Started": 2 };
const SORTS: [string, (a: LearnerRow, b: LearnerRow) => number][] = [
  ["Last Active (Newest to Oldest)", (a, b) => a.lastActiveDays - b.lastActiveDays],
  ["Last Active (Oldest to Newest)", (a, b) => b.lastActiveDays - a.lastActiveDays],
  ["Course Completion (Completed → Not Started)", (a, b) => COMP_ORDER[a.completion] - COMP_ORDER[b.completion]],
  ["Final Quiz (Done → Not Started)", (a, b) => (a.quiz === "Done" ? 0 : 1) - (b.quiz === "Done" ? 0 : 1)],
  ["Most Questions Asked", (a, b) => b.qa - a.qa],
  ["Fewest Questions Asked", (a, b) => a.qa - b.qa],
];
type FKey = "role" | "last" | "quiz" | "qa" | "comp";
const FIELDS: { key: FKey; label: string; opts: string[]; test: (r: LearnerRow, v: string) => boolean }[] = [
  { key: "role", label: "Role", opts: ["Lawyer", "Non-Lawyer"], test: (r, v) => r.role === v },
  { key: "last", label: "Last Active", opts: ["Today", "Past 7 days", "Past 30 days", "More than 30 days ago"], test: (r, v) => (v === "Today" ? r.lastActiveDays === 0 : v === "Past 7 days" ? r.lastActiveDays <= 7 : v === "Past 30 days" ? r.lastActiveDays <= 30 : r.lastActiveDays > 30) },
  { key: "quiz", label: "Final Quiz Status", opts: ["Done", "Not Started"], test: (r, v) => r.quiz === v },
  { key: "qa", label: "Questions Asked", opts: ["None", "1 – 3", "4 or more"], test: (r, v) => (v === "None" ? r.qa === 0 : v === "1 – 3" ? r.qa >= 1 && r.qa <= 3 : r.qa >= 4) },
  { key: "comp", label: "Course Completion", opts: ["Completed", "In Progress", "Not Started"], test: (r, v) => r.completion === v },
];
const compBadge = (c: LearnerRow["completion"]) => (c === "Completed" ? "bg-success-bg text-success" : c === "In Progress" ? "bg-warning-bg text-warning-text" : "bg-surface-2 text-ink-2");

/** Learner activity for a course (Inst-CourseEngagement.dc.html, INS-ENG-01..03). */
export function Engagement({ data, quizTitle }: { data: { total: number; attempted: number; avgScore: number | null; rows: LearnerRow[] }; quizTitle: string | null }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState(0);
  const [sortOpen, setSortOpen] = useState(false);
  const [filters, setFilters] = useState<Partial<Record<FKey, string>>>({});
  const [draft, setDraft] = useState<Partial<Record<FKey, string>> | null>(null);
  const [page, setPage] = useState(1);
  const [learner, setLearner] = useState<LearnerRow | null>(null);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return data.rows.filter((r) => (!needle || r.name.toLowerCase().includes(needle)) && FIELDS.every((f) => !filters[f.key] || f.test(r, filters[f.key]!))).sort(SORTS[sort][1]);
  }, [data.rows, q, filters, sort]);
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const current = Math.min(page, pages);
  const chips = FIELDS.filter((f) => filters[f.key]);

  if (data.total === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <strong className="text-base">No learners enrolled yet</strong>
        <p className="m-0 text-[13px] text-ink-3">Once learners start enrolling, their progress and feedback will appear here.</p>
      </div>
    );
  }

  const attemptedPct = Math.round((data.attempted / data.total) * 100);
  return (
    <>
      <section aria-label="Engagement summary" className="flex flex-col gap-3 rounded-card border border-line px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-semibold">Total Enrolled</span>
          <strong className="text-[22px]">{data.total.toLocaleString("en-NG")}</strong>
        </div>
        <div className="grid gap-x-3 gap-y-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="flex justify-between text-xs text-ink-3">Average Quiz Score<strong className="text-ink">{data.avgScore === null ? "—" : `${data.avgScore}%`}</strong></span>
            <span className="h-2 overflow-hidden rounded bg-line" role="progressbar" aria-label="Average quiz score" aria-valuenow={data.avgScore ?? 0} aria-valuemin={0} aria-valuemax={100}>
              <span className="block h-full rounded bg-success-light" style={{ width: `${data.avgScore ?? 0}%` }} />
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="flex justify-between text-xs text-ink-3">Quiz Attempted<strong className="text-ink">{data.attempted} of {data.total}</strong></span>
            <span className="h-2 overflow-hidden rounded bg-line" role="progressbar" aria-label="Learners who attempted the quiz" aria-valuenow={attemptedPct} aria-valuemin={0} aria-valuemax={100}>
              <span className="block h-full rounded bg-[#667085]" style={{ width: `${attemptedPct}%` }} />
            </span>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 text-lg font-semibold">Learner Activity</h2>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex h-9 w-[260px] max-w-full items-center gap-2 rounded-control border border-line-input px-3">
              <SearchIcon className="text-muted" />
              <input type="search" aria-label="Search learners by name" placeholder="Search learners by name…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="min-w-0 flex-1 border-0 bg-transparent text-[13px] outline-none" />
            </label>
            <div className="relative">
              <Button variant="outline" size="sm" aria-expanded={sortOpen} onClick={() => setSortOpen((o) => !o)}><SortIcon />Sort</Button>
              {sortOpen && (
                <ul role="listbox" aria-label="Sort learners" className="absolute right-0 z-20 m-0 mt-1 w-72 list-none rounded-[10px] border border-line bg-white p-1.5 shadow-lg">
                  {SORTS.map(([label], i) => (
                    <li key={label}>
                      <button type="button" role="option" aria-selected={i === sort} onClick={() => { setSort(i); setSortOpen(false); }} className={clsx("flex h-9 w-full items-center rounded-md border-0 px-2.5 text-left text-[13px]", i === sort ? "bg-surface-2 font-semibold" : "bg-transparent hover:bg-surface")}>{label}</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => setDraft({ ...filters })}><FilterIcon />Filter</Button>
          </div>
        </div>
        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-ink-3">Showing {list.length} results for</span>
            {chips.map((f) => (
              <span key={f.key} className="inline-flex h-7 items-center gap-1 rounded-md border border-line-input pr-1 pl-2.5 text-ink-2">
                {filters[f.key]}
                <button type="button" aria-label={`Remove filter ${filters[f.key]}`} onClick={() => { setFilters({ ...filters, [f.key]: "" }); setPage(1); }} className="flex h-5 w-5 items-center justify-center border-0 bg-transparent text-ink-3"><CloseIcon size={9} /></button>
              </span>
            ))}
            <button type="button" onClick={() => { setFilters({}); setPage(1); }} className="border-0 bg-transparent font-semibold text-primary">Clear all</button>
          </div>
        )}
        <div className="overflow-x-auto rounded-card border border-line">
          <table className="w-full min-w-[860px] border-collapse text-[13px]">
            <thead>
              <tr className="bg-surface text-left text-xs text-ink-3">
                {["Learner", "Role", "Last Active", "Final Quiz", "Questions Asked", "Course Completion"].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}
                <th scope="col" className="px-4 py-3"><span className="sr-only">Details</span></th>
              </tr>
            </thead>
            <tbody>
              {list.slice((current - 1) * PER_PAGE, current * PER_PAGE).map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="px-4 py-3"><span className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E0E7FF] text-[10px] font-bold text-[#3730A3]">{r.initials}</span>{r.name}</span></td>
                  <td className="px-4 py-3 text-ink-3">{r.role}</td>
                  <td className="px-4 py-3 text-ink-3">{lastLabel(r.lastActiveDays)}</td>
                  <td className="px-4 py-3"><span className={clsx("inline-flex h-[22px] items-center rounded-full px-2 text-[11px] font-semibold", r.quiz === "Done" ? "bg-success-bg text-success" : "bg-surface-2 text-ink-2")}>{r.quiz}</span></td>
                  <td className="px-4 py-3 tabular-nums">{r.qa}</td>
                  <td className="px-4 py-3"><span className={clsx("inline-flex h-[22px] items-center rounded-full px-2 text-[11px] font-semibold", compBadge(r.completion))}>{r.completion}</span></td>
                  <td className="px-4 py-3 text-right"><button type="button" onClick={() => setLearner(r)} className="border-0 bg-transparent font-semibold text-primary">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <p className="m-0 p-6 text-center text-[13px] text-ink-3">No learners match your search or filters.</p>}
        </div>
        <nav aria-label="Pagination" className="flex items-center justify-between text-[13px] text-ink-3">
          <Button variant="outline" size="sm" disabled={current <= 1} onClick={() => setPage(current - 1)}>Previous</Button>
          <span>Page {current} of {pages}</span>
          <Button variant="outline" size="sm" disabled={current >= pages} onClick={() => setPage(current + 1)}>Next</Button>
        </nav>
      </section>

      <Dialog open={!!draft} title="Filter learners" onRequestClose={() => setDraft(null)}>
        {draft && (
          <>
            {FIELDS.map((f) => (
              <label key={f.key} className="flex flex-col gap-1.5 text-xs font-semibold">
                {f.label}
                <select value={draft[f.key] ?? ""} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} className="h-10 rounded-control border border-line-input bg-surface px-2.5 text-[13px] font-normal">
                  <option value="">Please select</option>
                  {f.opts.map((o) => <option key={o}>{o}</option>)}
                </select>
              </label>
            ))}
            <div className="grid grid-cols-2 gap-2.5">
              <Button variant="outline" size="md" className="h-10" onClick={() => setDraft(null)}>Cancel</Button>
              <Button size="md" className="h-10" disabled={!Object.values(draft).some(Boolean)} onClick={() => { setFilters(draft); setDraft(null); setPage(1); }}>Apply</Button>
            </div>
          </>
        )}
      </Dialog>

      <SlideOver open={!!learner} title="Learner Engagement" description="Track this learner’s engagement and activity across this course." onRequestClose={() => setLearner(null)} width={520}>
        {learner && (
          <>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E0E7FF] text-sm font-bold text-[#3730A3]">{learner.initials}</span>
              <div className="flex flex-col gap-0.5"><strong className="text-[15px]">{learner.name}</strong><span className="text-xs text-ink-3">Role: {learner.role} • Jurisdiction: {learner.jurisdiction}</span></div>
            </div>
            <section className="flex flex-col gap-2 rounded-card border border-line p-4">
              <h3 className="m-0 text-sm font-semibold">Overview</h3>
              <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px]">
                <dt className="text-ink-3">Modules Completed</dt><dd className="m-0">{learner.modulesDone} of {learner.modulesTotal}</dd>
                <dt className="text-ink-3">Course Progress</dt><dd className="m-0"><span className={clsx("inline-flex h-[22px] items-center rounded-full px-2 text-[11px] font-semibold", compBadge(learner.completion))}>{learner.completion} · {learner.progressPct}%</span></dd>
                <dt className="text-ink-3">Last Active</dt><dd className="m-0">{lastLabel(learner.lastActiveDays)}</dd>
                <dt className="text-ink-3">Current Module</dt><dd className="m-0">{learner.currentModule}</dd>
                <dt className="text-ink-3">Questions Asked</dt><dd className="m-0">{learner.qa} {learner.firstQuestionId && <Link href={`/instructor/questions/${learner.firstQuestionId}`} className="ml-1 font-semibold">View</Link>}</dd>
              </dl>
            </section>
            <section className="flex flex-col gap-2 rounded-card border border-line p-4">
              <h3 className="m-0 text-sm font-semibold">Quiz Attempt</h3>
              {learner.attempt ? (
                <table className="w-full border-collapse text-[13px]">
                  <thead><tr className="text-left text-xs text-ink-3"><th className="py-1.5 font-medium">Title</th><th className="py-1.5 font-medium">Score</th><th className="py-1.5 font-medium">Attempted</th><th className="py-1.5 font-medium">Status</th></tr></thead>
                  <tbody><tr className="border-t border-line"><td className="py-2">{quizTitle ?? "Final quiz"}</td><td className="py-2">{learner.attempt.scorePct}%</td><td className="py-2">{learner.attempt.at}</td><td className="py-2"><StatusBadge status={learner.attempt.passed ? "Successful" : "Failed"} /></td></tr></tbody>
                </table>
              ) : (
                <div className="flex flex-col gap-1 text-[13px]"><strong>No quiz attempts yet</strong><span className="text-ink-3">This learner hasn’t attempted the final assessment for this course. Once they do, the results and feedback will appear here.</span></div>
              )}
            </section>
          </>
        )}
      </SlideOver>
    </>
  );
}
