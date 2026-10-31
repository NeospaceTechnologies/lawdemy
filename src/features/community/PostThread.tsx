"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AttachmentPicker, AttachmentPreview } from "@/components/shared/Attachments";
import { ReportDialog } from "@/components/shared/ReportDialog";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { TextArea } from "@/components/ui/Field";
import { ChatIcon, ChevronLeftIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/Toast";
import { Avatar, Menu, UpvoteButton } from "@/components/shared/Discussion";
import { api, ApiClientError } from "@/lib/api-client";
import type { AssetRef } from "@/lib/course/schema";
import type { PostReplyView, PostView } from "@/lib/community";

/** Reply thread for a community post (Community-Thread.dc.html). */
export function PostThread({ post, replies, back }: { post: PostView; replies: PostReplyView[]; back: string }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<{ id?: string; body: string; attachment: AssetRef | null } | null>(null);
  const [del, setDel] = useState<string | null>(null);
  const [report, setReport] = useState<{ type: string; id: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const canReply = post.kind === "discussion";

  async function send() {
    if (!form) return;
    setBusy(true);
    try {
      if (form.id) await api(`/api/community/replies/${form.id}`, { method: "PATCH", body: { body: form.body } });
      else await api(`/api/community/posts/${post.id}/replies`, { body: { body: form.body, attachmentId: form.attachment?.id ?? null } });
      toast.show(form.id ? { title: "Comment updated", body: "Your changes have been saved." } : { title: "Reply posted", body: "Your response has been added to the thread." });
      setForm(null);
      router.refresh();
    } catch (err) {
      toast.show({ tone: "error", title: "Couldn’t post your reply", body: err instanceof ApiClientError ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!del) return;
    setBusy(true);
    await api(`/api/community/replies/${del}`, { method: "DELETE" }).catch(() => {});
    setBusy(false);
    setDel(null);
    toast.show({ title: "Reply Deleted Successfully", body: "Your comment has been removed from the thread." });
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={back} aria-label="Back to community" className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-2"><ChevronLeftIcon /></Link>
          <h1 className="m-0 text-2xl font-semibold">{canReply ? "Reply Thread" : "Announcement"}</h1>
        </div>
        {canReply && <Button size="md" onClick={() => setForm({ body: "", attachment: null })}>Add Reply</Button>}
      </div>
      <article className="flex gap-3 rounded-card border border-line p-4">
        <Avatar initials={post.author.initials} own={post.author.mine} instructor={post.author.role === "INSTRUCTOR"} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h2 className="m-0 text-lg font-semibold">{post.title}</h2>
          {post.course && <span className="self-start rounded bg-info-tint px-1.5 py-0.5 text-[11px] font-semibold text-info-text">{post.course.title}</span>}
          <p className="m-0 text-sm leading-relaxed whitespace-pre-line text-ink-2">{post.body}</p>
          {post.attachment && <AttachmentPreview a={post.attachment} />}
          <span className="text-xs text-muted">{post.author.name} · {post.when}{post.edited ? " (Edited)" : ""}</span>
        </div>
        {canReply && <span className="inline-flex items-start gap-1 text-xs text-ink-3"><ChatIcon size={12} />{replies.length}</span>}
      </article>
      {canReply && (
        <section className="flex flex-col gap-4">
          <h2 className="m-0 text-base font-semibold">{replies.length} {replies.length === 1 ? "Reply" : "Replies"}</h2>
          {replies.length === 0 && <p className="m-0 rounded-card border border-dashed border-line-input p-6 text-center text-[13px] text-ink-3">No replies yet. Start the conversation.</p>}
          {replies.map((r) => (
            <article key={r.id} className="flex gap-3 border-b border-line pb-4">
              <Avatar initials={r.author.initials} own={r.author.mine} instructor={r.author.role === "INSTRUCTOR"} />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="text-[13px]"><strong>{r.author.name}</strong>{r.author.role === "INSTRUCTOR" && <span className="ml-1.5 rounded bg-info-tint px-1.5 py-0.5 text-[10px] font-semibold text-info-text">Instructor</span>} <span className="text-xs text-muted">{r.when}{r.edited ? " (Edited)" : ""}</span></span>
                <p className="m-0 text-sm leading-relaxed whitespace-pre-line text-ink-2">{r.body}</p>
                {r.attachment && <AttachmentPreview a={r.attachment} />}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Menu items={r.author.mine ? [{ label: "Edit", onClick: () => setForm({ id: r.id, body: r.body, attachment: null }) }, { label: "Delete", danger: true, onClick: () => setDel(r.id) }] : [{ label: "Report Spam", onClick: () => setReport({ type: "post_reply", id: r.id }) }]} />
                {!r.author.mine && <UpvoteButton type="post_reply" id={r.id} count={r.upvotes} voted={r.voted} />}
              </div>
            </article>
          ))}
        </section>
      )}
      <Dialog open={!!form} title={form?.id ? "Edit Comment" : "Write your response"} onRequestClose={() => !busy && setForm(null)} width={520}>
        {form && (
          <>
            <div className="flex gap-3 rounded-control bg-surface p-3">
              <Avatar initials={post.author.initials} />
              <div className="flex min-w-0 flex-col gap-1"><strong className="text-[13px]">{post.title}</strong><p className="m-0 line-clamp-2 text-xs text-ink-3">{post.body}</p><span className="text-[11px] text-muted">{post.author.name} · {post.when}</span></div>
            </div>
            <label className="flex flex-col gap-1.5 text-xs font-semibold">
              Add your reply
              <TextArea data-autofocus rows={4} maxLength={5000} placeholder="Enter a description…" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="text-[13px] font-normal" />
            </label>
            {!form.id && <AttachmentPicker value={form.attachment} onChange={(a) => setForm((s) => (s ? { ...s, attachment: a } : s))} />}
            <div className="grid grid-cols-2 gap-2.5">
              <Button variant="outline" onClick={() => setForm(null)} disabled={busy}>Cancel</Button>
              <Button disabled={!form.body.trim()} busy={busy} busyLabel="Sending…" onClick={send}>{form.id ? "Save" : "Send"}</Button>
            </div>
          </>
        )}
      </Dialog>
      <ConfirmDialog open={!!del} title="Delete your comment?" body="This action cannot be undone. Your comment will be permanently removed from the thread." confirmLabel="Delete" tone="danger" busy={busy} busyLabel="Deleting…" onCancel={() => setDel(null)} onConfirm={confirmDelete} />
      <ReportDialog target={report} onClose={() => setReport(null)} />
    </>
  );
}
