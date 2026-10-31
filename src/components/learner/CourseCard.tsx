"use client";
import Link from "next/link";
import { FlameIcon, HeartIcon, LevelIcon } from "@/components/ui/icons";
import { RatingSummary } from "@/components/ui/Stars";
import type { CourseCardData } from "@/lib/catalog";

/** Course card used across discovery screens (Dashboard, Courses, Search, Wishlist). */
export function CourseCard({ c, onUnwish }: { c: CourseCardData; onUnwish?: () => void }) {
  return (
    <article className="relative flex flex-col overflow-hidden rounded-card border border-line bg-white shadow-[0_1px_3px_rgba(16,24,40,0.08)] transition-shadow hover:shadow-md">
      <div className="flex h-[150px] items-end justify-between bg-[#2B2F36] bg-cover bg-center p-2.5" style={c.thumbnailUrl ? { backgroundImage: `url(${c.thumbnailUrl})` } : undefined}>
        {!c.thumbnailUrl && <span className="text-[11px] text-line-input">[Course image]</span>}
      </div>
      {onUnwish && (
        <button
          type="button"
          aria-label={`Remove ${c.title} from wishlist`}
          onClick={onUnwish}
          className="absolute top-2.5 right-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-primary"
        >
          <HeartIcon size={16} filled />
        </button>
      )}
      <div className="flex flex-1 flex-col gap-2.5 p-3">
        <h3 className="m-0 text-[15px] leading-[1.35] font-semibold">
          <Link href={`/courses/${c.id}`} className="text-ink no-underline after:absolute after:inset-0 hover:text-ink">
            {c.title}
          </Link>
        </h3>
        <div className="flex items-center gap-2 text-xs text-ink-3">
          <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#FDEAD7] text-[9px] font-bold text-warning-text">{c.initials}</span>
          {c.instructor}
          {c.rating && <RatingSummary avg={c.rating.avg} count={c.rating.count} className="ml-auto" />}
        </div>
        <div className="flex flex-wrap items-baseline gap-1.5">
          <span className="text-sm font-bold text-price">{c.priceLabel}</span>
          {c.oldLabel && <s className="text-xs text-muted">{c.oldLabel}</s>}
          {c.offLabel && <span className="text-xs text-ink-3">{c.offLabel}</span>}
        </div>
        <div className="mt-auto flex items-center justify-between">
          {c.badge === "Trending" ? (
            <span className="inline-flex h-[22px] items-center gap-1 rounded-md bg-ink px-2 text-[11px] font-semibold text-white"><FlameIcon />Trending</span>
          ) : c.badge === "New" ? (
            <span className="inline-flex h-[22px] items-center rounded-md bg-success px-2 text-[11px] font-semibold text-white">New</span>
          ) : (
            <span />
          )}
          <span className="inline-flex items-center gap-1 text-xs text-ink-3"><LevelIcon />{c.level}</span>
        </div>
      </div>
    </article>
  );
}

export function CourseGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">{children}</div>;
}
