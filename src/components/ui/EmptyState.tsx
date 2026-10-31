import type { ReactNode } from "react";
import clsx from "clsx";

/** Empty / no-results block with an optional call to action. */
export function EmptyState({
  title,
  body,
  action,
  dashed,
  className,
}: {
  title?: ReactNode;
  body: ReactNode;
  action?: ReactNode;
  dashed?: boolean;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center gap-2 px-6 py-8 text-center",
        dashed && "rounded-card border border-dashed border-line-input",
        className,
      )}
    >
      {title && <strong className="text-[15px]">{title}</strong>}
      <p className="m-0 text-[13px] text-ink-3">{body}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
