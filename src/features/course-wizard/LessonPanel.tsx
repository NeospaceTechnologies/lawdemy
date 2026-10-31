"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox, Radio } from "@/components/ui/Choice";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { InfoTip, TextInput } from "@/components/ui/Field";
import { SlideOver } from "@/components/ui/SlideOver";
import { UploadDropzone, UploadProgress } from "@/components/ui/Upload";
import { LIMITS, VIDEO_MIME } from "@/lib/course/constants";
import { lessonIssues } from "@/lib/course/rules";
import type { LessonDraft } from "@/lib/course/schema";
import { joinDuration, splitDuration, type DurationFormat } from "@/lib/format";
import { useUpload, type FileRule } from "@/lib/upload-client";
import { RichTextEditor } from "./RichTextEditor";
import { newId } from "./model";

const VIDEO_RULE: FileRule = {
  accept: [...VIDEO_MIME],
  maxBytes: LIMITS.videoMaxBytes,
  maxSeconds: LIMITS.videoMaxSeconds,
  message: "Upload an MP4 video up to 500MB.",
};

const CAPTIONS_RULE: FileRule = { accept: ["text/vtt"], maxBytes: 2 * 1024 * 1024, message: "Upload a WebVTT (.vtt) captions file up to 2MB." };

type Props = {
  /** The lesson being edited, or null to add a new one. */
  lesson: LessonDraft | null;
  onSave: (lesson: LessonDraft) => Promise<boolean>;
  onClose: () => void;
  onFileRemoved: () => void;
};

