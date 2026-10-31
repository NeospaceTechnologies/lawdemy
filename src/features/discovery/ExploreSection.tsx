"use client";
import { useState } from "react";
import Link from "next/link";
import { CategoryTabs } from "@/components/learner/CategoryTabs";
import { CourseCard, CourseGrid } from "@/components/learner/CourseCard";
import { SortFilter } from "@/components/learner/SortFilter";
import { EmptyState } from "@/components/ui/EmptyState";
import { buttonClass } from "@/components/ui/Button";
import { ContinueIcon } from "@/components/ui/icons";
import type { CourseCardData } from "@/lib/catalog";
import { useTaxonomy } from "@/components/TaxonomyProvider";

/** Dashboard "Explore" block: category tabs over three courses each. */
export function ExploreSection({ byCategory }: { byCategory: Record<string, CourseCardData[]> }) {
  const [tab, setTab] = useState<string>(useTaxonomy().category[0] ?? "");
  const cards = byCategory[tab] ?? [];
  return (
    <section className="flex flex-col gap-4" aria-labelledby="explore-h">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="explore-h" className="m-0 text-xl font-semibold">Explore</h2>
        <SortFilter target="/courses" />
      </div>
      <CategoryTabs value={tab} onChange={setTab} />
      {cards.length ? (
        <CourseGrid>{cards.map((c) => <CourseCard key={c.id} c={c} />)}</CourseGrid>
      ) : (
        <EmptyState dashed body="No courses in this category yet. Check back soon." />
      )}
      <Link href={`/courses?category=${encodeURIComponent(tab)}`} className={buttonClass("primary", "md", "h-10 self-start px-4")}>
        Explore {tab} <ContinueIcon />
      </Link>
    </section>
  );
}
