"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AttachmentPicker, AttachmentPreview } from "@/components/shared/Attachments";
import { Avatar, Menu } from "@/components/shared/Discussion";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { TextArea } from "@/components/ui/Field";
import { SlideOver } from "@/components/ui/SlideOver";
import { useToast } from "@/components/ui/Toast";
import { api, ApiClientError } from "@/lib/api-client";
import type { AssetRef } from "@/lib/course/schema";
import type { QuestionView, ReplyView } from "@/lib/discussions";

/** "Write your response" slide-over for a learner question (Inst-ReplyQuestion.dc.html, INS-ENG-04). */
export function ReplyQuestion({ question, replies, closeHref }: { question: QuestionView; replies: ReplyView[]; closeHref: string }) {
  const router = useRouter();
  const toast = useToast();
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<AssetRef | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [del, setDel] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pickerKey, setPickerKey] = useState(0);

  async function send() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      if (editing) await api(`/api/qa/replies/${editing}`, { method: "PATCH", body: { body: text } });
      else await api(`/api/qa/questions/${question.id}/replies`, { body: { body: text, attachmentId: attachment?.id ?? null } });
      toast.show(editing ? { title: "Reply updated", body: "Your changes have been saved." } : { title: "Reply sent", body: "The learner has been notified." });
      setText("");
      setAttachment(null);
      setEditing(null);
      setPickerKey((k) => k + 1);
      router.refresh();
    } catch (err) {
      toast.show({ tone: "error", title: "Couldn’t send your reply", body: err instanceof ApiClientError ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!del) return;
    setBusy(true);
    await api(`/api/qa/replies/${del}`, { method: "DELETE" }).catch(() => {});
    setBusy(false);
    setDel(null);
    toast.show({ title: "Reply Deleted Successfully", body: "Your comment has been removed from the thread." });
    router.refresh();
  }

  return (
    <>
      <SlideOver
        open
        width={560}
        title="Write your response"
        onRequestClose={() => router.push(closeHref)}
        footerLayout="stack"
        footer={
          <>
            <label className="flex flex-col gap-1.5 text-xs font-semibold">
              {editing ? "Edit your reply" : "Add your reply"}
              <TextArea rows={3} maxLength={5000} placeholder="Share your answer or guidance…" value={text} onChange={(e) => setText(e.target.value)} className="text-[13px] font-normal" />
            </label>
            <div className="flex items-start justify-between gap-2">
              {editing ? <Button variant="outline" size="md" className="h-10" onClick={() => { setEditing(null); setText(""); }}>Cancel</Button> : <div className="flex flex-col gap-2"><AttachmentPicker key={pickerKey} value={attachment} onChange={setAttachment} /></div>}
              <Button size="md" className="h-10" disabled={!text.trim()} busy={busy} busyLabel="Sending…" onClick={send}>{editing ? "Save Changes" : "Send Reply"}</Button>
            </div>
          </>
        }
      >
        <article className="flex gap-3">
          <Avatar initials={question.author.initials} />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <strong className="text-sm">{question.title}</strong>
            <p className="m-0 text-[13px] leading-relaxed whitespace-pre-line text-ink-2">{question.body}</p>
            {question.attachment && <AttachmentPreview a={question.attachment} />}
            <span className="text-xs text-muted">{question.author.name} • {question.when} • {question.lessonTitle}</span>
          </div>
        </article>
        {replies.length > 0 && (
          <section aria-label="Replies" className="flex flex-col gap-3">
            <strong className="text-[13px]">{replies.length} {replies.length === 1 ? "Reply" : "Replies"}</strong>
            {replies.map((r) => (
              <div key={r.id} className="flex gap-3 border-b border-line pb-3">
                <Avatar initials={r.author.initials} own={r.author.mine} instructor={r.author.role === "INSTRUCTOR"} />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="text-[13px] font-semibold">{r.author.name} {r.author.mine && <span className="font-normal text-muted">(You)</span>}</span>
                  <p className="m-0 text-[13px] leading-relaxed whitespace-pre-line text-ink-2">{r.body}</p>
                  {r.attachment && <AttachmentPreview a={r.attachment} />}
                  <span className="text-[11px] text-muted">{r.when}{r.edited ? " (Edited)" : ""}</span>
                </div>
                {r.author.mine && <Menu items={[{ label: "Edit", onClick: () => { setEditing(r.id); setText(r.body); } }, { label: "Delete", danger: true, onClick: () => setDel(r.id) }]} />}
              </div>
            ))}
          </section>
        )}
      </SlideOver>
      <ConfirmDialog open={!!del} title="Delete your comment?" body="This comment will be permanently removed from the thread. This action can’t be undone." confirmLabel="Delete" tone="danger" busy={busy} busyLabel="Deleting…" onCancel={() => setDel(null)} onConfirm={confirmDelete} />
    </>
  );
}
