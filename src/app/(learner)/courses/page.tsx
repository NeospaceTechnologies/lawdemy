import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Topbar } from "@/components/learner/Topbar";
import { CourseCard, CourseGrid } from "@/components/learner/CourseCard";
import { SortFilter } from "@/components/learner/SortFilter";
import { EmptyState } from "@/components/ui/EmptyState";
import { CloseIcon } from "@/components/ui/icons";
import { CategoryNav } from "@/features/discovery/CategoryNav";
import { LoadMoreGrid } from "@/features/discovery/LoadMoreGrid";
import { listCourses, parseFilters, type CatalogFilters } from "@/lib/catalog";
import { getTaxonomy } from "@/lib/taxonomy-store";

export const metadata: Metadata = { title: "Courses" };

type SP = Record<string, string | string[] | undefined>;

function chips(sp: SP, f: CatalogFilters) {
  const out: { label: string; href: string }[] = [];
  const without = (key: string, value?: string) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string") p.set(k, v);
    if (value && key === "category") {
      const rest = (p.get("category") ?? "").split("|").filter((c) => c && c !== value);
      if (rest.length) p.set("category", rest.join("|"));
      else p.delete("category");
    } else p.delete(key);
    if (key === "price") {
      p.delete("min");
      p.delete("max");
    }
    return `/courses?${p.toString()}`;
  };
  f.categories?.forEach((c) => out.push({ label: c, href: without("category", c) }));
  if (f.level) out.push({ label: f.level, href: without("level") });
  if (f.price) out.push({ label: { discount: "Discounted sale", free: "Free", paid: "Paid" }[f.price], href: without("price") });
  if (f.minKobo || f.maxKobo) out.push({ label: `₦${(f.minKobo ?? 0) / 100}–₦${f.maxKobo ? f.maxKobo / 100 : "any"}`, href: without("min") });
  if (f.newArrivals) out.push({ label: "New Arrivals", href: without("new") });
  if (f.certificate) out.push({ label: "Certificate: Yes", href: without("cert") });
  return out;
}

export default async function CoursesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { filters, sort } = parseFilters(sp);
  const filtered = sp.filtered === "1";

  if (!filtered) {
    // Courses-All: one category at a time.
    const active = filters.categories?.[0] ?? (await getTaxonomy()).category[0];
    const { cards } = await listCourses({ categories: [active] }, sort);
    return (
      <>
        <Topbar back="/dashboard" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="m-0 text-[28px] font-bold tracking-[-0.01em]">{active}</h1>
          <Suspense><SortFilter /></Suspense>
        </div>
        <Suspense><CategoryNav value={active} /></Suspense>
        {cards.length ? <CourseGrid>{cards.map((c) => <CourseCard key={c.id} c={c} />)}</CourseGrid> : <EmptyState dashed body="No courses in this category yet. Check back soon." />}
      </>
    );
  }

  // Filter-Results: chips + one section per chosen category.
  const { total, cards } = await listCourses(filters, sort, 200);
  const list = chips(sp, filters);
  const sections = filters.categories?.length
    ? filters.categories.map((c) => ({ name: c, cards: cards.filter((x) => x.category === c) }))
    : [{ name: "All courses", cards }];
  return (
    <>
      <Topbar back="/courses" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 text-[26px] font-bold tracking-[-0.01em]">Showing {total} result{total === 1 ? "" : "s"} for:</h1>
        <Suspense><SortFilter /></Suspense>
      </div>
      {list.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {list.map((c) => (
            <span key={c.label} className="inline-flex h-[30px] items-center gap-1 rounded-md border border-line-input pr-1 pl-2.5 text-xs text-ink-2">
              {c.label}
              <Link href={c.href} aria-label={`Remove filter ${c.label}`} className="flex h-[22px] w-[22px] items-center justify-center text-ink-3"><CloseIcon size={9} strokeWidth={3} /></Link>
            </span>
          ))}
          <Link href="/courses" className="px-2 text-xs font-semibold">Clear all</Link>
        </div>
      )}
      {total === 0 && <EmptyState title="No Matches Found" body="Try removing a filter or searching for something else." />}
      {sections.filter((s) => s.cards.length).map((s) => (
        <section key={s.name} className="flex flex-col gap-4">
          <h2 className="m-0 text-lg font-semibold">{s.name}</h2>
          <LoadMoreGrid cards={s.cards} />
        </section>
      ))}
    </>
  );
}
