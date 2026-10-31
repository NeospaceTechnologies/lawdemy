import type { Metadata } from "next";
import Link from "next/link";
import { Topbar } from "@/components/learner/Topbar";
import { CourseCard, CourseGrid } from "@/components/learner/CourseCard";
import { SearchIcon } from "@/components/ui/icons";
import { db } from "@/lib/db";
import { listCourses } from "@/lib/catalog";
import { requireLearnerPage } from "@/lib/auth/pages";
import { POPULAR_SEARCHES } from "@/lib/taxonomy";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { user } = await requireLearnerPage();
  const q = ((await searchParams).q ?? "").trim().slice(0, 100);
  const { cards } = q ? await listCourses({ q }, "popular", 60) : { cards: [] };
  if (q) await db.recentSearch.create({ data: { userId: user.id, query: q } });
  return (
    <>
      <Topbar back="/courses" query={q} />
      <h1 className="m-0 text-[28px] font-bold tracking-[-0.01em]">All results for “{q}”</h1>
      {cards.length ? (
        <CourseGrid>{cards.map((c) => <CourseCard key={c.id} c={c} />)}</CourseGrid>
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-ink-3"><SearchIcon size={24} /></span>
          <h2 className="m-0 text-lg font-semibold">No Matches Found</h2>
          <p className="m-0 text-[13px] text-ink-3">Try these popular searches instead.</p>
          <div className="flex max-w-[360px] flex-wrap justify-center gap-2">
            {POPULAR_SEARCHES.map((p) => (
              <Link key={p} href={`/search?q=${encodeURIComponent(p)}`} className="inline-flex h-8 items-center gap-1.5 rounded-control border border-line px-2.5 text-xs text-ink-2 no-underline">
                <SearchIcon size={12} className="text-muted" />{p}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
