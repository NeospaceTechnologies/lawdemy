"use client";
import { forwardRef, useEffect, useId, useRef, useState, type InputHTMLAttributes } from "react";
import clsx from "clsx";
import { controlClass } from "./Field";
import { CheckIcon, ChevronDownIcon, CloseIcon, EyeIcon, EyeOffIcon, SearchIcon } from "./icons";

/** Four short bars showing sign-up progress (orange = done/current). */
export function StepBars({ step, total = 4 }: { step: number; total?: number }) {
  return (
    <div className="flex gap-1" role="img" aria-label={`Step ${step} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={clsx("h-1 w-5 rounded-sm", i < step ? "bg-accent" : "bg-[#E4E7EC]")} />
      ))}
    </div>
  );
}

/** Green double-ring check used on success screens. */
export function SuccessBadge({ size = 72 }: { size?: number }) {
  const inner = Math.round(size * 0.72);
  return (
    <div className="flex items-center justify-center rounded-full bg-success-bg" style={{ width: size, height: size }}>
      <div className="flex items-center justify-center rounded-full bg-success-light text-white" style={{ width: inner, height: inner }}>
        <CheckIcon size={Math.round(size * 0.36)} strokeWidth={3} />
      </div>
    </div>
  );
}

/** Password field with a Show/Hide toggle. */
export const PasswordInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function PasswordInput({ invalid, className, ...rest }, ref) {
    const [show, setShow] = useState(false);
    return (
      <div className="relative">
        <input ref={ref} type={show ? "text" : "password"} aria-invalid={invalid || undefined} className={controlClass(invalid, clsx("h-11 pr-11 pl-3.5", className))} {...rest} />
        <button
          type="button"
          aria-label={show ? "Hide password" : "Show password"}
          onClick={() => setShow((s) => !s)}
          className="absolute top-1/2 right-1.5 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:text-ink-2"
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    );
  },
);

/**
 * Searchable multi-select with chips (Legal Credentials, filters, instructor
 * background). Closed: chips in a field. Open: search + checkbox list.
 */
export function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder,
  searchLabel,
}: {
  label: string;
  options: readonly string[];
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  searchLabel: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((v) => v !== o) : [...value, o]);
  const shown = options.filter((o) => o.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div ref={wrap} className="relative flex flex-col gap-1.5">
      <span id={`${id}-l`} className="text-[13px] font-medium">{label}</span>
      <div
        className={clsx(
          "flex min-h-11 items-center justify-between gap-2 rounded-control border px-3 py-1.5",
          open ? "border-[1.5px] border-primary bg-white shadow-[0_0_0_4px_#E7E7FB]" : "border-line-input bg-surface",
        )}
      >
        <div className="flex flex-1 flex-wrap gap-1.5">
          {value.length === 0 && <span className="text-sm text-muted">{placeholder}</span>}
          {value.map((v) => (
            <span key={v} className="inline-flex items-center gap-1 rounded-md border border-line-input bg-white px-2 py-[3px] text-xs font-medium">
              {v}
              <button type="button" aria-label={`Remove ${v}`} onClick={() => toggle(v)} className="flex h-4 w-4 items-center justify-center text-ink-3">
                <CloseIcon size={9} strokeWidth={3} />
              </button>
            </span>
          ))}
        </div>
        <button
          type="button"
          aria-labelledby={`${id}-l`}
          aria-expanded={open}
          aria-controls={`${id}-list`}
          onClick={() => setOpen((o) => !o)}
          className="flex h-8 w-8 flex-none items-center justify-center rounded-md text-muted"
        >
          <ChevronDownIcon className={clsx("transition-transform", open && "rotate-180")} strokeWidth={2} />
        </button>
      </div>
      {open && (
        <div id={`${id}-list`} className="absolute top-full right-0 left-0 z-20 mt-1 flex max-h-72 flex-col gap-0.5 rounded-[10px] border border-[#E4E7EC] bg-white p-2 shadow-[0_12px_24px_-6px_rgba(16,24,40,0.14)]">
          <div className="mb-1 flex h-[38px] flex-none items-center gap-2 rounded-md border border-[#E4E7EC] px-2.5">
            <SearchIcon className="text-muted" />
            <label htmlFor={`${id}-q`} className="sr-only">{searchLabel}</label>
            <input id={`${id}-q`} autoFocus type="search" placeholder={searchLabel} value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 border-0 bg-transparent text-[13px] outline-none" />
          </div>
          <div className="overflow-y-auto">
            {shown.length === 0 && <p className="m-0 px-2.5 py-2 text-[13px] text-muted">No matches</p>}
            {shown.map((o) => (
              <label key={o} className={clsx("flex h-9 cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-[13px]", value.includes(o) && "bg-surface-2")}>
                <input type="checkbox" checked={value.includes(o)} onChange={() => toggle(o)} className="m-0 h-4 w-4 accent-primary" />
                {o}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
