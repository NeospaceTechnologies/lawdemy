"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Button, buttonClass } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { BookIcon, ChevronDownIcon, PlusIcon, SearchIcon } from "@/components/ui/icons";
import { COURSE_STATUS_LABEL, StatusBadge } from "@/components/ui/StatusBadge";
import type { CourseRow } from "@/lib/instructor";

const COLORS = { LIVE: "#17B26A", DRAFT: "#101828", REJECTED: "#D92D20", UNDER_REVIEW: "#F79009", ARCHIVED: "#98A2B3" } as const;
const ORDER = ["LIVE", "DRAFT", "REJECTED", "UNDER_REVIEW", "ARCHIVED"] as const;
const FAQ: Record<(typeof ORDER)[number], string> = {
  LIVE: "Your course has been approved and is visible to learners. They can enrol, and you can track engagement.",
  DRAFT: "You’ve started this course but haven’t submitted it yet. Only you can see it. Finish building and publish when ready.",
  UNDER_REVIEW: "You’ve submitted the course and the Lawdemy team is checking it. Reviews usually take 24–48 hours, and editing is paused meanwhile.",
  REJECTED: "The course needs changes before it can go live. Open it to read the reviewer’s notes, update it and resubmit.",
  ARCHIVED: "The course is hidden from new learners. Anyone already enrolled keeps access. You can restore it at any time.",
};

