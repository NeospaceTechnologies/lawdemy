"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { ChevronLeftIcon, ExpandIcon } from "@/components/ui/icons";
import { SlideOver } from "@/components/ui/SlideOver";
import { useToast } from "@/components/ui/Toast";
import { UploadDropzone, UploadProgress } from "@/components/ui/Upload";
import { RichTextEditor } from "@/features/course-wizard/RichTextEditor";
import { api, ApiClientError } from "@/lib/api-client";
import { LIMITS, VIDEO_MIME } from "@/lib/course/constants";
import { htmlToText } from "@/lib/course/rules";
import type { CourseDraft } from "@/lib/course/schema";
import { useUpload, type FileRule } from "@/lib/upload-client";

const VIDEO_RULE: FileRule = { accept: [...VIDEO_MIME], maxBytes: LIMITS.videoMaxBytes, maxSeconds: LIMITS.videoMaxSeconds, message: "Upload an MP4 video up to 500MB." };

/** Instructor lesson preview with remove/replace (Inst-LessonPreview.dc.html, INS-PRV). */
export function LessonPreview({ courseId, draft, lessonId, editable, initialTab }: { courseId: string; draft: CourseDraft; lessonId: string; editable: boolean; initialTab: "video" | "text" }) {
  const router = useRouter();
  const toast = useToast();
  const [d, setD] = useState(draft);
  const [tab, setTab] = useState(initialTab);
  const [expanded, setExpanded] = useState(false);
  const [confirm, setConfirm] = useState<null | "removeVideo" | "removeText" | "discard">(null);
  const [busy, setBusy] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [tip, setTip] = useState(false);
  const [write, setWrite] = useState<{ html: string; orig: string } | null>(null);
  const up = useUpload("VIDEO", VIDEO_RULE, null);

  const mi = d.modules.findIndex((m) => m.lessons.some((l) => l.id === lessonId));
  const li = d.modules[mi].lessons.findIndex((l) => l.id === lessonId);
  const lesson = d.modules[mi].lessons[li];
  const number = d.modules.slice(0, mi).reduce((a, m) => a + m.lessons.length, 0) + li + 1;
  const isV = tab === "video";
  const has = isV ? !!lesson.video : !!htmlToText(lesson.writeUp);
  const other = isV ? !!htmlToText(lesson.writeUp) : !!lesson.video;

  async function save(patch: Partial<typeof lesson>, message: string) {
    const next: CourseDraft = { ...d, modules: d.modules.map((m, i) => (i !== mi ? m : { ...m, lessons: m.lessons.map((l, j) => (j === li ? { ...l, ...patch } : l)) })) };
    await api(`/api/instructor/courses/${courseId}`, { method: "PUT", body: next });
    setD(next);
    toast.show({ title: message });
    router.refresh();
  }

  async function confirmRemove() {
    setBusy(true);
    try {
      if (confirm === "removeVideo") await save({ video: null }, "Video removed from this lesson");
      else await save({ writeUp: "" }, "Text removed from this lesson");
      setConfirm(null);
    } catch (err) {
      toast.show({ tone: "error", title: "Couldn’t update the lesson", body: err instanceof ApiClientError ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Link href={`/instructor/courses/${courseId}`} aria-label="Back to course" className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-2"><ChevronLeftIcon /></Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-[26px] font-semibold">Preview</h1>
          <p className="m-0 text-sm text-ink-3">Lesson {number}: {lesson.title}. {editable ? "You can update or remove content, but each lesson must always contain at least one." : "This course isn’t editable in its current status."}</p>
        </div>
        {editable && has && (
          <div className="flex gap-2">
            <Button variant="danger" size="md" disabled={!other} title={other ? undefined : `A lesson needs at least one type of content. Add ${isV ? "a write-up" : "a video"} before removing this.`} onClick={() => other && setConfirm(isV ? "removeVideo" : "removeText")}>
              {isV ? "Remove Video" : "Remove Text"}
            </Button>
            <Button variant="outline" size="md" onClick={() => (isV ? setUploadOpen(true) : setWrite({ html: lesson.writeUp, orig: lesson.writeUp }))}>{isV ? "Replace Video" : "Replace Text"}</Button>
          </div>
        )}
      </div>
      {editable && has && !other && <p className="m-0 -mt-3 text-right text-xs text-ink-3">A lesson needs at least one type of content. Add {isV ? "a write-up" : "a video"} before removing this.</p>}

      <div role="tablist" aria-label="Lesson content" className="grid grid-cols-2 border-b border-line">
        {(["video", "text"] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => { setTab(t); setExpanded(false); }} className={clsx("h-11 border-0 border-b-2 bg-transparent text-sm", tab === t ? "border-accent font-semibold text-ink" : "border-transparent font-medium text-muted")}>
            {t === "video" ? "Video Content" : "Lesson Write-up"}
          </button>
        ))}
      </div>

      {isV && lesson.video && (
        <div className={clsx("relative overflow-hidden rounded-card bg-[#2E2A27]", expanded ? "fixed inset-3 z-40" : "aspect-video")}>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video src={`/api/media/${lesson.video.id}`} controls className="h-full w-full bg-black object-contain">
            {lesson.captions && <track kind="captions" src={`/api/media/${lesson.captions.id}`} srcLang="en" label="English" default />}
          </video>
          <button type="button" onClick={() => setExpanded((e) => !e)} aria-label={expanded ? "Collapse" : "Expand"} className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-control border-0 bg-white/85 text-ink"><ExpandIcon /></button>
        </div>
      )}
      {!isV && htmlToText(lesson.writeUp) && (
        <article className={clsx("relative flex flex-col gap-2.5 overflow-y-auto rounded-card border border-line bg-white px-6 py-5", expanded ? "fixed inset-3 z-40" : "max-h-[560px]")}>
          <button type="button" onClick={() => setExpanded((e) => !e)} aria-label={expanded ? "Collapse" : "Expand"} className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-control border-0 bg-transparent text-ink-3 hover:bg-surface"><ExpandIcon /></button>
          <h2 className="m-0 pr-10 text-xl font-semibold">{lesson.title}</h2>
          <div className="prose-lesson text-sm leading-[1.7] text-ink-2" dangerouslySetInnerHTML={{ __html: lesson.writeUp }} />
        </article>
      )}
      {!has && (
        <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-line-input px-6 py-12 text-center">
          <strong className="text-base">{isV ? "No video uploaded yet" : "No Text content added yet"}</strong>
          <p className="m-0 max-w-[460px] text-[13px] text-ink-3">{isV ? "This lesson currently has no video. Upload a video or use the text section to share your content." : "You haven’t added any written content to this lesson. Use the editor to provide written notes or explanations."}</p>
          {editable && <Button size="md" className="mt-2" onClick={() => (isV ? setUploadOpen(true) : setWrite({ html: "", orig: "" }))}>{isV ? "Upload Video" : "Add Text Content"}</Button>}
        </div>
      )}

      <Dialog
        open={uploadOpen}
        title={<span className="flex items-center gap-2">Upload File <button type="button" aria-label="Video guidelines" aria-expanded={tip} onClick={() => setTip((t) => !t)} className="flex h-5 w-5 items-center justify-center rounded-full border border-muted bg-transparent text-[10px] text-muted">i</button></span>}
        onRequestClose={() => { up.remove(); setUploadOpen(false); }}
      >
        {tip && (
          <div className="rounded-control bg-info-tint-2 px-3 py-2.5 text-xs text-info-text">
            <strong>Video Guidelines</strong>
            <ul className="m-0 mt-1 list-disc pl-4"><li>Ensure your video is clear, audible and well lit.</li><li>Maximum duration: 30 minutes.</li><li>Recommended format: MP4, max 500MB.</li><li>Use simple language and stay focused on one topic.</li><li>Avoid background noise or distracting elements.</li></ul>
          </div>
        )}
        <UploadDropzone accept="video/mp4" hint="MP4 (Max file 500MB)" disabled={up.state.status === "uploading"} onFile={(f) => void up.start(f)} />
        <UploadProgress state={up.state} onRemove={up.remove} />
        <Button
          disabled={!up.asset}
          busy={busy}
          busyLabel="Saving…"
          onClick={async () => {
            if (!up.asset) return;
            setBusy(true);
            try {
              await save({ video: up.asset }, lesson.video ? "Video replaced successfully" : "Video uploaded successfully");
              setUploadOpen(false);
            } catch (err) {
              toast.show({ tone: "error", title: "Couldn’t save the video", body: err instanceof ApiClientError ? err.message : undefined });
            } finally {
              setBusy(false);
            }
          }}
        >
          Save Video
        </Button>
      </Dialog>

      <SlideOver
        open={!!write}
        width={560}
        title={htmlToText(lesson.writeUp) ? "Edit Write-up" : "No Write-up Content Available"}
        description={htmlToText(lesson.writeUp) ? "Update the written content for this lesson. Make it clear and helpful for your learners." : "Use the space below to craft a new write-up. Make it clear and helpful for your learners."}
        onRequestClose={() => (write && write.html !== write.orig ? setConfirm("discard") : setWrite(null))}
        footer={
          <>
            <Button variant="outline" onClick={() => (write && write.html !== write.orig ? setConfirm("discard") : setWrite(null))}>Cancel</Button>
            <Button
              disabled={!write || !htmlToText(write.html) || write.html === write.orig}
              busy={busy}
              busyLabel="Saving…"
              onClick={async () => {
                if (!write) return;
                setBusy(true);
                try {
                  await save({ writeUp: write.html }, "Write-up saved successfully");
                  setWrite(null);
                } catch (err) {
                  toast.show({ tone: "error", title: "Couldn’t save the write-up", body: err instanceof ApiClientError ? err.message : undefined });
                } finally {
                  setBusy(false);
                }
              }}
            >
              Save Changes
            </Button>
          </>
        }
      >
        {write && (
          <>
            <span id="pv-wu" className="text-xs font-semibold">Add Lesson Write-up</span>
            <RichTextEditor initialHtml={write.orig} onChange={(html) => setWrite((w) => (w ? { ...w, html } : w))} labelledBy="pv-wu" />
          </>
        )}
      </SlideOver>

      <ConfirmDialog
        open={confirm === "removeVideo" || confirm === "removeText"}
        title={confirm === "removeVideo" ? "Remove Video from this Lesson?" : "Remove Text from this Lesson?"}
        body={confirm === "removeVideo" ? "Removing the video means your lesson will rely solely on the text content provided. Every lesson must include at least one type of content (video or text). Are you sure you want to proceed?" : "Removing the text means your lesson will rely solely on the uploaded video. Every lesson must include at least one type of content (video or text). Are you sure you want to proceed?"}
        confirmLabel={confirm === "removeVideo" ? "Remove Video" : "Remove Text"}
        tone="danger"
        busy={busy}
        busyLabel="Removing…"
        onCancel={() => setConfirm(null)}
        onConfirm={confirmRemove}
      />
      <ConfirmDialog
        open={confirm === "discard"}
        title="This Lesson isn’t saved yet"
        body="You’ve started creating this lesson, but your changes haven’t been saved. Are you sure you want to close this?"
        confirmLabel="Stay on Page"
        cancelLabel="Discard Changes"
        cancelTone="danger"
        onConfirm={() => setConfirm(null)}
        onCancel={() => { setConfirm(null); setWrite(null); }}
      />
    </>
  );
}
