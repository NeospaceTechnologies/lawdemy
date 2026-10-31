"use client";
import clsx from "clsx";
import { useTaxonomy } from "@/components/TaxonomyProvider";

/** Purple pill tabs for the course categories (staff-managed, ADM-11). */
export function CategoryTabs({ value, onChange, label = "Course categories" }: { value: string; onChange: (c: string) => void; label?: string }) {
  const { category } = useTaxonomy();
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-2">
      {category.map((c) => (
        <button
          key={c}
          type="button"
          role="tab"
          aria-selected={c === value}
          onClick={() => onChange(c)}
          className={clsx("h-[34px] rounded-control border-0 px-3 text-[13px]", c === value ? "bg-info-tint font-semibold text-info-text" : "bg-transparent font-medium text-ink-3 hover:bg-surface")}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
