import clsx from "clsx";

// Badge colours from Inst-MyCourses, Inst-Earnings and Inst-Community.
// Badges always carry words, never colour alone (PRD 9).
const STYLES = {
  Live: "bg-success-bg text-success",
  Published: "bg-success-bg text-success",
  Successful: "bg-success-bg text-success",
  Draft: "bg-surface-2 text-ink-2",
  "Under Review": "bg-warning-bg text-warning-text",
  Pending: "bg-warning-bg text-warning-text",
  Rejected: "bg-danger-bg text-danger-text",
  Failed: "bg-danger-bg text-danger-text",
  Archived: "bg-nav-active text-ink-3",
  Expired: "bg-nav-active text-ink-3",
} as const;

export type BadgeStatus = keyof typeof STYLES;

export const COURSE_STATUS_LABEL = {
  DRAFT: "Draft",
  UNDER_REVIEW: "Under Review",
  LIVE: "Live",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
} as const satisfies Record<string, BadgeStatus>;

export function StatusBadge({ status, className }: { status: BadgeStatus; className?: string }) {
  return (
    <span className={clsx("inline-flex h-[22px] items-center whitespace-nowrap rounded-full px-2 text-[11px] font-semibold", STYLES[status], className)}>
      {status}
    </span>
  );
}
