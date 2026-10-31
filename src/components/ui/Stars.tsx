"use client";
import { useState } from "react";
import clsx from "clsx";

const STAR = "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8-4.3-4.1 5.9-.9z";

/** Read-only average, e.g. "★ 4.6 (12)". */
export function RatingSummary({ avg, count, className }: { avg: number; count: number; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1 text-xs text-ink-3", className)} aria-label={`Rated ${avg.toFixed(1)} out of 5 by ${count} learner${count === 1 ? "" : "s"}`}>
      <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} fill="#F79009" /></svg>
      <strong className="font-semibold text-ink">{avg.toFixed(1)}</strong>({count})
    </span>
  );
}

/** 1–5 star picker; arrow keys work because it is a radio group. */
export function StarInput({ value, onChange, disabled, label = "Your rating" }: { value: number; onChange: (n: number) => void; disabled?: boolean; label?: string }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} className={clsx("cursor-pointer", disabled && "cursor-not-allowed opacity-60")} onMouseEnter={() => !disabled && setHover(n)}>
          <input type="radio" name="course-rating" value={n} checked={value === n} disabled={disabled} onChange={() => onChange(n)} className="peer sr-only" aria-label={`${n} star${n === 1 ? "" : "s"}`} />
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="rounded peer-focus-visible:outline-2 peer-focus-visible:outline-primary">
            <path d={STAR} fill={n <= shown ? "#F79009" : "none"} stroke={n <= shown ? "#F79009" : "#98A2B3"} strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </label>
      ))}
    </div>
  );
}
