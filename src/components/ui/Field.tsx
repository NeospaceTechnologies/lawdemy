import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import clsx from "clsx";

// Inputs: #F9FAFB fill, #D0D5DD border, 8px radius (design/README tokens).
const control =
  "w-full rounded-control border bg-surface px-3 text-sm text-ink placeholder:text-placeholder outline-none transition-colors focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary disabled:opacity-60";

// Default height unless the caller passes its own h-* class.
const withHeight = (fallback: string, className?: string) => (/(^|\s)h-/.test(className ?? "") ? className : clsx(fallback, className));

export function controlClass(invalid?: boolean, className?: string) {
  return clsx(control, invalid ? "border-danger focus:border-danger focus:ring-danger" : "border-line-input", className);
}

export function Label({ htmlFor, children, className, id }: { htmlFor?: string; children: ReactNode; className?: string; id?: string }) {
  return (
    <label htmlFor={htmlFor} id={id} className={clsx("text-[13px] font-semibold text-ink", className)}>
      {children}
    </label>
  );
}

/** Small circled "i" with a native tooltip, as in the lesson panel. */
export function InfoTip({ text }: { text: string }) {
  return (
    <span
      title={text}
      aria-label={text}
      role="img"
      className="inline-flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full border border-muted text-[9px] font-normal text-muted"
    >
      i
    </span>
  );
}

export function FieldMessage({ id, children, tone = "hint" }: { id?: string; children: ReactNode; tone?: "hint" | "error" }) {
  return (
    <span id={id} className={clsx("text-xs", tone === "error" ? "text-danger-text" : "text-ink-3")} role={tone === "error" ? "alert" : undefined}>
      {children}
    </span>
  );
}

type FieldWrapProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  counter?: { value: number; max: number };
  children: (props: { id: string; "aria-describedby"?: string; invalid: boolean }) => ReactNode;
  className?: string;
  labelClassName?: string;
};

/** Label + control + hint/error, wiring ids for accessibility. */
export function Field({ label, hint, error, counter, children, className, labelClassName }: FieldWrapProps) {
  const id = useId();
  const msgId = `${id}-msg`;
  const describedBy = error || hint ? msgId : undefined;
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className={labelClassName}>{label}</Label>
        {counter && (
          <span className={clsx("text-xs tabular-nums", counter.value > counter.max ? "text-danger-text" : "text-muted")} aria-live="polite">
            {counter.value}/{counter.max}
          </span>
        )}
      </div>
      {children({ id, "aria-describedby": describedBy, invalid: !!error })}
      {error ? <FieldMessage id={msgId} tone="error">{error}</FieldMessage> : hint ? <FieldMessage id={msgId}>{hint}</FieldMessage> : null}
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function TextInput({ invalid, className, ...rest }, ref) {
    return <input ref={ref} aria-invalid={invalid || undefined} className={controlClass(invalid, withHeight("h-11", className))} {...rest} />;
  },
);

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  function TextArea({ invalid, className, ...rest }, ref) {
    return <textarea ref={ref} aria-invalid={invalid || undefined} className={controlClass(invalid, clsx("resize-y py-2.5", className))} {...rest} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(
  function Select({ invalid, className, ...rest }, ref) {
    return <select ref={ref} aria-invalid={invalid || undefined} className={controlClass(invalid, clsx("px-2.5", withHeight("h-11", className)))} {...rest} />;
  },
);
