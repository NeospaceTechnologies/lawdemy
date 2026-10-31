"use client";
import { useId, useRef, type ReactNode } from "react";
import clsx from "clsx";
import { CloseIcon } from "./icons";
import { useModal } from "./useModal";

type SlideOverProps = {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  /** Called for the close button, Escape and backdrop click. Check for unsaved changes here. */
  onRequestClose: () => void;
  /** Extra header control, e.g. "Add Question". */
  headerAction?: ReactNode;
  footer?: ReactNode;
  /** "split" lays footer buttons out in two equal columns; "stack" leaves the footer content as-is (e.g. a reply composer). */
  footerLayout?: "split" | "stack";
  width?: number;
  children: ReactNode;
  onSubmit?: () => void;
};

/** Right-side panel used for every form (Add Lesson, Add Quiz, bank setup…). */
export function SlideOver({ open, title, description, onRequestClose, headerAction, footer, footerLayout = "split", width = 480, children, onSubmit }: SlideOverProps) {
  const ref = useRef<HTMLFormElement>(null);
  const titleId = useId();
  const descId = useId();
  useModal(ref, open, onRequestClose);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-[rgba(16,24,40,0.55)] p-2 sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onRequestClose()}
    >
      <form
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.();
        }}
        className="flex max-w-full flex-col overflow-hidden rounded-card bg-white outline-none"
        style={{ width }}
      >
        <div className="flex items-start gap-3 border-b border-line px-5 py-4">
          <div className="flex flex-1 flex-col gap-1">
            <h2 id={titleId} className="m-0 text-lg font-semibold">{title}</h2>
            {description && <p id={descId} className="m-0 text-xs text-ink-3">{description}</p>}
          </div>
          {headerAction}
          <button type="button" aria-label="Close" onClick={onRequestClose} className="flex h-9 w-9 flex-none items-center justify-center rounded-control text-ink hover:bg-surface">
            <CloseIcon />
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className={clsx("border-t border-line px-5 pt-4 pb-5", footerLayout === "split" ? "grid grid-cols-2 gap-2.5" : "flex flex-col gap-2")}>{footer}</div>}
      </form>
    </div>
  );
}