/** Add/Edit Lesson slide-over (PRD INS-CRS-05/06). Mount a fresh instance per open. */
export function LessonPanel({ lesson, onSave, onClose, onFileRemoved }: Props) {
  const editing = lesson !== null;
  const [title, setTitle] = useState(lesson?.title ?? "");
  const [writeUp, setWriteUp] = useState(lesson?.writeUp ?? "");
  const [format, setFormat] = useState<DurationFormat>(lesson?.durationFormat ?? "MINUTES_SECONDS");
  const initialDur = splitDuration(lesson ? lesson.durationSeconds : null, lesson?.durationFormat ?? "MINUTES_SECONDS");
  const [durA, setDurA] = useState(lesson && lesson.durationSeconds ? initialDur[0] : "");
  const [durB, setDurB] = useState(lesson && lesson.durationSeconds ? initialDur[1] : "");
  const [preview, setPreview] = useState(lesson?.isPreview ?? false);
  const [busy, setBusy] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const video = useUpload("VIDEO", VIDEO_RULE, lesson?.video ?? null);
  const captions = useUpload("FILE", CAPTIONS_RULE, lesson?.captions ?? null);
  const uploading = video.state.status === "uploading" || captions.state.status === "uploading";

  const draft: LessonDraft = {
    id: lesson?.id ?? "",
    title,
    video: video.asset,
    captions: video.asset ? captions.asset : null,
    writeUp,
    durationSeconds: joinDuration(durA, durB, format) ?? 0,
    durationFormat: format,
    isPreview: preview,
  };
  const snapshot = useMemo(() => JSON.stringify(lesson ?? null), [lesson]);
  const dirty = editing
    ? JSON.stringify({ ...draft, id: lesson.id }) !== snapshot || uploading
    : !!(title || writeUp || video.state.status !== "idle" || captions.state.status !== "idle" || durA || durB || preview);
  const ready = lessonIssues(draft).length === 0 && !uploading;

  function requestClose() {
    if (busy) return;
    if (dirty) setConfirmDiscard(true);
    else onClose();
  }

  async function save() {
    if (!ready || busy) return;
    setBusy(true);
    const ok = await onSave({ ...draft, id: lesson?.id ?? newId(), title: title.trim() });
    if (!ok) setBusy(false);
  }

  function changeFormat(next: DurationFormat) {
    // Keep the same length when switching between formats.
    const secs = joinDuration(durA, durB, format);
    setFormat(next);
    if (secs !== null) {
      const [a, b] = splitDuration(secs, next);
      setDurA(a);
      setDurB(b);
    }
  }

  const durLabels = format === "HOURS_MINUTES" ? ["Hours", "Minutes"] : ["Minutes", "Seconds"];

  return (
    <>
      <SlideOver
        open
        title={editing ? "Edit Lesson" : "Add Lesson"}
        description={
          editing
            ? "Make changes to your lesson’s title, video, description, duration, or supporting materials. Remember to save your edits before leaving this screen."
            : "You can add both video and written content. This helps reinforce your lesson and support learners better."
        }
        onRequestClose={requestClose}
        onSubmit={save}
        footer={
          <>
            <Button variant="outline" onClick={requestClose} disabled={busy}>Cancel</Button>
            <Button type="submit" disabled={!ready} busy={busy} busyLabel="Saving…">Save</Button>
          </>
        }
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lt" className="text-xs font-semibold">Lesson Title</label>
          <TextInput id="lt" data-autofocus className="h-10 text-[13px]" maxLength={LIMITS.title} placeholder="Enter lesson title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold">
            Upload Lesson Content <InfoTip text="Keep videos clear and under 30 minutes. MP4, max 500MB. Avoid background noise." />
          </span>
          <UploadDropzone
            accept="video/mp4"
            hint="MP4 (Max file 500MB)"
            disabled={uploading}
            onFile={(f) => void video.start(f)}
          />
          <UploadProgress
            state={video.state}
            onRemove={() => {
              const hadFile = video.state.status === "done";
              video.remove();
              if (hadFile) onFileRemoved();
            }}
          />
          {video.asset && (
            <div className="mt-1 flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold">
                Captions (optional) <InfoTip text="A WebVTT (.vtt) file with timed captions. Learners can turn captions on in the player." />
              </span>
              {captions.state.status === "idle" && <UploadDropzone accept=".vtt,text/vtt" hint="WebVTT .vtt (Max file 2MB)" label="Upload captions" onFile={(f) => void captions.start(f)} />}
              <UploadProgress state={captions.state} onRemove={() => captions.remove()} />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <span id="wu-l" className="flex items-center gap-1.5 text-xs font-semibold">
            Add Lesson Write-up{" "}
            <InfoTip text="Use this to add written lesson content: summaries, key points, readings. It can go alongside or instead of a video." />
          </span>
          <RichTextEditor initialHtml={lesson?.writeUp ?? ""} onChange={setWriteUp} labelledBy="wu-l" />
        </div>

        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-1 text-[15px] font-semibold">Set Lesson Duration</legend>
          <span className="text-xs text-ink-3">Choose a format and enter the estimated duration of this lesson.</span>
          <div className="flex gap-5">
            <Radio name="ldur" label="Minutes and Seconds" checked={format === "MINUTES_SECONDS"} onChange={() => changeFormat("MINUTES_SECONDS")} />
            <Radio name="ldur" label="Hours and Minutes" checked={format === "HOURS_MINUTES"} onChange={() => changeFormat("HOURS_MINUTES")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-xs font-semibold">
              {durLabels[0]}
              <TextInput type="number" min={0} inputMode="numeric" className="h-10 text-[13px]" placeholder="0" value={durA} onChange={(e) => setDurA(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold">
              {durLabels[1]}
              <TextInput type="number" min={0} max={59} inputMode="numeric" className="h-10 text-[13px]" placeholder="0" value={durB} onChange={(e) => setDurB(e.target.value)} />
            </label>
          </div>
        </fieldset>

        <Checkbox label="Mark this lesson as a Preview" checked={preview} onChange={() => setPreview((p) => !p)} />
        {!ready && title.trim() && !uploading && (
          <p className="m-0 text-xs text-ink-3">Add a video or a write-up to save this lesson.</p>
        )}
      </SlideOver>

      <ConfirmDialog
        open={confirmDiscard}
        title="This Lesson isn’t saved yet"
        body="You’ve started creating this lesson, but your changes haven’t been saved. Are you sure you want to close this?"
        confirmLabel="Stay on Page"
        cancelLabel="Discard Changes"
        cancelTone="danger"
        onConfirm={() => setConfirmDiscard(false)}
        onCancel={() => {
          setConfirmDiscard(false);
          video.remove();
          captions.remove();
          onClose();
        }}
      />
    </>
  );
}
