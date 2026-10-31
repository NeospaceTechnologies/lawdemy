import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { BUSINESS } from "@/lib/config";
import { attachments, author, relTime, voteInfo, type Attachment, type Author } from "@/lib/discussions";

// Community discussions and course announcements (LRN-ACC-01/02, INS-COM).

export type PostView = {
  id: string;
  kind: "discussion" | "announcement";
  title: string;
  body: string;
  author: Author;
  when: string;
  createdAt: string;
  edited: boolean;
  upvotes: number;
  voted: boolean;
  replyCount: number;
  attachment: Attachment;
  course: { id: string; title: string } | null;
  status: "Published" | "Expired";
};

export type PostSort = "latest" | "upvoted" | "instructors" | "learners";

const userSel = { select: { id: true, firstName: true, lastName: true, role: true } } as const;

/** Announcements past their expiry date are marked Expired when read. */
export async function expireAnnouncements() {
  await db.post.updateMany({ where: { kind: "announcement", status: "published", expiresAt: { lte: new Date() } }, data: { status: "expired" } });
}

export async function loadPosts(viewerId: string, opts: { sort?: PostSort; where?: Prisma.PostWhereInput } = {}): Promise<PostView[]> {
  await expireAnnouncements();
  const where: Prisma.PostWhereInput = { deletedAt: null, status: { not: "hidden" }, ...opts.where };
  if (opts.sort === "instructors") where.author = { role: "INSTRUCTOR" };
  if (opts.sort === "learners") where.author = { role: "LEARNER" };
  const rows = await db.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { author: userSel, course: { select: { id: true, title: true } }, _count: { select: { replies: { where: { deletedAt: null } } } } },
  });
  const [att, votes] = await Promise.all([attachments(rows.map((r) => r.attachmentId)), voteInfo("post", rows.map((r) => r.id), viewerId)]);
  const list = rows.map((r) => toView(r, viewerId, att, votes));
  if (opts.sort === "upvoted") list.sort((a, b) => b.upvotes - a.upvotes);
  return list;
}

type Row = Prisma.PostGetPayload<{ include: { author: typeof userSel; course: { select: { id: true; title: true } }; _count: { select: { replies: true } } } }>;

function toView(r: Row, viewerId: string, att: Map<string, Attachment>, votes: Awaited<ReturnType<typeof voteInfo>>): PostView {
  return {
    id: r.id,
    kind: r.kind === "announcement" ? "announcement" : "discussion",
    title: r.title,
    body: r.body,
    author: author(r.author, viewerId),
    when: relTime(r.createdAt),
    createdAt: r.createdAt.toISOString(),
    edited: !!r.editedAt,
    upvotes: votes.counts.get(r.id) ?? 0,
    voted: votes.mine.has(r.id),
    replyCount: r._count.replies,
    attachment: r.attachmentId ? (att.get(r.attachmentId) ?? null) : null,
    course: r.course,
    status: r.status === "expired" ? "Expired" : "Published",
  };
}

export type PostReplyView = { id: string; body: string; author: Author; when: string; edited: boolean; upvotes: number; voted: boolean; attachment: Attachment };

export async function loadThread(postId: string, viewerId: string) {
  await expireAnnouncements();
  const r = await db.post.findFirst({
    where: { id: postId, deletedAt: null, status: { not: "hidden" } },
    include: { author: userSel, course: { select: { id: true, title: true } }, _count: { select: { replies: { where: { deletedAt: null } } } } },
  });
  if (!r) return null;
  const replies = await db.postReply.findMany({ where: { postId, deletedAt: null }, orderBy: { createdAt: "asc" }, include: { author: userSel } });
  const [att, votes, rvotes] = await Promise.all([
    attachments([r.attachmentId, ...replies.map((x) => x.attachmentId)]),
    voteInfo("post", [r.id], viewerId),
    voteInfo("post_reply", replies.map((x) => x.id), viewerId),
  ]);
  return {
    post: toView(r, viewerId, att, votes),
    replies: replies.map<PostReplyView>((x) => ({
      id: x.id,
      body: x.body,
      author: author(x.author, viewerId),
      when: relTime(x.createdAt),
      edited: !!x.editedAt,
      upvotes: rvotes.counts.get(x.id) ?? 0,
      voted: rvotes.mine.has(x.id),
      attachment: x.attachmentId ? (att.get(x.attachmentId) ?? null) : null,
    })),
  };
}

/** Announcements are visible to the author and learners enrolled in the course. */
export async function canSeePost(post: { kind: string; courseId: string | null; authorId: string }, user: { id: string; role: string }) {
  if (post.kind !== "announcement" || post.authorId === user.id || user.role === "ADMIN") return true;
  if (!post.courseId) return false;
  return (await db.enrollment.count({ where: { courseId: post.courseId, learnerId: user.id } })) > 0;
}

/** Start of the current calendar month in West Africa Time (UTC+1). */
export function monthStartWAT(now = new Date()) {
  const wat = new Date(now.getTime() + 3600_000);
  return new Date(Date.UTC(wat.getUTCFullYear(), wat.getUTCMonth(), 1) - 3600_000);
}

export async function announcementsThisMonth(courseId: string) {
  return db.post.count({ where: { kind: "announcement", courseId, deletedAt: null, createdAt: { gte: monthStartWAT() } } });
}

export const ANNOUNCEMENT_LIMIT = BUSINESS.announcementsPerMonth;

const POST_MIME = ["image/jpeg", "image/png", "application/pdf"];

/** Post attachments: JPEG/PNG/PDF up to 5 MB (PRD 7.1, INS-COM-02). Returns null (none), the id, or undefined (invalid). */
export async function checkPostAttachment(id: string | null | undefined, userId: string) {
  if (!id) return null;
  const a = await db.mediaAsset.findFirst({ where: { id, ownerId: userId, status: "READY" } });
  if (!a || !POST_MIME.includes(a.mime) || a.sizeBytes > 5 * 1024 * 1024) return undefined;
  return a.id;
}
