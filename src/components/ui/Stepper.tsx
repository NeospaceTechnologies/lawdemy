import clsx from "clsx";

export type Step = { label: string; /** Can the user jump to this step? */ reachable: boolean };

/** Numbered stepper with orange boxes (Create Course). Reachable steps are clickable. */
export function Stepper({ steps, current, onSelect }: { steps: Step[]; current: number; onSelect: (n: number) => void }) {
  return (
    <ol aria-label="Steps" className="m-0 grid list-none grid-cols-3 gap-4 p-0">
      {steps.map((s, i) => {
        const n = i + 1;
        const isCurrent = n === current;
        const done = n < current;
        return (
          <li key={s.label}>
            <button
              type="button"
              onClick={() => s.reachable && onSelect(n)}
              aria-current={isCurrent ? "step" : undefined}
              aria-disabled={!s.reachable || undefined}
              className={clsx("flex w-full flex-col gap-1.5 border-0 bg-transparent p-0 text-left", !s.reachable && "cursor-not-allowed")}
            >
              <span
                className={clsx(
                  "flex h-8 w-8 items-center justify-center rounded-md text-[13px] font-bold text-white",
                  done || isCurrent ? "bg-accent" : "bg-accent-soft",
                )}
              >
                {n}
              </span>
              <span className="text-[11px] text-muted">Step {n}</span>
              <span className={clsx("text-[15px]", isCurrent ? "font-semibold text-ink" : "font-medium text-ink-3")}>{s.label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
