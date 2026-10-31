"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { AttachmentPicker } from "@/components/shared/Attachments";
import { ReportDialog } from "@/components/shared/ReportDialog";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { Select, TextArea, TextInput } from "@/components/ui/Field";
import { ChatIcon, EditIcon, SearchIcon, SortIcon } from "@/components/ui/icons";
import { SlideOver } from "@/components/ui/SlideOver";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { api, ApiClientError } from "@/lib/api-client";
import type { PostView } from "@/lib/community";
import type { AssetRef } from "@/lib/course/schema";
import { PostCard } from "./PostCard";

type FormState = { kind: "discussion" | "announcement"; id?: string; title: string; body: string; courseId: string; attachment: AssetRef | null };
const SORTS = [["latest", "Latest"], ["upvoted", "Most Upvoted"], ["instructors", "Instructors Only"], ["learners", "Learners Only"]] as const;
const dateLabel = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Africa/Lagos" });

/** Instructor community: discussions + course announcements (Inst-Community.dc.html, INS-COM). */
export function InstructorCommunity({ posts, announcements, courses }: { posts: PostView[]; announcements: PostView[]; courses: { id: string; title: string }[] }) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<"disc" | "ann">("disc");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<(typeof SORTS)[number][0]>("latest");
  const [sortOpen, setSortOpen] = useState(false);
  const [annFrom, setAnnFrom] = useState("");
  const [annStatus, setAnnStatus] = useState<"All" | "Published" | "Expired">("All");
  const [typeOpen, setTypeOpen] = useState(false);
  const [type, setType] = useState<"discussion" | "announcement" | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [guide, setGuide] = useState(false);
  const [detail, setDetail] = useState<PostView | null>(null);
  const [del, setDel] = useState<{ id: string; kind: "post" | "ann" | "expired" } | null>(null);
  const [report, setReport] = useState<{ type: string; id: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = posts.filter((p) => !needle || `${p.title} ${p.body}`.toLowerCase().includes(needle));
    if (sort === "upvoted") out = [...out].sort((a, b) => b.upvotes - a.upvotes);
    if (sort === "instructors") out = out.filter((p) => p.author.role === "INSTRUCTOR");
    if (sort === "learners") out = out.filter((p) => p.author.role === "LEARNER");
    return out;
  }, [posts, q, sort]);
  const anns = announcements.filter((a) => (annStatus === "All" || a.status === annStatus) && (!annFrom || a.createdAt.slice(0, 10) >= annFrom));

  async function submit() {
    if (!form) return;
    setBusy(true);
    try {
      const body = { title: form.title, body: form.body, attachmentId: form.attachment?.id ?? null };
      if (form.id) {
        await api(`/api/community/posts/${form.id}`, { method: "PATCH", body });
        toast.show(form.kind === "announcement" ? { title: "Announcement Updated", body: "Your changes have been published and learners were notified." } : { title: "Post Published", body: "Your changes are now live in the Discussions tab." });
      } else {
        await api("/api/community/posts", { body: { ...body, kind: form.kind, courseId: form.kind === "announcement" ? form.courseId : null } });
        toast.show(form.kind === "announcement" ? { title: "Announcement Published", body: "Learners enrolled in this course will now see this announcement." } : { title: "Post Published", body: "Your post is now live in the Discussions tab." });
        setTab(form.kind === "announcement" ? "ann" : "disc");
      }
      setForm(null);
      setDetail(null);
      router.refresh();
    } catch (err) {
      toast.show({ tone: "error", title: "Couldn’t publish", body: err instanceof ApiClientError ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!del) return;
    setBusy(true);
    await api(`/api/community/posts/${del.id}`, { method: "DELETE" }).catch(() => {});
    setBusy(false);
    toast.show(del.kind === "post" ? { title: "Post Deleted", body: "Your discussion post has been removed successfully." } : { title: "Post Deleted", body: "The announcement has been removed." });
    setDel(null);
    setDetail(null);
    router.refresh();
  }

  const isAnn = form?.kind === "announcement";
  const editing = !!form?.id;
  const tabCls = (on: boolean) => clsx("h-11 border-0 border-b-2 bg-transparent px-1 text-sm", on ? "border-accent font-semibold text-ink" : "border-transparent font-medium text-muted");
  const sel = "h-9 rounded-control border border-line-input bg-white px-2 text-[13px]";

  return (
    <>
      <label className="flex h-10 w-[320px] max-w-full items-center gap-2 rounded-control border border-line bg-surface px-3">
        <SearchIcon size={16} className="text-muted" />
        <input type="search" aria-label="Search posts and questions" placeholder="Search posts, questions" value={q} onChange={(e) => { setQ(e.target.value); setTab("disc"); }} className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none" />
      </label>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex max-w-[640px] flex-col gap-1">
          <h1 className="m-0 text-[28px] font-bold">Community</h1>
          <p className="m-0 text-sm text-ink-3">Share timely updates like new materials or deadline reminders. Keep your learners informed and engaged.</p>
        </div>
        <Button size="md" onClick={() => { setType(null); setTypeOpen(true); }}><EditIcon />Create Post</Button>
      </div>
      <div role="tablist" aria-label="Community sections" className="grid grid-cols-2 border-b border-line">
        <button type="button" role="tab" aria-selected={tab === "disc"} onClick={() => setTab("disc")} className={tabCls(tab === "disc")}>Discussions</button>
        <button type="button" role="tab" aria-selected={tab === "ann"} onClick={() => setTab("ann")} className={tabCls(tab === "ann")}>Announcements</button>
      </div>

      {tab === "disc" &&
        (posts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-card bg-info-tint text-info-text"><ChatIcon size={22} /></span>
            <strong className="text-lg">Let’s kick off a conversation</strong>
            <p className="m-0 max-w-[420px] text-[13px] text-ink-3">It’s a little quiet here. Start a discussion, post an announcement or ask your learners a question.</p>
            <Button size="md" className="mt-2" onClick={() => { setType(null); setTypeOpen(true); }}>Start New Post</Button>
          </div>
        ) : (
          <section className="flex flex-col gap-3">
            <div className="relative self-end">
              <Button variant="outline" size="sm" aria-expanded={sortOpen} onClick={() => setSortOpen((o) => !o)}><SortIcon />Sort: {SORTS.find((s) => s[0] === sort)![1]}</Button>
              {sortOpen && (
                <ul role="listbox" aria-label="Sort posts" className="absolute right-0 z-20 m-0 mt-1 w-52 list-none rounded-[10px] border border-line bg-white p-1.5 shadow-lg">
                  {SORTS.map(([k, l]) => (
                    <li key={k}><button type="button" role="option" aria-selected={sort === k} onClick={() => { setSort(k); setSortOpen(false); }} className={clsx("flex h-9 w-full items-center rounded-md border-0 px-2.5 text-left text-[13px]", sort === k ? "bg-surface-2 font-semibold" : "bg-transparent hover:bg-surface")}>{l}</button></li>
                  ))}
                </ul>
              )}
            </div>
            {shown.map((p) => (
              <PostCard
                key={p.id}
                p={p}
                href={`/instructor/community/${p.id}`}
                onEdit={() => setForm({ kind: "discussion", id: p.id, title: p.title, body: p.body, courseId: "", attachment: p.attachment ? { id: p.attachment.id, fileName: p.attachment.name, sizeBytes: 0 } : null })}
                onDelete={() => setDel({ id: p.id, kind: "post" })}
                onReport={() => setReport({ type: "post", id: p.id })}
              />
            ))}
            {shown.length === 0 && <p className="m-0 py-6 text-center text-[13px] text-ink-3">No posts match “{q}”.</p>}
          </section>
        ))}

      {tab === "ann" && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap justify-end gap-2">
            <label className="flex items-center gap-1.5 text-xs text-ink-3">Created after <input type="date" value={annFrom} onChange={(e) => setAnnFrom(e.target.value)} className={sel} /></label>
            <label className="flex items-center gap-1.5 text-xs text-ink-3">Status
              <select value={annStatus} onChange={(e) => setAnnStatus(e.target.value as typeof annStatus)} className={sel}><option>All</option><option>Published</option><option>Expired</option></select>
            </label>
          </div>
          <div className="overflow-x-auto rounded-card border border-line">
            <table className="w-full min-w-[720px] border-collapse text-[13px]">
              <thead><tr className="bg-surface text-left text-xs text-ink-3">{["Title", "Course", "Created On", "Status"].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {anns.map((a) => (
                  <tr key={a.id} className="border-t border-line">
                    <td className="px-4 py-3"><button type="button" onClick={() => setDetail(a)} className="border-0 bg-transparent p-0 text-left font-semibold text-ink hover:underline">{a.title}</button></td>
                    <td className="px-4 py-3 text-ink-3">{a.course?.title ?? "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-3">{dateLabel(a.createdAt)}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {anns.length === 0 && <p className="m-0 p-6 text-center text-[13px] text-ink-3">{announcements.length ? "No announcements match these filters." : "You haven’t posted any announcements yet."}</p>}
          </div>
        </section>
      )}

      <Dialog open={typeOpen} title="Create Post" description="What kind of post would you like to create?" onRequestClose={() => setTypeOpen(false)} width={480}>
        <div role="radiogroup" aria-label="Post type" className="flex flex-col gap-2.5">
          {([["discussion", "Discussion", "Engage learners, share knowledge, or start a conversation."], ["announcement", "Announcement", "Share important updates, like new modules, revised assessments or course reminders. Learners enrolled in the selected course will be notified."]] as const).map(([k, t, d]) => (
            <label key={k} className={clsx("flex cursor-pointer items-start gap-3 rounded-[10px] border p-3", type === k ? "border-primary bg-info-tint-2" : "border-line")}>
              <input type="radio" name="ptype" checked={type === k} onChange={() => setType(k)} disabled={k === "announcement" && courses.length === 0} className="mt-1 accent-primary" />
              <span className="flex flex-col gap-0.5"><strong className="text-sm">{t}</strong><span className="text-xs text-ink-3">{k === "announcement" && courses.length === 0 ? "You need a published course to post announcements." : d}</span></span>
            </label>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <Button variant="outline" onClick={() => setTypeOpen(false)}>Cancel</Button>
          <Button disabled={!type} onClick={() => { setTypeOpen(false); setForm({ kind: type!, title: "", body: "", courseId: "", attachment: null }); }}>Next</Button>
        </div>
      </Dialog>

      <SlideOver
        key={form ? `${form.kind}-${form.id ?? "new"}` : "closed"}
        open={!!form}
        width={520}
        title={!form ? "" : form.kind === "discussion" ? (editing ? "Edit Discussion" : "Discussion") : editing ? "Edit Course Announcement" : "Course Announcement"}
        description={isAnn ? (editing ? "Update your announcement details. Learners will be notified of the changes instantly." : "Keep your learners updated with important course-related information, deadlines, new materials, or upcoming schedules.") : editing ? "Refine your post, fix mistakes, or update details with ease." : "Engage learners, share knowledge, or start a conversation."}
        onRequestClose={() => !busy && setForm(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => (editing ? setForm(null) : (setForm(null), setTypeOpen(true)))} disabled={busy}>{editing ? "Cancel" : "Back"}</Button>
            <Button disabled={!form || !form.title.trim() || !form.body.trim() || (isAnn && !form.courseId && !editing)} busy={busy} busyLabel="Publishing…" onClick={submit}>
              {editing ? "Update and Publish" : isAnn ? "Publish Announcement" : "Publish Post"}
            </Button>
          </>
        }
      >
        {form && (
          <>
            {isAnn && (
              <div role="note" className="rounded-control border border-info-border bg-info-tint-2 px-3 py-2.5 text-xs text-[#3B1D8F]">
                <strong>Before you post</strong><br />You can publish up to 4 announcements per course each month, and only about course updates.{" "}
                <button type="button" onClick={() => setGuide(true)} className="border-0 bg-transparent p-0 font-semibold text-primary underline">Read the guidelines</button>
              </div>
            )}
            <label className="flex flex-col gap-1.5 text-xs font-semibold">Post Title
              <TextInput data-autofocus maxLength={200} className="h-10 text-[13px] font-normal" placeholder={isAnn ? "e.g. Module 3 case study now available" : "e.g. “Legal Frameworks”"} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold">Content
              <TextArea rows={6} maxLength={10000} className="text-[13px] font-normal" placeholder="Enter a description…" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            </label>
            {isAnn && !editing && (
              <label className="flex flex-col gap-1.5 text-xs font-semibold">Course
                <Select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} className="h-10 text-[13px] font-normal">
                  <option value="">Select course relating to this post</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </Select>
                <span className="font-normal text-ink-3">Only learners enrolled in this course will be notified.</span>
              </label>
            )}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold">Attach File (Optional)</span>
              <AttachmentPicker value={form.attachment} onChange={(a) => setForm((f) => (f ? { ...f, attachment: a } : f))} />
              <span className="text-[11px] text-muted">JPEG, PNG, PDF (Max file 5MB)</span>
            </div>
          </>
        )}
      </SlideOver>

      <Dialog open={guide} title="Announcement Guidelines" description="Keep learners informed about official course-related updates. Please follow these rules." onRequestClose={() => setGuide(false)} width={520}>
        <div className="flex flex-col gap-2 text-[13px] leading-normal text-ink-2">
          <p className="m-0"><strong>Monthly Limit:</strong> You can publish up to 4 announcements per course every month.</p>
          <p className="m-0"><strong>Post Types Allowed:</strong> Announcements should be used for:</p>
          <ul className="m-0 list-disc pl-5"><li>Adding new modules or lessons</li><li>Reordering or renaming course content</li><li>Changes to assessment materials</li><li>Course maintenance or temporary unavailability</li></ul>
          <p className="m-0"><strong>Attachments:</strong> You may include JPEG, PNG or PDF files (max 5MB) relevant to your update.</p>
          <p className="m-0"><strong>One course per announcement:</strong> Choose the course whose learners should be notified.</p>
          <p className="m-0"><strong>No External Events/Webinars:</strong> Posts about live sessions or off-platform events are not allowed.</p>
          <p className="m-0"><strong>Note</strong></p>
          <ul className="m-0 list-disc pl-5"><li>Learners receive in-app notifications when a new announcement is published for any course they’re enrolled in.</li><li>Announcements are not sent by email.</li><li>Announcements expire 30 days after publishing.</li></ul>
        </div>
      </Dialog>

      <SlideOver
        open={!!detail}
        title="Announcement Details"
        onRequestClose={() => setDetail(null)}
        footer={
          detail ? (
            detail.status === "Published" ? (
              <>
                <Button variant="danger" onClick={() => setDel({ id: detail.id, kind: "ann" })}>Delete</Button>
                <Button onClick={() => setForm({ kind: "announcement", id: detail.id, title: detail.title, body: detail.body, courseId: detail.course?.id ?? "", attachment: detail.attachment ? { id: detail.attachment.id, fileName: detail.attachment.name, sizeBytes: 0 } : null })}>Edit</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setDetail(null)}>Cancel</Button>
                <Button variant="danger" onClick={() => setDel({ id: detail.id, kind: "expired" })}>Delete</Button>
              </>
            )
          ) : undefined
        }
      >
        {detail && (
          <>
            <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-[13px]">
              <dt className="text-ink-3">Title</dt><dd className="m-0 font-medium">{detail.title}</dd>
              <dt className="text-ink-3">Course</dt><dd className="m-0 font-medium">{detail.course?.title ?? "—"}</dd>
              <dt className="text-ink-3">Published On</dt><dd className="m-0 font-medium">{dateLabel(detail.createdAt)}</dd>
              <dt className="text-ink-3">Status</dt><dd className="m-0"><StatusBadge status={detail.status} /></dd>
            </dl>
            <div className="flex flex-col gap-1 rounded-control bg-surface px-3 py-2.5 text-[13px]"><strong>Announcement Body</strong><p className="m-0 whitespace-pre-line text-ink-2">{detail.body}</p></div>
          </>
        )}
      </SlideOver>

      <ConfirmDialog
        open={!!del}
        title={del?.kind === "post" ? "Delete your post?" : del?.kind === "ann" ? "Are you sure you want to delete this announcement?" : "Delete Expired Announcement?"}
        body={del?.kind === "post" ? "This action cannot be undone. Your post and its replies will be permanently removed." : del?.kind === "ann" ? "This will permanently remove the announcement from the course. Learners will no longer be able to see it." : "This announcement has expired and is no longer visible to learners. You can safely delete it to keep your announcement list clean."}
        confirmLabel="Delete"
        tone="danger"
        busy={busy}
        busyLabel="Deleting…"
        onCancel={() => setDel(null)}
        onConfirm={confirmDelete}
      />
      <ReportDialog target={report} onClose={() => setReport(null)} />
    </>
  );
}
