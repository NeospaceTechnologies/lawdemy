"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CloseIcon, SuccessDiscIcon } from "./icons";

type Toast = { id: number; title: string; body?: string; tone: "success" | "error" };
type ToastApi = { show: (t: { title: string; body?: string; tone?: Toast["tone"] }) => void; dismiss: (id: number) => void };

const ToastContext = createContext<ToastApi | null>(null);
const ToastState = createContext<Toast[]>([]);

const AUTO_HIDE_MS = 6000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);
  const show = useCallback<ToastApi["show"]>(({ title, body, tone = "success" }) => {
    const id = next.current++;
    // Newest replaces older toasts, as in the designs (one toast at a time).
    setToasts([{ id, title, body, tone }]);
  }, []);

  const api = useMemo(() => ({ show, dismiss }), [show, dismiss]);
  return (
    <ToastContext.Provider value={api}>
      <ToastState.Provider value={toasts}>{children}</ToastState.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  useEffect(() => {
    const t = setTimeout(() => dismissRef.current(), AUTO_HIDE_MS);
    return () => clearTimeout(t);
  }, [toast.id]);
  const bg = toast.tone === "success" ? "bg-success" : "bg-danger-text";
  return (
    <div className={`pointer-events-auto flex items-center gap-3 rounded-[10px] px-3.5 py-3 text-white shadow-lg ${bg}`}>
      <SuccessDiscIcon color={toast.tone === "success" ? "#067647" : "#B42318"} />
      <div className="flex flex-1 flex-col gap-0.5">
        <strong className="text-sm">{toast.title}</strong>
        {toast.body && <span className="text-xs">{toast.body}</span>}
      </div>
      <button type="button" aria-label="Dismiss" onClick={onDismiss} className="flex h-8 w-8 items-center justify-center rounded-control text-white hover:bg-white/10">
        <CloseIcon strokeWidth={3} />
      </button>
    </div>
  );
}

/** Where toasts render. Placed at the top of the main column; announced to screen readers. */
export function ToastViewport({ className = "" }: { className?: string }) {
  const toasts = useContext(ToastState);
  const { dismiss } = useToast();
  return (
    <div role="status" aria-live="polite" className={`pointer-events-none sticky top-3 z-30 flex flex-col gap-2 empty:hidden ${className}`}>
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}
