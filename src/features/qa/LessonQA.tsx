"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { AttachmentPicker, AttachmentPreview } from "@/components/shared/Attachments";
import { ReportDialog } from "@/components/shared/ReportDialog";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { TextArea, TextInput } from "@/components/ui/Field";
import { ChatIcon, ChevronLeftIcon, CloseIcon, SearchIcon } from "@/components/ui/icons";
import { Avatar, Menu, UpvoteButton } from "@/components/shared/Discussion";
import { useToast } from "@/components/ui/Toast";
import { api, ApiClientError } from "@/lib/api-client";
import type { AssetRef } from "@/lib/course/schema";
import type { QuestionView, ReplyView } from "@/lib/discussions";

type Data = { questions: QuestionView[]; thread: { question: QuestionView; replies: ReplyView[] } | null };
type Viewer = { id: string; firstName: string; lastName: string };

/** Lesson Q&A tab: list, search, ask, thread, reply, edit, delete, report (QA-*.dc.html). */
export function LessonQA({ data, courseId, lessonId, viewer }: { data: Data; courseId: string; lessonId: string; viewer: Viewer }) {
  const router = useRouter();
  const path = usePathname();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState("");
  const [searching, setSearching] = useState(false);
  const [ask, setAsk] = useState<{ id?: string; title: string; body: string; attachment: AssetRef | null } | null>(null);
  const [reply, setReply] = useState<{ id?: string; body: string; attachment: AssetRef | null } | null>(null);
  const [confirm, setConfirm] = useState<{ kind: "question" | "reply"; id: string } | null>(null);
  const [report, setReport] = useState<{ type: string; id: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (q === applied) return;
    setSearching(true);
    const t = setTimeout(() => {
      setApplied(q);
      setSearching(false);
    }, 400);
    return () => clearTimeout(t);
  }, [q, applied]);

  const list = useMemo(() => {
    const needle = applied.trim().toLowerCase();
    return needle ? data.questions.filter((x) => `${x.title} ${x.body}`.toLowerCase().includes(needle)) : data.questions;
  }, [applied, data.questions]);

  const base = `${path}?tab=qa`;
  const refresh = () => router.refresh();

  async function saveQuestion() {
    if (!ask) return;
    setBusy(true);
    try {
      if (ask.id) {
        await api(`/api/qa/questions/${ask.id}`, { method: "PATCH", body: { title: ask.title, body: ask.body } });
        refresh();
      } else {
        const r = await api<{ id: string }>("/api/qa/questions", { body: { lessonId, title: ask.title, body: ask.body, attachmentId: ask.attachment?.id ?? null } });
        router.push(`${base}&q=${r.id}`);
      }
      toast.show(ask.id ? { title: "Question updated", body: "Your changes have been saved." } : { title: "Question posted", body: "Learners and the instructor can now reply." });
      setAsk(null);
    } catch (err) {
      toast.show({ tone: "error", title: "Couldn’t save your question", body: err instanceof ApiClientError ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  async function saveReply() {
    if (!reply || !data.thread) return;
    setBusy(true);
    try {
      if (reply.id) await api(`/api/qa/replies/${reply.id}`, { method: "PATCH", body: { body: reply.body } });
      else await api(`/api/qa/questions/${data.thread.question.id}/replies`, { body: { body: reply.body, attachmentId: reply.attachment?.id ?? null } });
      toast.show(reply.id ? { title: "Reply updated", body: "Your changes have been saved." } : { title: "Reply posted", body: "Your response has been added to the discussion." });
      setReply(null);
      refresh();
    } catch (err) {
      toast.show({ tone: "error", title: "Couldn’t post your reply", body: err instanceof ApiClientError ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  async function doDelete() {
    if (!confirm) return;
    setBusy(true);
    try {
      await api(confirm.kind === "question" ? `/api/qa/questions/${confirm.id}` : `/api/qa/replies/${confirm.id}`, { method: "DELETE" });
      toast.show(confirm.kind === "question" ? { title: "Question Deleted Successfully", body: "The question and all associated replies have been removed." } : { title: "Reply Deleted Successfully", body: "Your reply has been removed from the discussion." });
      if (confirm.kind === "question") router.push(base);
      setConfirm(null);
      refresh();
    } finally {
      setBusy(false);
    }
  }

  const questionMenu = (x: QuestionView) =>
    x.author.mine
      ? [{ label: "Edit Question", onClick: () => setAsk({ id: x.id, title: x.title, body: x.body, attachment: null }) }, { label: "Delete Question", danger: true, onClick: () => setConfirm({ kind: "question", id: x.id }) }]
      : [{ label: "Report Spam", onClick: () => setReport({ type: "question", id: x.id }) }];

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="m-0 max-w-[560px] text-sm text-ink-3">Ask questions, share knowledge, and connect with fellow learners and legal professionals.</p>
      <Button size="md" onClick={() => setAsk({ title: "", body: "", attachment: null })}>Ask a Question</Button>
    </div>
  );

  const t = data.thread;
  return (
    <div className="flex flex-col gap-5">
      {header}
      {t ? (
        <section className="flex flex-col gap-4">
          <Link href={base} className="inline-flex items-center gap-1 self-start text-[13px] font-semibold no-underline"><ChevronLeftIcon size={14} /> All questions</Link>
          <article className="flex gap-3 rounded-card border border-line p-4">
            <Avatar initials={t.question.author.initials} own={t.question.author.mine} instructor={t.question.author.role === "INSTRUCTOR"} />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <h2 className="m-0 text-base font-semibold">{t.question.title}</h2>
                <Menu items={questionMenu(t.question)} />
              </div>
              <p className="m-0 text-sm leading-relaxed whitespace-pre-line text-ink-2">{t.question.body}</p>
              {t.question.attachment && <AttachmentPreview a={t.question.attachment} />}
              <span className="text-xs text-muted">{t.question.author.name} · {t.question.when}{t.question.edited ? " (Edited)" : ""} · {t.question.lessonTitle}</span>
              <div className="flex items-center gap-2"><UpvoteButton type="question" id={t.question.id} count={t.question.upvotes} voted={t.question.voted} /></div>
            </div>
          </article>
          <div className="flex items-center justify-between">
            <h3 className="m-0 text-[15px] font-semibold">Responses <span className="font-normal text-muted">({t.replies.length})</span></h3>
            <Button size="md" variant="outline" onClick={() => setReply({ body: "", attachment: null })}>Write your response</Button>
          </div>
          {t.replies.length === 0 && <p className="m-0 rounded-card border border-dashed border-line-input p-6 text-center text-[13px] text-ink-3">No responses yet. Be the first to help.</p>}
          {t.replies.map((r) => (
            <article key={r.id} className="flex gap-3 border-b border-line pb-4">
              <Avatar initials={r.author.initials} own={r.author.mine} instructor={r.author.role === "INSTRUCTOR"} />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[13px]">
                    <strong>{r.author.name}</strong>
                    {r.author.role === "INSTRUCTOR" && <span className="ml-1.5 rounded bg-info-tint px-1.5 py-0.5 text-[10px] font-semibold text-info-text">Instructor</span>}
                    <span className="ml-1.5 text-xs text-muted">{r.when}{r.edited ? " (Edited)" : ""}</span>
                  </span>
                  <Menu
                    items={
                      r.author.mine
                        ? [{ label: "Edit Comment", onClick: () => setReply({ id: r.id, body: r.body, attachment: null }) }, { label: "Delete Comment", danger: true, onClick: () => setConfirm({ kind: "reply", id: r.id }) }]
                        : [{ label: "Report Spam", onClick: () => setReport({ type: "question_reply", id: r.id }) }]
                    }
                  />
                </div>
                <p className="m-0 text-sm leading-relaxed whitespace-pre-line text-ink-2">{r.body}</p>
                {r.attachment && <AttachmentPreview a={r.attachment} />}
                <UpvoteButton type="question_reply" id={r.id} count={r.upvotes} voted={r.voted} />
              </div>
            </article>
          ))}
        </section>
      ) : (
        <>
          <label className={clsx("flex h-10 max-w-[480px] items-center gap-2 rounded-control border px-3", q ? "border-primary" : "border-line")}>
            <SearchIcon size={16} className="text-muted" />
            <input type="search" aria-label="Search this course’s discussions" placeholder="Search this course’s discussions…" value={q} onChange={(e) => setQ(e.target.value)} className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none" />
            {q && <button type="button" aria-label="Clear search" onClick={() => setQ("")} className="flex h-6 w-6 items-center justify-center text-ink-3"><CloseIcon size={10} /></button>}
          </label>
          {searching ? (
            <div aria-busy="true" className="flex flex-col gap-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-card bg-surface" />)}</div>
          ) : data.questions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-card bg-info-tint text-info-text"><ChatIcon size={22} /></span>
              <h2 className="m-0 text-lg font-semibold">No Discussions Yet For This Course</h2>
              <p className="m-0 text-[13px] text-ink-3">Be the first to ask a question or start a conversation.</p>
            </div>
          ) : (
            <section className="flex flex-col gap-3">
              <h2 className="m-0 text-base font-semibold">All Questions in this course <span className="font-normal text-muted">({list.length} result{list.length === 1 ? "" : "s"})</span></h2>
              {list.length === 0 && <p className="m-0 py-6 text-center text-[13px] text-ink-3">No questions match “{applied}”.</p>}
              {list.map((x) => (
                <article key={x.id} className="flex gap-3 rounded-card border border-line p-4">
                  <Avatar initials={x.author.initials} own={x.author.mine} instructor={x.author.role === "INSTRUCTOR"} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <Link href={`${base}&q=${x.id}`} className="text-[15px] font-semibold text-ink no-underline hover:underline">{x.title}</Link>
                    <p className="m-0 line-clamp-2 text-[13px] text-ink-3">{x.body}</p>
                    <span className="text-xs text-muted">{x.author.name} · {x.when}{x.edited ? " (Edited)" : ""}</span>
                  </div>
                  <div className="flex flex-col items-end justify-between gap-2">
                    <Menu items={questionMenu(x)} />
                    <div className="flex items-center gap-2 text-xs text-ink-3">
                      <UpvoteButton type="question" id={x.id} count={x.upvotes} voted={x.voted} />
                      <span className="inline-flex items-center gap-1"><ChatIcon size={12} />{x.replyCount}</span>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}
        </>
      )}

      <Dialog open={!!ask} title={ask?.id ? "Edit Question" : "Ask A Question"} onRequestClose={() => !busy && setAsk(null)} width={520}>
        {ask && (
          <>
            <label className="flex flex-col gap-1.5 text-xs font-semibold">
              Title
              <TextInput data-autofocus maxLength={200} className="h-10 text-[13px] font-normal" placeholder="e.g. Can someone explain fiduciary duties with real-world examples?" value={ask.title} onChange={(e) => setAsk({ ...ask, title: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold">
              Details
              <TextArea rows={5} maxLength={5000} className="text-[13px] font-normal" placeholder="e.g. At 05:40 I didn’t understand this part." value={ask.body} onChange={(e) => setAsk({ ...ask, body: e.target.value })} />
            </label>
            {!ask.id && <AttachmentPicker value={ask.attachment} onChange={(a) => setAsk((s) => (s ? { ...s, attachment: a } : s))} />}
            <div className="rounded-control bg-info-tint-2 px-3 py-2.5 text-xs text-info-text">
              <strong className="flex items-center gap-1.5">Tips:</strong>
              <ul className="m-0 mt-1 list-disc pl-4"><li>Keep your question clear and concise.</li><li>Be as detailed as possible.</li></ul>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Button variant="outline" onClick={() => setAsk(null)} disabled={busy}>Cancel</Button>
              <Button disabled={!ask.title.trim() || !ask.body.trim()} busy={busy} busyLabel={ask.id ? "Saving…" : "Posting…"} onClick={saveQuestion}>{ask.id ? "Save" : "Post Question"}</Button>
            </div>
          </>
        )}
      </Dialog>

      <Dialog open={!!reply} title={reply?.id ? "Edit Comment" : "Write your response"} onRequestClose={() => !busy && setReply(null)} width={520}>
        {reply && (
          <>
            <TextArea data-autofocus rows={5} maxLength={5000} aria-label="Your response" placeholder="Enter a description…" value={reply.body} onChange={(e) => setReply({ ...reply, body: e.target.value })} className="text-[13px]" />
            {!reply.id && <AttachmentPicker value={reply.attachment} onChange={(a) => setReply((s) => (s ? { ...s, attachment: a } : s))} />}
            <div className="grid grid-cols-2 gap-2.5">
              <Button variant="outline" onClick={() => setReply(null)} disabled={busy}>Cancel</Button>
              <Button disabled={!reply.body.trim()} busy={busy} busyLabel="Sending…" onClick={saveReply}>{reply.id ? "Save" : "Send"}</Button>
            </div>
          </>
        )}
      </Dialog>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.kind === "question" ? "Delete this question?" : "Delete this reply?"}
        body={confirm?.kind === "question" ? "Deleting this question will remove it and all related replies from the discussion. Are you sure you want to proceed?" : "Deleting this reply will remove it from the discussion. Are you sure you want to proceed?"}
        confirmLabel="Delete"
        tone="danger"
        busy={busy}
        busyLabel="Deleting…"
        onCancel={() => setConfirm(null)}
        onConfirm={doDelete}
      />
      <ReportDialog target={report} onClose={() => setReport(null)} />
    </div>
  );
}
