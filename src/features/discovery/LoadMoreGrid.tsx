"use client";
import { useState } from "react";
import { CourseCard, CourseGrid } from "@/components/learner/CourseCard";
import type { CourseCardData } from "@/lib/catalog";

/** Shows six cards, then "Load More" reveals the rest (Filter-Results). */
export function LoadMoreGrid({ cards, step = 6 }: { cards: CourseCardData[]; step?: number }) {
  const [shown, setShown] = useState(step);
  return (
    <>
      <CourseGrid>{cards.slice(0, shown).map((c) => <CourseCard key={c.id} c={c} />)}</CourseGrid>
      {shown < cards.length && (
        <button type="button" onClick={() => setShown((s) => s + step)} className="h-10 self-center rounded-control border border-primary bg-white px-5 text-[13px] font-semibold text-primary">
          Load More
        </button>
      )}
    </>
  );
}
