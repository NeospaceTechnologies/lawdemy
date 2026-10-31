"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReportDialog } from "@/components/shared/ReportDialog";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { ChatIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api-client";
import type { PostView } from "@/lib/community";
import { PostCard } from "./PostCard";
import { PostForm, type PostDraft } from "./PostForm";

/** Learner community feed (Community.dc.html). */
export function CommunityList({ posts, base }: { posts: PostView[]; base: string }) {
  const router = useRouter();
  const toast = useToast();
  const [draft, setDraft] = useState<PostDraft | null>(null);
  const [del, setDel] = useState<string | null>(null);
  const [report, setReport] = useState<{ type: string; id: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirmDelete() {
    if (!del) return;
    setBusy(true);
    await api(`/api/community/posts/${del}`, { method: "DELETE" }).catch(() => {});
    setBusy(false);
    setDel(null);
    toast.show({ title: "Post Deleted", body: "The post and all associated replies have been removed." });
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-[30px] font-bold tracking-[-0.01em]">Community</h1>
          <p className="m-0 text-sm text-ink-3">Join the conversation. Share insights, ask questions, grow together.</p>
        </div>
        <Button size="md" onClick={() => setDraft({ title: "", body: "", attachment: null })}>Create Post</Button>
      </div>
      {posts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-card bg-info-tint text-info-text"><ChatIcon size={22} /></span>
          <h2 className="m-0 text-lg font-semibold">Nothing Yet</h2>
          <p className="m-0 text-[13px] text-ink-3">Ask a legal question, share insights, or connect with fellow learners.</p>
        </div>
      ) : (
        <section aria-label="Posts" className="flex flex-col">
          {posts.map((p) => (
            <PostCard
              key={p.id}
              p={p}
              href={`${base}/${p.id}`}
              onEdit={() => setDraft({ id: p.id, title: p.title, body: p.body, attachment: p.attachment ? { id: p.attachment.id, fileName: p.attachment.name, sizeBytes: 0 } : null })}
              onDelete={() => setDel(p.id)}
              onReport={() => setReport({ type: "post", id: p.id })}
            />
          ))}
        </section>
      )}
      <PostForm
        key={draft ? (draft.id ?? "new") : "closed"}
        draft={draft}
        onClose={() => setDraft(null)}
        onSaved={(id, created) => {
          setDraft(null);
          if (created) router.push(`${base}/${id}`);
          else router.refresh();
        }}
      />
      <ConfirmDialog open={!!del} title="Delete this post?" body="Deleting this post will remove it and all related replies from the community. Are you sure you want to proceed?" confirmLabel="Delete" tone="danger" busy={busy} busyLabel="Deleting…" onCancel={() => setDel(null)} onConfirm={confirmDelete} />
      <ReportDialog target={report} onClose={() => setReport(null)} />
    </>
  );
}
