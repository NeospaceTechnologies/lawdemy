"use client";
import { useId, useRef, type ReactNode } from "react";
import { Button } from "./Button";
import { ClockIcon, CloseIcon, WarningIcon } from "./icons";
import { useModal } from "./useModal";

/** Centred modal for small forms (e.g. Add Feedback). */
export function Dialog({
  open,
  title,
  description,
  onRequestClose,
  children,
  width = 440,
}: {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  onRequestClose: () => void;
  children: ReactNode;
  width?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useModal(ref, open, onRequestClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(16,24,40,0.55)] p-4" onMouseDown={(e) => e.target === e.currentTarget && onRequestClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className="flex max-w-full flex-col gap-3.5 rounded-card bg-white p-5 outline-none" style={{ width }}>
        <div className="flex items-start gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <h2 id={titleId} className="m-0 text-[17px] font-semibold">{title}</h2>
            {description && <p className="m-0 text-xs leading-normal text-ink-3">{description}</p>}
          </div>
          <button type="button" aria-label="Close" onClick={onRequestClose} className="flex h-8 w-8 items-center justify-center rounded-control hover:bg-surface">
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  body: ReactNode;
  /** Optional line under the body, shown with a clock icon (e.g. review time). */
  note?: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** "danger" makes the confirm button red (Delete). */
  tone?: "primary" | "danger";
  /** Red cancel button, used when cancel is the destructive choice ("Discard Changes"). */
  cancelTone?: "outline" | "danger";
  busy?: boolean;
  busyLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Escape/backdrop. Defaults to the safe choice: onCancel, or onConfirm when cancel is destructive. */
  onDismiss?: () => void;
};

/** Centred confirm with the warning icon, Cancel + action, and busy labels. */
export function ConfirmDialog({
  open,
  title,
  body,
  note,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "primary",
  cancelTone = "outline",
  busy,
  busyLabel,
  onConfirm,
  onCancel,
  onDismiss,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const bodyId = useId();
  const dismiss = onDismiss ?? (cancelTone === "danger" ? onConfirm : onCancel);
  useModal(ref, open, () => !busy && dismiss());
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(16,24,40,0.55)] p-4" onMouseDown={(e) => e.target === e.currentTarget && !busy && dismiss()}>
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
        className="flex w-[380px] max-w-full flex-col items-center gap-3 rounded-card bg-white p-6 text-center outline-none"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-line">
          <WarningIcon />
        </span>
        <h2 id={titleId} className="m-0 text-[17px] font-semibold">{title}</h2>
        <p id={bodyId} className="m-0 text-[13px] leading-normal text-ink-3">{body}</p>
        {note && (
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
            <ClockIcon />
            {note}
          </span>
        )}
        <div className="mt-1.5 grid w-full grid-cols-2 gap-2.5">
          <Button size="md" className="h-10" variant={cancelTone === "danger" ? "danger" : "outline"} onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button size="md" className="h-10" variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} busy={busy} busyLabel={busyLabel} data-autofocus>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
