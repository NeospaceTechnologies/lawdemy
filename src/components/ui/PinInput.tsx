"use client";
import { useId, useState } from "react";
import clsx from "clsx";

/**
 * 4-digit transaction PIN with Show/Hide (Inst-Withdraw). Digits only;
 * the value is never logged.
 */
export function PinInput({
  label,
  value,
  onChange,
  error,
  message,
  size = "lg",
  toggleLabels = ["Show", "Hide"],
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
  /** Status line under the input, e.g. "Incorrect PIN. 2 tries left." */
  message?: string;
  size?: "md" | "lg";
  toggleLabels?: [string, string];
}) {
  const id = useId();
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col items-center gap-2.5">
      <label htmlFor={id} className="text-[13px] font-semibold">{label}</label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type={show ? "text" : "password"}
          inputMode="numeric"
          pattern="\d{4}"
          maxLength={4}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
          aria-invalid={error || undefined}
          aria-describedby={message ? `${id}-msg` : undefined}
          className={clsx(
            "w-[180px] rounded-[10px] border bg-surface text-center tracking-[0.6em] outline-none focus:border-primary focus:ring-1 focus:ring-primary",
            size === "lg" ? "h-[52px] text-2xl" : "h-12 text-[22px]",
            error ? "border-danger" : "border-line-input",
          )}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide PIN" : "Show PIN"}
          className="h-9 border-0 bg-transparent px-2 text-xs text-ink-3"
        >
          {show ? toggleLabels[1] : toggleLabels[0]}
        </button>
      </div>
      {message && (
        <span id={`${id}-msg`} role="status" className={clsx("text-xs", error ? "text-danger-text" : "text-ink-3")}>
          {message}
        </span>
      )}
    </div>
  );
}
