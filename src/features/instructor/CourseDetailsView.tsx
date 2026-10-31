"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Button, ButtonLink, IconButton } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { ChevronDownIcon, ChevronLeftIcon, EditIcon, TrashIcon } from "@/components/ui/icons";
import { COURSE_STATUS_LABEL, StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { LessonPanel } from "@/features/course-wizard/LessonPanel";
import { api, ApiClientError } from "@/lib/api-client";
import type { CourseAction } from "@/lib/course/status-rules";
import type { CourseDraft, LessonDraft } from "@/lib/course/schema";
import { durationLabel } from "@/lib/format";

type Status = keyof typeof COURSE_STATUS_LABEL;
export type DetailsProps = {
  id: string;
  status: Status;
  enrolled: number;
  actions: CourseAction[];
  rejection: string | null;
  draft: CourseDraft;
  summary: { k: string; v: string }[];
  price: { k: string; v: string }[];
  thumbnailUrl: string | null;
  initialTab?: "overview" | "content";
};

type Confirm = "archive" | "duplicate" | "restore" | "delete" | "publish" | { kind: "deleteLesson"; mi: number; li: number } | { kind: "deleteModule"; mi: number };

const CONFIRMS = {
  archive: { t: "Archive Course?", b: "Archiving hides this course from new learners. Learners already enrolled keep access. You can restore it anytime.", ok: "Archive Course", busy: "Archiving…", danger: false },
  duplicate: { t: "Duplicate Course?", b: "We’ll create a copy of this course, including its structure and content. You’ll find the duplicate saved as a draft.", ok: "Duplicate Course", busy: "Duplicating…", danger: false },
  restore: { t: "Restore Course?", b: "This course will be restored and become visible to learners again. Enrolled learners will regain full access.", ok: "Restore Course", busy: "Restoring Course…", danger: false },
  delete: { t: "Delete Course?", b: "Are you sure you want to permanently delete this course? This action cannot be undone.", ok: "Delete Course", busy: "Deleting Course…", danger: true },
  publish: { t: "Ready to Publish Your course?", b: "Your course will be sent to the Lawdemy team for review before it goes live. Estimated review time: 24–48 hours.", ok: "Publish Course", busy: "Publishing…", danger: false },
  deleteLesson: { t: "Delete Lesson?", b: "This lesson will be permanently removed from the module. All content added to it will be lost. Are you sure you want to proceed?", ok: "Delete", busy: "Deleting…", danger: true },
  deleteModule: { t: "Delete Module and its Content?", b: "This module and every lesson in it will be permanently removed. This action cannot be undone.", ok: "Delete", busy: "Deleting…", danger: true },
};

/** Instructor course details by status (Inst-CourseDetails.dc.html, INS-MGT-03..08). */
export function CourseDetailsView(p: DetailsProps) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<"overview" | "content" | "engagement">(p.initialTab ?? "overview");
  const [open, setOpen] = useState<Record<number, boolean>>({ 0: true });
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [busy, setBusy] = useState(false);
  const [modules, setModules] = useState(p.draft.modules);
  const [edit, setEdit] = useState<{ mi: number; lesson: LessonDraft } | null>(null);
  const editable = p.actions.includes("edit");
  const withLearners = p.status === "LIVE" || (p.status === "ARCHIVED" && p.enrolled > 0);
  const label = COURSE_STATUS_LABEL[p.status];
  const editHint = p.status === "UNDER_REVIEW" ? "Editing is paused while the course is under review." : p.status === "ARCHIVED" ? "Restore the course to make changes." : "Live courses can’t be edited. Duplicate it to make changes.";
  const allOpen = modules.every((_, i) => open[i]);

  async function saveModules(next: typeof modules) {
    await api(`/api/instructor/courses/${p.id}`, { method: "PUT", body: { ...p.draft, modules: next } });
    setModules(next);
  }

  async function run() {
    if (!confirm) return;
    setBusy(true);
    try {
      if (typeof confirm === "object") {
        const next = modules.map((m) => ({ ...m, lessons: [...m.lessons] }));
        if (confirm.kind === "deleteLesson") next[confirm.mi].lessons.splice(confirm.li, 1);
        else next.splice(confirm.mi, 1);
        await saveModules(next);
        toast.show(confirm.kind === "deleteLesson" ? { title: "Lesson Deleted", body: "The lesson has been removed from this module." } : { title: "Module Deleted Successfully", body: "The module and its lessons have been removed." });
      } else if (confirm === "delete") {
        await api(`/api/instructor/courses/${p.id}/delete`, { method: "POST" });
        toast.show({ title: "Course deleted successfully", body: "It has been removed from your library." });
        router.push("/instructor/courses");
        return;
      } else if (confirm === "publish") {
        await api(`/api/instructor/courses/${p.id}/submit`, { method: "POST" });
        toast.show({ title: "Course submitted for review", body: "We’ll notify you once it’s approved." });
      } else if (confirm === "duplicate") {
        const r = await api<{ id: string }>(`/api/instructor/courses/${p.id}/actions`, { body: { action: "duplicate" } });
        toast.show({ title: "Course duplicated successfully", body: "The copy is saved in your drafts." });
        router.push(`/instructor/courses/${r.id}`);
        return;
      } else {
        await api(`/api/instructor/courses/${p.id}/actions`, { body: { action: confirm } });
        toast.show(confirm === "archive" ? { title: "Course archived successfully", body: "It’s no longer visible to new learners." } : { title: "Course Restored Successfully", body: "Your course is live again." });
      }
      setConfirm(null);
      router.refresh();
    } catch (err) {
      toast.show({ tone: "error", title: "Something went wrong", body: err instanceof ApiClientError ? err.message : undefined });
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  }

  const cf = confirm ? CONFIRMS[typeof confirm === "object" ? confirm.kind : confirm] : null;
  const actions: { label: string; run: () => void; danger?: boolean }[] = [];
  if (p.status === "LIVE") actions.push({ label: "Archive Course", run: () => setConfirm("archive") }, { label: "Duplicate Course", run: () => setConfirm("duplicate") });
  if (p.status === "DRAFT") actions.push({ label: "Delete Course", danger: true, run: () => setConfirm("delete") }, { label: "Publish Course", run: () => setConfirm("publish") });
  if (p.status === "REJECTED") actions.push({ label: "Delete Course", danger: true, run: () => setConfirm("delete") }, { label: "Resubmit for Review", run: () => setConfirm("publish") });
  if (p.status === "ARCHIVED") {
    if (p.actions.includes("delete")) actions.push({ label: "Delete Permanently", danger: true, run: () => setConfirm("delete") });
    actions.push({ label: "Restore Course", run: () => setConfirm("restore") });
  }

  const tabCls = (on: boolean) => clsx("flex h-11 items-center justify-center border-0 border-b-2 bg-transparent text-sm no-underline", on ? "border-accent font-semibold text-ink" : "border-transparent font-medium text-muted");
  const totalLessons = modules.reduce((a, m) => a + m.lessons.length, 0);
  const totalSec = modules.reduce((a, m) => a + m.lessons.reduce((b, l) => b + l.durationSeconds, 0), 0);

  return (
    <>
      {p.status === "UNDER_REVIEW" && (
        <div role="note" className="flex gap-2.5 rounded-[10px] bg-warning px-3.5 py-3 text-white">
          <div className="flex flex-col gap-0.5"><strong className="text-[13px]">Course in Review</strong><span className="text-[13px]">The Lawdemy team is reviewing this course. Editing is paused until the review is complete, which usually takes 24–48 hours.</span></div>
        </div>
      )}
      {p.status === "REJECTED" && (
        <div role="note" className="flex gap-2.5 rounded-[10px] bg-danger px-3.5 py-3 text-white">
          <div className="flex flex-col gap-0.5"><strong className="text-[13px]">Course Rejected</strong><span className="text-[13px]">This course wasn’t approved for publishing. Review the reason below, make the changes and resubmit it for review.</span></div>
        </div>
      )}
      {p.status === "ARCHIVED" && p.enrolled > 0 && (
        <div role="note" className="flex gap-2.5 rounded-[10px] border border-info-border bg-info-tint-2 px-3.5 py-3 text-[#3B1D8F]">
          <div className="flex flex-col gap-0.5"><strong className="text-[13px]">Important Notice</strong><span className="text-[13px]">This course is archived. Learners who enrolled before archiving still have access, so it can’t be deleted permanently. You can restore it at any time.</span></div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/instructor/courses" aria-label="Back to My Courses" className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-2"><ChevronLeftIcon /></Link>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-ink-3">Status <StatusBadge status={label} /></span>
          {editable ? (
            <ButtonLink href={`/instructor/courses/${p.id}/edit`} variant="ghost" size="md" className="h-9 border border-line-input"><EditIcon />Edit</ButtonLink>
          ) : (
            <Button size="md" className="h-9" disabled title={editHint}><EditIcon />Edit</Button>
          )}
        </div>
      </div>
      {!editable && <p className="m-0 -mt-3 text-right text-xs text-ink-3">{editHint}</p>}
      <h1 className="m-0 text-[26px] font-semibold">{p.draft.info.title}</h1>
      {p.status === "REJECTED" && p.rejection && (
        <div className="flex flex-col gap-1 rounded-[10px] border border-info-border bg-info-tint-2 px-3.5 py-3">
          <strong className="text-[13px] text-[#3B1D8F]">Reason for rejection</strong>
          <span className="text-[13px] leading-normal whitespace-pre-line text-ink-3">{p.rejection}</span>
        </div>
      )}

      <div role="tablist" aria-label="Course sections" className="grid grid-cols-3 border-b border-line">
        <button type="button" role="tab" aria-selected={tab === "overview"} onClick={() => setTab("overview")} className={tabCls(tab === "overview")}>Overview</button>
        <button type="button" role="tab" aria-selected={tab === "content"} onClick={() => setTab("content")} className={tabCls(tab === "content")}>Content</button>
        {withLearners ? (
          <Link role="tab" aria-selected={false} href={`/instructor/courses/${p.id}/engagement`} className={tabCls(false)}>Engagement</Link>
        ) : (
          <button type="button" role="tab" aria-selected={tab === "engagement"} onClick={() => setTab("engagement")} className={tabCls(tab === "engagement")}>Engagement</button>
        )}
      </div>

      {tab !== "engagement" && (
        <div className="flex h-[220px] items-end rounded-card bg-[#2B2F36] bg-cover bg-center p-3" style={p.thumbnailUrl ? { backgroundImage: `url(${p.thumbnailUrl})` } : undefined}>
          {!p.thumbnailUrl && <span className="text-xs text-line-input">[Course image]</span>}
        </div>
      )}

      {tab === "overview" && (
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-2"><h2 className="m-0 text-base font-semibold">Description</h2><p className="m-0 text-sm leading-relaxed whitespace-pre-line text-ink-2">{p.draft.info.description || "—"}</p></div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2"><h2 className="m-0 text-base font-semibold">Course Summary</h2>{p.summary.map((r) => <span key={r.k} className="text-[13px] text-ink-3">{r.k}: <strong className="text-ink">{r.v}</strong></span>)}</div>
            <div className="flex flex-col gap-2"><h2 className="m-0 text-base font-semibold">Price Information</h2>{p.price.map((r) => <span key={r.k} className="text-[13px] text-ink-3">{r.k}: <strong className="text-ink">{r.v}</strong></span>)}</div>
          </div>
          {p.draft.info.outcomes && (
            <div className="flex flex-col gap-2">
              <h2 className="m-0 text-base font-semibold">Objectives</h2>
              <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-sm text-ink-2">{p.draft.info.outcomes.split("\n").filter((s) => s.trim()).map((o) => <li key={o}>{o}</li>)}</ul>
            </div>
          )}
        </section>
      )}

      {tab === "content" && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="m-0 text-base font-semibold">Course Content</h2>
              <span className="text-xs text-ink-3">Total Modules: {modules.length} • Total Lessons: {totalLessons} • Quiz: {p.draft.quiz ? `${p.draft.quiz.questions.length} Questions` : "None"} • Total Duration: {durationLabel(totalSec, "HOURS_MINUTES")}</span>
            </div>
            <button type="button" onClick={() => setOpen(allOpen ? {} : Object.fromEntries(modules.map((_, i) => [i, true])))} className="border-0 bg-transparent text-[13px] font-semibold text-primary">{allOpen ? "Collapse All" : "Expand All"}</button>
          </div>
          {modules.map((m, mi) => (
            <article key={m.id} className="rounded-card border border-line">
              <button type="button" aria-expanded={!!open[mi]} onClick={() => setOpen({ ...open, [mi]: !open[mi] })} className="flex w-full items-center justify-between gap-3 border-0 bg-transparent px-4 py-3 text-left">
                <span className="flex flex-col gap-1"><strong className="text-sm">Module {mi + 1}: {m.title || "Untitled module"}</strong><span className="text-xs text-ink-3">Total Lessons: {m.lessons.length} • Lessons Marked for Preview: {m.lessons.filter((l) => l.isPreview).length}</span></span>
                <ChevronDownIcon className={clsx("text-ink-3 transition-transform", open[mi] && "rotate-180")} strokeWidth={2} />
              </button>
              {open[mi] && (
                <div className="flex flex-col gap-2.5 border-t border-line px-4 py-3">
                  {m.lessons.map((l, li) => (
                    <div key={l.id} className="flex gap-3 rounded-[10px] border border-line px-3 py-2.5 text-xs text-ink-3">
                      <div className="flex flex-1 flex-col gap-1">
                        <strong className="text-[13px] text-ink">Lesson {li + 1}: {l.title}</strong>
                        <span>Video Uploaded: {l.video ? <Link href={`/instructor/courses/${p.id}/lessons/${l.id}?tab=video`}>Watch Preview</Link> : "N/A"}</span>
                        <span>Text Content Added: {l.writeUp ? <Link href={`/instructor/courses/${p.id}/lessons/${l.id}?tab=text`}>View Text</Link> : "N/A"}</span>
                        <span>Lesson Duration: <strong className="font-medium text-ink">{durationLabel(l.durationSeconds, l.durationFormat)}</strong></span>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {l.isPreview && <span className="inline-flex h-[22px] items-center rounded-full bg-ink px-2 text-[11px] font-semibold text-white">Preview</span>}
                        {editable && (
                          <div className="flex gap-1.5">
                            <IconButton tone="danger" aria-label={`Delete lesson ${li + 1}`} onClick={() => setConfirm({ kind: "deleteLesson", mi, li })}><TrashIcon /></IconButton>
                            <IconButton tone="outline" aria-label={`Edit lesson ${li + 1}`} onClick={() => setEdit({ mi, lesson: l })}><EditIcon /></IconButton>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {m.lessons.length === 0 && <p className="m-0 text-[13px] text-ink-3">No lessons added yet. Use Edit to add lessons to this module.</p>}
                  {editable && <Button variant="danger" size="sm" className="self-end" onClick={() => setConfirm({ kind: "deleteModule", mi })}>Delete Module</Button>}
                </div>
              )}
            </article>
          ))}
        </section>
      )}

      {tab === "engagement" && (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <strong className="text-base">No learners enrolled yet</strong>
          <p className="m-0 text-[13px] text-ink-3">Once learners start enrolling, their progress and feedback will appear here.</p>
        </div>
      )}

      {actions.length > 0 && (
        <div className="grid grid-cols-1 gap-2.5 border-t border-line pt-4 sm:grid-cols-2">
          {actions.map((a) => <Button key={a.label} variant={a.danger ? "danger" : "primary"} className="h-[46px]" onClick={a.run}>{a.label}</Button>)}
        </div>
      )}

      {edit && (
        <LessonPanel
          lesson={edit.lesson}
          onClose={() => setEdit(null)}
          onFileRemoved={() => toast.show({ title: "File Deleted", body: "The video has been removed from this lesson." })}
          onSave={async (l) => {
            const next = modules.map((m, i) => (i === edit.mi ? { ...m, lessons: m.lessons.map((x) => (x.id === l.id ? l : x)) } : m));
            try {
              await saveModules(next);
              setEdit(null);
              toast.show({ title: "Lesson Updated!", body: "Your changes have been saved successfully." });
              router.refresh();
              return true;
            } catch (err) {
              toast.show({ tone: "error", title: "Couldn’t save the lesson", body: err instanceof ApiClientError ? err.message : undefined });
              return false;
            }
          }}
        />
      )}
      <ConfirmDialog open={!!cf} title={cf?.t ?? ""} body={cf?.b ?? ""} confirmLabel={cf?.ok ?? ""} tone={cf?.danger ? "danger" : "primary"} busy={busy} busyLabel={cf?.busy} onCancel={() => setConfirm(null)} onConfirm={run} />
    </>
  );
}
