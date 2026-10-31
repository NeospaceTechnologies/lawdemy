import type { Metadata } from "next";
import Link from "next/link";
import { InstructorTopbar } from "@/components/layout/InstructorTopbar";
import { buttonClass } from "@/components/ui/Button";
import { ChevronLeftIcon, SearchIcon } from "@/components/ui/icons";
import { COURSE_STATUS_LABEL, StatusBadge } from "@/components/ui/StatusBadge";
import { db } from "@/lib/db";
import { requireInstructorPage } from "@/lib/auth/pages";
import { courseRows } from "@/lib/instructor";

export const metadata: Metadata = { title: "Search your courses" };

export default async function InstructorSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { user } = await requireInstructorPage();
  const q = ((await searchParams).q ?? "").trim();
  const [rows, unread] = await Promise.all([courseRows(user.id), db.notification.count({ where: { userId: user.id, readAt: null } })]);
  const results = q ? rows.filter((r) => r.title.toLowerCase().includes(q.toLowerCase())) : [];
  return (
    <>
      <InstructorTopbar unread={unread} query={q} />
      <div className="flex items-center gap-3">
        <Link href="/instructor/courses" aria-label="Back to My Courses" className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-line text-ink-2"><ChevronLeftIcon /></Link>
        <h1 className="m-0 text-[26px] font-bold">{q ? `All results for “${q}”` : "Search your courses"}</h1>
      </div>
      {results.length > 0 && (
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4 p-0">
          {results.map((c) => (
            <li key={c.id} className="flex flex-col overflow-hidden rounded-card border border-line bg-white shadow-[0_1px_3px_rgba(16,24,40,0.08)]">
              <div className="flex h-[140px] items-end bg-[#2B2F36] bg-cover bg-center p-2.5" style={c.thumbnailUrl ? { backgroundImage: `url(${c.thumbnailUrl})` } : undefined}>
                {!c.thumbnailUrl && <span className="rounded border border-line-input/60 px-1.5 py-0.5 text-[11px] text-line-input">[Course image]</span>}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-3">
                <strong className="text-[15px] leading-[1.35]">{c.title}</strong>
                <span className="flex items-center justify-between gap-2 text-xs text-ink-3">{c.level ?? "All levels"}<StatusBadge status={COURSE_STATUS_LABEL[c.status as keyof typeof COURSE_STATUS_LABEL]} /></span>
                <span className="text-[15px] font-bold text-price">{c.priceLabel}</span>
                <Link href={`/instructor/courses/${c.id}`} className={buttonClass("primary", "md", "mt-auto h-10")}>View Course</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
      {q && results.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-ink-3"><SearchIcon size={24} /></span>
          <strong className="text-lg">No results found for “{q}”</strong>
          <p className="m-0 max-w-[420px] text-[13px] text-ink-3">We couldn’t find any of your courses matching this search. Check the spelling or try a different keyword.</p>
          <Link href="/instructor/courses" className={buttonClass("primary", "md")}>Go to My Courses</Link>
        </div>
      )}
    </>
  );
}
