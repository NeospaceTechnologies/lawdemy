"use client";
import { useState } from "react";
import { AttachmentPicker } from "@/components/shared/Attachments";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { TextArea, TextInput } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { api, ApiClientError } from "@/lib/api-client";
import type { AssetRef } from "@/lib/course/schema";

export type PostDraft = { id?: string; title: string; body: string; attachment: AssetRef | null };

/** Create / Edit a discussion post (Community.dc.html). */
export function PostForm({ draft, onClose, onSaved }: { draft: PostDraft | null; onClose: () => void; onSaved: (id: string, created: boolean) => void }) {
  const toast = useToast();
  const [d, setD] = useState<PostDraft | null>(draft);
  const [busy, setBusy] = useState(false);
  const editing = !!draft?.id;

  async function save() {
    if (!d) return;
    setBusy(true);
    try {
      if (editing) {
        await api(`/api/community/posts/${d.id}`, { method: "PATCH", body: { title: d.title, body: d.body, attachmentId: d.attachment?.id ?? null } });
        toast.show({ title: "Post updated", body: "Your changes have been saved." });
        onSaved(d.id!, false);
      } else {
        const r = await api<{ id: string }>("/api/community/posts", { body: { kind: "discussion", title: d.title, body: d.body, attachmentId: d.attachment?.id ?? null } });
        toast.show({ title: "Post created", body: "Your post is now live in the community." });
        onSaved(r.id, true);
      }
    } catch (err) {
      toast.show({ tone: "error", title: "Couldn’t save your post", body: err instanceof ApiClientError ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!draft} title={editing ? "Edit Post" : "Create a Post"} onRequestClose={() => !busy && onClose()} width={520}>
      {d && (
        <>
          <label className="flex flex-col gap-1.5 text-xs font-semibold">
            Title
            <TextInput data-autofocus maxLength={200} className="h-10 text-[13px] font-normal" placeholder="e.g. Can someone explain fiduciary duties with real-world examples?" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold">
            Details
            <TextArea rows={4} maxLength={10000} className="text-[13px] font-normal" placeholder="What do you want to ask or share today?" value={d.body} onChange={(e) => setD({ ...d, body: e.target.value })} />
          </label>
          <AttachmentPicker value={d.attachment} onChange={(a) => setD((s) => (s ? { ...s, attachment: a } : s))} />
          <div className="grid grid-cols-2 gap-2.5">
            <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
            <Button disabled={!d.title.trim() || !d.body.trim()} busy={busy} busyLabel={editing ? "Saving…" : "Posting…"} onClick={save}>{editing ? "Save" : "Post"}</Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
