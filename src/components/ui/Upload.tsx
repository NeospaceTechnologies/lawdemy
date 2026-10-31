"use client";
import { useRef, useState } from "react";
import clsx from "clsx";
import { formatBytes } from "@/lib/format";
import type { UploadState } from "@/lib/upload-client";
import { TrashIcon, UploadIcon } from "./icons";

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="h-1.5 overflow-hidden rounded-[3px] bg-line">
      <div className="h-1.5 rounded-[3px] bg-primary transition-[width]" style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Click-or-drop upload area. */
export function UploadDropzone({
  accept,
  hint,
  label = "Click to upload",
  disabled,
  onFile,
  describedBy,
}: {
  accept: string;
  hint: string;
  label?: string;
  disabled?: boolean;
  onFile: (file: File) => void;
  describedBy?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <>
      <button
        type="button"
        disabled={disabled}
        aria-describedby={describedBy}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const f = e.dataTransfer.files[0];
          if (f && !disabled) onFile(f);
        }}
        className={clsx(
          "flex flex-col items-center gap-1.5 rounded-[10px] border bg-surface px-3 py-[18px] disabled:cursor-not-allowed disabled:opacity-60",
          over ? "border-primary bg-info-tint-2" : "border-line",
        )}
      >
        <UploadIcon className="text-ink-3" />
        <span className="text-xs font-semibold text-primary underline">{label}</span>
        <span className="text-[11px] text-muted">{hint}</span>
      </button>
      <input
        ref={input}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </>
  );
}

/** File row with progress and remove (lesson video, attachments). */
export function UploadProgress({ state, onRemove }: { state: UploadState; onRemove: () => void }) {
  if (state.status === "idle") return null;
  if (state.status === "error") {
    return (
      <p role="alert" className="m-0 rounded-control bg-danger-bg px-3 py-2 text-xs text-danger-text">
        {state.message}
      </p>
    );
  }
  const name = state.status === "uploading" ? state.fileName : state.asset.fileName;
  const size = state.status === "uploading" ? state.sizeBytes : state.asset.sizeBytes;
  const loaded = state.status === "uploading" ? state.loaded : size;
  const pct = size ? (loaded / size) * 100 : 100;
  const meta =
    state.status === "uploading" ? `${formatBytes(loaded)} of ${formatBytes(size)} • Uploading…` : `${formatBytes(size)} of ${formatBytes(size)} • Completed`;
  return (
    <div className="flex flex-col gap-2 rounded-[10px] border border-line px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <span aria-hidden="true" className="h-7 w-7 flex-none rounded-md bg-[#FDEAD7]" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-xs font-medium">{name}</span>
          <span className="text-[11px] text-muted" aria-live="polite">{meta}</span>
        </span>
        <button type="button" aria-label={state.status === "uploading" ? "Cancel upload" : "Remove file"} onClick={onRemove} className="flex h-7 w-7 items-center justify-center rounded-control text-danger hover:bg-danger-bg">
          <TrashIcon />
        </button>
      </div>
      <ProgressBar value={pct} label={`Upload progress for ${name}`} />
    </div>
  );
}
