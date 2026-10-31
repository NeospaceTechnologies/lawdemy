"use client";
import { Button } from "@/components/ui/Button";
import { Radio, Switch } from "@/components/ui/Choice";
import { Field, TextInput } from "@/components/ui/Field";
import { LIMITS } from "@/lib/course/constants";
import { discountedKobo, formatNaira, nairaToKobo } from "@/lib/format";
import type { PriceForm } from "./model";

type Props = {
  value: PriceForm;
  onChange: (patch: Partial<PriceForm>) => void;
  issues: Partial<Record<"price" | "discountPct" | "discountEndsAt", string>>;
  today: string;
  busy: boolean;
  onBack: () => void;
  onProceed: () => void;
};

/** Step 2: Price Information (PRD INS-CRS-04). */
export function PriceStep({ value: v, onChange, issues, today, busy, onBack, onProceed }: Props) {
  const canProceed = Object.keys(issues).length === 0;
  const kobo = nairaToKobo(v.price);
  const pct = Number(v.discountPct);
  const showPay = v.discountOn && kobo && !issues.price && !issues.discountPct;
  // Only show an error once the field has a value, so an empty form isn't red.
  const shown = (k: keyof typeof issues, raw: string) => (raw ? issues[k] : undefined);

  return (
    <form
      className="flex max-w-[640px] flex-col gap-[18px]"
      onSubmit={(e) => {
        e.preventDefault();
        if (canProceed) onProceed();
      }}
    >
      <h2 className="m-0 text-lg font-semibold">Price Information</h2>
      <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
        <legend className="mb-1 text-sm font-semibold">Access Type</legend>
        <span className="text-xs text-ink-3">Choose whether learners pay to access this course.</span>
        <div className="flex gap-5">
          <Radio name="acc" label="Free" checked={v.access === "FREE"} onChange={() => onChange({ access: "FREE" })} />
          <Radio name="acc" label="Paid" checked={v.access === "PAID"} onChange={() => onChange({ access: "PAID" })} />
        </div>
      </fieldset>

      {v.access === "PAID" && (
        <>
          <Field label="Price (₦)" error={shown("price", v.price)}>
            {(p) => (
              <TextInput
                {...p}
               
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                className="px-3"
                placeholder="e.g. 22900"
                value={v.price}
                onChange={(e) => onChange({ price: e.target.value })}
              />
            )}
          </Field>
          <Switch
            checked={v.discountOn}
            onChange={(on) => onChange({ discountOn: on, discountPct: on && !v.discountPct ? "25" : v.discountPct })}
            label="Offer a discount"
          />
          {v.discountOn && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Discount (%)" labelClassName="text-xs" error={shown("discountPct", v.discountPct)}>
                  {(p) => (
                    <TextInput {...p} type="number" min={1} max={LIMITS.maxDiscountPct} inputMode="numeric" className="h-10" value={v.discountPct} onChange={(e) => onChange({ discountPct: e.target.value })} />
                  )}
                </Field>
                <Field label="Discount ends" labelClassName="text-xs" error={shown("discountEndsAt", v.discountEndsAt)}>
                  {(p) => (
                    <TextInput {...p} type="date" min={today} className="h-10" value={v.discountEndsAt} onChange={(e) => onChange({ discountEndsAt: e.target.value })} />
                  )}
                </Field>
              </div>
              {showPay && (
                <span className="text-xs text-ink-3" aria-live="polite">
                  Learners will pay <strong className="text-ink">{formatNaira(discountedKobo(kobo, pct))} ({pct}% off {formatNaira(kobo)})</strong>
                </span>
              )}
            </>
          )}
        </>
      )}

      <label className="flex cursor-pointer items-start gap-2.5 rounded-[10px] border border-line p-3 text-[13px]">
        <input type="checkbox" checked={v.hasCertificate} onChange={(e) => onChange({ hasCertificate: e.target.checked })} className="mt-0.5 accent-primary" />
        <span className="flex flex-col gap-0.5">
          <strong className="font-semibold">Offer a certificate of completion</strong>
          <span className="text-ink-3">Learners get a certificate after passing the final assessment.</span>
        </span>
      </label>

      <div className="flex justify-end gap-2.5 border-t border-line pt-2">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button type="submit" disabled={!canProceed} busy={busy} busyLabel="Saving…">Proceed to Course Builder</Button>
      </div>
    </form>
  );
}
