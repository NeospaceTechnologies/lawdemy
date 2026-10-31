"use client";
import Link from "next/link";
import { AttachmentPreview } from "@/components/shared/Attachments";
import { ChatIcon } from "@/components/ui/icons";
import { Avatar, Menu, UpvoteButton } from "@/components/shared/Discussion";
import type { PostView } from "@/lib/community";

/** One community post in the list (Community.dc.html). */
export function PostCard({ p, href, onEdit, onDelete, onReport }: { p: PostView; href: string; onEdit: () => void; onDelete: () => void; onReport: () => void }) {
  return (
    <article className="flex gap-3 border-b border-line py-4">
      <Avatar initials={p.author.initials} own={p.author.mine} instructor={p.author.role === "INSTRUCTOR"} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={href} className="text-[15px] font-semibold text-ink no-underline hover:underline">{p.title}</Link>
          {p.kind === "announcement" && <span className="rounded bg-info-tint px-1.5 py-0.5 text-[10px] font-semibold text-info-text">Announcement{p.course ? ` · ${p.course.title}` : ""}</span>}
        </div>
        <p className="m-0 line-clamp-2 text-[13px] text-ink-3">{p.body}</p>
        <span className="text-xs text-muted">
          {p.author.name}
          {p.author.role === "INSTRUCTOR" ? " (Instructor)" : ""} · {p.when}
          {p.edited ? " (Edited)" : ""}
        </span>
        {p.attachment && <AttachmentPreview a={p.attachment} />}
      </div>
      <div className="flex flex-col items-end justify-between gap-2">
        <Menu items={p.author.mine ? [{ label: "Edit", onClick: onEdit }, { label: "Delete", danger: true, onClick: onDelete }] : [{ label: "Report Spam", onClick: onReport }]} />
        {p.kind === "discussion" && (
          <div className="flex items-center gap-2 text-xs text-ink-3">
            <UpvoteButton type="post" id={p.id} count={p.upvotes} voted={p.voted} />
            <span className="inline-flex items-center gap-1"><ChatIcon size={12} />{p.replyCount}</span>
          </div>
        )}
      </div>
    </article>
  );
}
