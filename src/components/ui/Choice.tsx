import type { InputHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

export function Radio({ label, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className={clsx("flex cursor-pointer items-center gap-1.5 text-[13px]", className)}>
      <input type="radio" className="accent-primary" {...rest} />
      {label}
    </label>
  );
}

export function Checkbox({ label, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className={clsx("flex cursor-pointer items-center gap-2 text-[13px]", className)}>
      <input type="checkbox" className="m-0 accent-primary" {...rest} />
      {label}
    </label>
  );
}

/** Toggle switch (navy when on). Rendered as role="switch" for screen readers. */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[13px] font-medium">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx("relative h-[22px] w-10 flex-none rounded-full transition-colors", checked ? "bg-primary" : "bg-line-input")}
      >
        <span className={clsx("absolute top-[3px] h-4 w-4 rounded-full bg-white transition-all", checked ? "left-[21px]" : "left-[3px]")} />
      </button>
      {label}
    </label>
  );
}
