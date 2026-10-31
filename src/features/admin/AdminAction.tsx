"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, type ButtonVariant } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Select, TextArea, TextInput } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { api, ApiClientError } from "@/lib/api-client";

export type ActionField =
  | { name: string; label: string; type: "text" | "textarea"; minLength?: number; placeholder?: string; initial?: string }
  | { name: string; label: string; type: "naira"; max?: number; initial?: number }
  | { name: string; label: string; type: "checkbox"; hint?: string }
  | { name: string; label: string; type: "select"; options: { value: string; label: string }[]; initial?: string };

/**
 * One staff action: a button that posts to an admin API, optionally after a dialog that
 * collects a reason/amount/etc. Every admin module uses it, so confirm-and-busy behaviour
 * is the same everywhere. "naira" fields are sent as kobo.
 */
export function AdminAction({
  endpoint,
  body = {},
  label,
  title,
  description,
  fields = [],
  confirmLabel,
  busyLabel = "Saving…",
  success,
  variant = "primary",
  size = "sm",
  redirectTo,
}: {
  endpoint: string;
  body?: Record<string, unknown>;
  label: string;
  title?: string;
  description?: string;
  fields?: ActionField[];
  confirmLabel?: string;
  busyLabel?: string;
  success: string;
  variant?: ButtonVariant;
  size?: "sm" | "md";
  redirectTo?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const needsDialog = fields.length > 0 || !!title;

  function reset() {
    const v: Record<string, string | boolean> = {};
    for (const f of fields) {
      if (f.type === "checkbox") v[f.name] = false;
      else if (f.type === "naira") v[f.name] = f.initial !== undefined ? String(f.initial / 100) : "";
      else v[f.name] = f.initial ?? (f.type === "select" ? f.options[0]?.value ?? "" : "");
    }
    setValues(v);
  }

  const problems = fields.flatMap((f) => {
    const v = values[f.name];
    if ((f.type === "text" || f.type === "textarea") && f.minLength && String(v ?? "").trim().length < f.minLength) return [f.name];
    if (f.type === "naira") {
      const n = Number(v);
      if (!v || !Number.isFinite(n) || n <= 0 || (f.max !== undefined && Math.round(n * 100) > f.max)) return [f.name];
    }
    return [];
  });

  async function run() {
    setBusy(true);
    const payload: Record<string, unknown> = { ...body };
    for (const f of fields) {
      const v = values[f.name];
      payload[f.name] = f.type === "naira" ? Math.round(Number(v) * 100) : typeof v === "string" ? v.trim() : v;
    }
    try {
      await api(endpoint, { body: payload });
      toast.show({ title: success });
      setOpen(false);
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch (err) {
      toast.show({ tone: "error", title: "That didn’t work", body: err instanceof ApiClientError ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        busy={!needsDialog && busy}
        busyLabel={busyLabel}
        onClick={() => {
          if (!needsDialog) return void run();
          reset();
          setOpen(true);
        }}
      >
        {label}
      </Button>
      {needsDialog && (
        <Dialog open={open} title={title ?? label} description={description} onRequestClose={() => !busy && setOpen(false)} width={460}>
          {fields.map((f) => (
            <label key={f.name} className={f.type === "checkbox" ? "flex items-start gap-2 text-[13px]" : "flex flex-col gap-1.5 text-xs font-semibold"}>
              {f.type === "checkbox" ? (
                <>
                  <input type="checkbox" className="mt-0.5 accent-primary" checked={!!values[f.name]} onChange={(e) => setValues((s) => ({ ...s, [f.name]: e.target.checked }))} />
                  <span className="flex flex-col gap-0.5"><span className="font-medium">{f.label}</span>{f.hint && <span className="text-xs text-ink-3">{f.hint}</span>}</span>
                </>
              ) : (
                <>
                  {f.label}
                  {f.type === "textarea" ? (
                    <TextArea rows={3} placeholder={f.placeholder} value={String(values[f.name] ?? "")} onChange={(e) => setValues((s) => ({ ...s, [f.name]: e.target.value }))} className="text-[13px] font-normal" />
                  ) : f.type === "select" ? (
                    <Select value={String(values[f.name] ?? "")} onChange={(e) => setValues((s) => ({ ...s, [f.name]: e.target.value }))} className="font-normal">
                      {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                  ) : (
                    <TextInput
                      inputMode={f.type === "naira" ? "decimal" : undefined}
                      placeholder={f.type === "naira" ? "Amount in ₦" : f.placeholder}
                      value={String(values[f.name] ?? "")}
                      onChange={(e) => setValues((s) => ({ ...s, [f.name]: e.target.value }))}
                      className="h-10 font-normal"
                    />
                  )}
                  {f.type === "text" || f.type === "textarea" ? (f.minLength ? <span className="font-normal text-muted">At least {f.minLength} characters.</span> : null) : null}
                </>
              )}
            </label>
          ))}
          <div className="grid grid-cols-2 gap-2.5">
            <Button variant="outline" size="md" className="h-10" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant={variant === "danger" ? "danger" : "primary"} size="md" className="h-10" disabled={problems.length > 0} busy={busy} busyLabel={busyLabel} onClick={run}>
              {confirmLabel ?? label}
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}
