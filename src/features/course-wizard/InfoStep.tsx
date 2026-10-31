"use client";
import { Button } from "@/components/ui/Button";
import { Radio } from "@/components/ui/Choice";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { UploadIcon } from "@/components/ui/icons";
import { ProgressBar } from "@/components/ui/Upload";
import { useTaxonomy } from "@/components/TaxonomyProvider";
import { IMAGE_MIME, LEVELS, LIMITS } from "@/lib/course/constants";
import { joinDuration, splitDuration, type DurationFormat } from "@/lib/format";
import type { UploadState } from "@/lib/upload-client";
import { useRef } from "react";
import type { InfoForm } from "./model";

type Props = {
  value: InfoForm;
  onChange: (patch: Partial<InfoForm>) => void;
  thumbnail: UploadState;
  onThumbnail: (file: File) => void;
  canProceed: boolean;
  onProceed: () => void;
  onCancel: () => void;
};

/** Step 1: Course Information (PRD INS-CRS-02). Required: title, description, category. */
export function InfoStep({ value: v, onChange, thumbnail, onThumbnail, canProceed, onProceed, onCancel }: Props) {
  const taxonomy = useTaxonomy();
  const fileInput = useRef<HTMLInputElement>(null);
  const labels = v.durationFormat === "HOURS_MINUTES" ? ["Hours", "Minutes"] : ["Minutes", "Seconds"];

  function changeFormat(next: DurationFormat) {
    const secs = joinDuration(v.durA, v.durB, v.durationFormat);
    const [durA, durB] = secs === null ? ["", ""] : splitDuration(secs, next);
    onChange({ durationFormat: next, durA, durB });
  }

  const thumbLabel =
    thumbnail.status === "done"
      ? `${thumbnail.asset.fileName} — Replace`
      : thumbnail.status === "uploading"
        ? `Uploading ${thumbnail.fileName}…`
        : "Click to upload";

  return (
    <form
      className="flex flex-col gap-[18px]"
      onSubmit={(e) => {
        e.preventDefault();
        if (canProceed) onProceed();
      }}
    >
      <h2 className="m-0 text-lg font-semibold">Course Information</h2>
      <Field label="Course Title" counter={{ value: v.title.length, max: LIMITS.title }}>
        {(p) => (
          <TextInput {...p} required maxLength={LIMITS.title} className="px-3" placeholder="e.g. Introduction to Legal Reasoning" value={v.title} onChange={(e) => onChange({ title: e.target.value })} />
        )}
      </Field>
      <Field label="Course Subtitle" counter={{ value: v.subtitle.length, max: LIMITS.subtitle }}>
        {(p) => (
          <TextInput {...p} maxLength={LIMITS.subtitle} className="px-3" placeholder="A one-line summary learners see under the title" value={v.subtitle} onChange={(e) => onChange({ subtitle: e.target.value })} />
        )}
      </Field>
      <Field label="Course Description">
        {(p) => (
          <TextArea {...p} required rows={4} maxLength={LIMITS.description} placeholder="What is this course about, and who is it for?" value={v.description} onChange={(e) => onChange({ description: e.target.value })} />
        )}
      </Field>
      <Field label="What will learners gain?">
        {(p) => (
          <TextArea {...p} rows={3} maxLength={LIMITS.outcomes} placeholder="List the key outcomes, one per line" value={v.outcomes} onChange={(e) => onChange({ outcomes: e.target.value })} />
        )}
      </Field>

      <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
        <legend className="mb-1 text-base font-semibold">Set Estimated Duration</legend>
        <span className="text-xs text-ink-3">Choose a format and enter the estimated length of this course.</span>
        <div className="flex gap-5">
          <Radio name="dur" label="Minutes and Seconds" checked={v.durationFormat === "MINUTES_SECONDS"} onChange={() => changeFormat("MINUTES_SECONDS")} />
          <Radio name="dur" label="Hours and Minutes" checked={v.durationFormat === "HOURS_MINUTES"} onChange={() => changeFormat("HOURS_MINUTES")} />
        </div>
        <div className="grid grid-cols-[repeat(2,minmax(0,160px))] gap-3">
          <label className="flex flex-col gap-1.5 text-xs font-semibold">
            {labels[0]}
            <TextInput type="number" min={0} inputMode="numeric" placeholder="0" className="h-10" value={v.durA} onChange={(e) => onChange({ durA: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold">
            {labels[1]}
            <TextInput type="number" min={0} max={59} inputMode="numeric" placeholder="0" className="h-10" value={v.durB} onChange={(e) => onChange({ durB: e.target.value })} />
          </label>
        </div>
      </fieldset>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
        <Field label="Course Category">
          {(p) => (
            <Select {...p} required value={v.category} onChange={(e) => onChange({ category: e.target.value as InfoForm["category"] })}>
              <option value="">Select category</option>
              {[...new Set([...taxonomy.category, ...(v.category ? [v.category] : [])])].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Skill Level">
          {(p) => (
            <Select {...p} value={v.level} onChange={(e) => onChange({ level: e.target.value as InfoForm["level"] })}>
              {LEVELS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <div className="flex flex-col gap-1.5">
        <span id="thumb-l" className="text-[13px] font-semibold">Course Thumbnail</span>
        <button
          type="button"
          aria-labelledby="thumb-l"
          aria-describedby="thumb-h"
          disabled={thumbnail.status === "uploading"}
          onClick={() => fileInput.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) onThumbnail(f);
          }}
          className="flex flex-col items-center gap-1.5 rounded-[10px] border border-line bg-surface px-3 py-5 disabled:cursor-wait"
        >
          <UploadIcon className="text-ink-3" />
          <span className="text-[13px] font-semibold text-primary underline">{thumbLabel}</span>
          <span id="thumb-h" className="text-[11px] text-muted">JPEG, PNG (Recommended 1280×720)</span>
        </button>
        <input
          ref={fileInput}
          type="file"
          accept={IMAGE_MIME.join(",")}
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onThumbnail(f);
            e.target.value = "";
          }}
        />
        {thumbnail.status === "uploading" && <ProgressBar value={(thumbnail.loaded / thumbnail.sizeBytes) * 100} label="Thumbnail upload progress" />}
        {thumbnail.status === "error" && <span role="alert" className="text-xs text-danger-text">{thumbnail.message}</span>}
      </div>

      <div className="flex justify-end gap-2.5 border-t border-line pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={!canProceed}>Proceed to Price Information</Button>
      </div>
    </form>
  );
}
