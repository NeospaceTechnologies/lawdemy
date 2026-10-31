"use client";
import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import clsx from "clsx";

export type TabItem = { id: string; label: ReactNode };

/** Tabs with the orange underline (Inst-CourseDetails, Inst-Settings). Arrow keys move between tabs. */
export function Tabs({
  tabs,
  value,
  onChange,
  label,
  fill = false,
  children,
}: {
  tabs: TabItem[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  /** Equal-width tabs across a 720px rail (Settings.dc.html) instead of hugging their labels. */
  fill?: boolean;
  children?: ReactNode;
}) {
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKey(e: KeyboardEvent, i: number) {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const j = (i + dir + tabs.length) % tabs.length;
    refs.current[j]?.focus();
    onChange(tabs[j].id);
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label={label} className={clsx("overflow-x-auto border-b border-line", fill ? "grid max-w-[720px] auto-cols-fr grid-flow-col" : "flex gap-6")}>
        {tabs.map((t, i) => {
          const on = t.id === value;
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="tab"
              id={`${base}-tab-${t.id}`}
              aria-selected={on}
              aria-controls={`${base}-panel`}
              tabIndex={on ? 0 : -1}
              onClick={() => onChange(t.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={clsx(
                "-mb-px flex h-11 items-center justify-center whitespace-nowrap border-0 border-b-2 bg-transparent text-sm",
                on ? "border-accent font-semibold text-ink" : "border-transparent font-medium text-muted hover:text-ink-2",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {children !== undefined && (
        <div role="tabpanel" id={`${base}-panel`} aria-labelledby={`${base}-tab-${value}`}>
          {children}
        </div>
      )}
    </div>
  );
}