/** Instructor My Courses: status summary, statuses explainer and course library (Inst-MyCourses.dc.html). */
export function CourseLibrary({ rows }: { rows: CourseRow[] }) {
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [sort, setSort] = useState<"recent" | "az" | "learners">("recent");
  const [status, setStatus] = useState<"All" | (typeof ORDER)[number]>("All");
  const [explain, setExplain] = useState(false);
  const [faqOpen, setFaqOpen] = useState(0);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = rows.filter((r) => (status === "All" || r.status === status) && (!needle || r.title.toLowerCase().includes(needle)) && (!from || r.updatedAt.slice(0, 10) >= from));
    if (sort === "az") out = [...out].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "learners") out = [...out].sort((a, b) => b.learners - a.learners);
    return out;
  }, [rows, q, from, sort, status]);

  const sel = "h-9 rounded-control border border-line-input bg-white px-2 text-[13px]";
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-[28px] font-bold">My Courses</h1>
          <p className="m-0 text-sm text-ink-3">Create, manage, and track all your courses here.</p>
        </div>
        <Link href="/instructor/courses/new" className={buttonClass("primary", "md")}><PlusIcon size={14} /> Create Course</Link>
      </div>

      <section aria-label="Course status summary" className="overflow-hidden rounded-card border border-line">
        <div className="flex flex-col gap-3.5 px-[18px] py-4">
          <div className="flex items-center justify-between"><span className="text-sm font-semibold">Total Courses</span><strong className="text-[22px] tabular-nums">{rows.length}</strong></div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-3">
            {ORDER.map((k) => (
              <div key={k} className="flex flex-col gap-1.5">
                <span className="flex justify-between text-xs text-ink-3">{k === "DRAFT" ? "Drafts" : COURSE_STATUS_LABEL[k]}<strong className="text-ink tabular-nums">{rows.filter((r) => r.status === k).length}</strong></span>
                <span className="h-2 rounded" style={{ background: COLORS[k] }} />
              </div>
            ))}
          </div>
        </div>
        <button type="button" onClick={() => setExplain(true)} className="flex h-10 w-full items-center justify-between border-0 bg-info px-[18px] text-[13px] font-semibold text-white">What do these mean? <ChevronDownIcon size={14} className="-rotate-90" /></button>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="m-0 text-lg font-semibold">Course Library</h2>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-line-input px-6 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-card bg-info-tint text-info-text"><BookIcon size={22} /></span>
            <strong className="text-base">Start your first course</strong>
            <p className="m-0 max-w-[460px] text-[13px] text-ink-3">You haven’t created any courses yet. Share your legal knowledge with learners across Africa. It only takes a few steps.</p>
            <Link href="/instructor/courses/new" className={buttonClass("primary", "md", "mt-2")}>Create Course</Link>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <label className="flex h-[38px] w-[280px] max-w-full items-center gap-2 rounded-control border border-line-input px-3">
                <SearchIcon className="text-muted" />
                <input type="search" aria-label="Search course library" placeholder="Search courses…" value={q} onChange={(e) => setQ(e.target.value)} className="min-w-0 flex-1 border-0 bg-transparent text-[13px] outline-none" />
              </label>
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center gap-1.5 text-xs text-ink-3">Updated after <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={sel} /></label>
                <label className="flex items-center gap-1.5 text-xs text-ink-3">Sort
                  <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className={sel}><option value="recent">Recently updated</option><option value="az">Title A–Z</option><option value="learners">Most learners</option></select>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-ink-3">Status
                  <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={sel}>
                    <option value="All">All</option>
                    {ORDER.map((k) => <option key={k} value={k}>{COURSE_STATUS_LABEL[k]}</option>)}
                  </select>
                </label>
              </div>
            </div>
            <div className="overflow-x-auto rounded-card border border-line">
              <table className="w-full min-w-[820px] border-collapse text-[13px]">
                <thead>
                  <tr className="bg-surface text-left text-xs text-ink-3">
                    {["Course", "Category", "Level"].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}
                    <th scope="col" className="px-4 py-3 text-right font-medium">Enrolled Students</th>
                    <th scope="col" className="px-4 py-3 font-medium">Status</th>
                    <th scope="col" className="px-4 py-3 font-medium">Last updated</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((c) => (
                    <tr key={c.id} className="border-t border-line">
                      <td className="px-4 py-3">
                        <Link href={`/instructor/courses/${c.id}`} className="flex items-center gap-2.5 font-medium text-ink no-underline hover:underline">
                          <span aria-hidden="true" className="h-7 w-10 flex-none rounded bg-[#2B2F36] bg-cover bg-center" style={c.thumbnailUrl ? { backgroundImage: `url(${c.thumbnailUrl})` } : undefined} />
                          {c.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-ink-3">{c.category ?? "—"}</td>
                      <td className="px-4 py-3 text-ink-3">{c.level ?? "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{c.learners.toLocaleString("en-NG")}</td>
                      <td className="px-4 py-3"><StatusBadge status={COURSE_STATUS_LABEL[c.status as keyof typeof COURSE_STATUS_LABEL]} /></td>
                      <td className="px-4 py-3 whitespace-nowrap text-ink-3">{c.updatedLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {shown.length === 0 && (
                <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                  <strong className="text-[15px]">No Results Found</strong>
                  <p className="m-0 text-[13px] text-ink-3">We couldn’t find any course matching your search or filters.</p>
                  <Button variant="outline" size="sm" className="mt-1" onClick={() => { setQ(""); setStatus("All"); setFrom(""); }}>Clear search &amp; filters</Button>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      <Dialog open={explain} title="Understanding Course Statuses" description="Each status shows where your course is in the review and publishing process." onRequestClose={() => setExplain(false)} width={520}>
        <div className="flex flex-col">
          {ORDER.map((k, i) => (
            <div key={k} className="border-b border-line last:border-b-0">
              <button type="button" aria-expanded={faqOpen === i} onClick={() => setFaqOpen(faqOpen === i ? -1 : i)} className="flex w-full items-center justify-between gap-2 border-0 bg-transparent py-3 text-left text-sm font-medium">
                <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[k] }} />What does “{COURSE_STATUS_LABEL[k]}” mean?</span>
                <ChevronDownIcon size={14} className={clsx("text-ink-3 transition-transform", faqOpen === i && "rotate-180")} />
              </button>
              {faqOpen === i && <p className="m-0 pb-3 pl-[18px] text-[13px] leading-normal text-ink-3">{FAQ[k]}</p>}
            </div>
          ))}
        </div>
        <Button className="self-end" size="md" onClick={() => setExplain(false)}>Got it</Button>
      </Dialog>
    </>
  );
}
