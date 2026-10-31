import "server-only";
import { db } from "@/lib/db";

// Shared helpers for lesson Q&A (LRN-QA, INS-ENG) and community posts.

export type Attachment = { id: string; url: string; name: string; isImage: boolean } | null;
export type Author = { id: string; name: string; initials: string; role: "LEARNER" | "INSTRUCTOR" | "ADMIN"; mine: boolean };

export function relTime(d: Date) {
  const s = Math.max(1, Math.round((Date.now() - d.getTime()) / 1000));
  if (s < 60) return "Just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.round(days / 30);
  return months < 12 ? `${months} month${months === 1 ? "" : "s"} ago` : `${Math.round(months / 12)}y ago`;
}

export function author(u: { id: string; firstName: string; lastName: string; role: Author["role"] }, viewerId: string): Author {
  return { id: u.id, name: `${u.firstName} ${u.lastName}`, initials: `${u.firstName[0] ?? ""}${u.lastName[0] ?? ""}`.toUpperCase(), role: u.role, mine: u.id === viewerId };
}

export async function attachments(ids: (string | null)[]) {
  const list = ids.filter((x): x is string => !!x);
  if (!list.length) return new Map<string, Attachment>();
  const rows = await db.mediaAsset.findMany({ where: { id: { in: list }, status: "READY" } });
  return new Map<string, Attachment>(rows.map((r) => [r.id, { id: r.id, url: `/api/media/${r.id}`, name: r.fileName, isImage: r.mime.startsWith("image/") }]));
}

export async function voteInfo(targetType: string, ids: string[], viewerId: string) {
  if (!ids.length) return { counts: new Map<string, number>(), mine: new Set<string>() };
  const [counts, mine] = await Promise.all([
    db.upvote.groupBy({ by: ["targetId"], where: { targetType, targetId: { in: ids } }, _count: { targetId: true } }),
    db.upvote.findMany({ where: { targetType, targetId: { in: ids }, userId: viewerId }, select: { targetId: true } }),
  ]);
  return { counts: new Map(counts.map((c) => [c.targetId, c._count.targetId])), mine: new Set(mine.map((m) => m.targetId)) };
}

/** Who may take part in a course's Q&A: enrolled learners and the course instructor. */
export async function canDiscuss(courseId: string, user: { id: string; role: string }) {
  if (user.role === "ADMIN") return true;
  const course = await db.course.findUnique({ where: { id: courseId }, select: { instructorId: true } });
  if (!course) return false;
  if (course.instructorId === user.id) return true;
  return (await db.enrollment.count({ where: { courseId, learnerId: user.id } })) > 0;
}

const userSel = { select: { id: true, firstName: true, lastName: true, role: true } } as const;

export type QuestionView = {
  id: string;
  title: string;
  body: string;
  author: Author;
  when: string;
  edited: boolean;
  upvotes: number;
  voted: boolean;
  replyCount: number;
  lessonTitle: string;
  attachment: Attachment;
};
export type ReplyView = { id: string; body: string; author: Author; when: string; edited: boolean; upvotes: number; voted: boolean; attachment: Attachment };

export async function loadCourseQuestions(courseId: string, viewerId: string, focusId?: string) {
  const rows = await db.question.findMany({
    where: { deletedAt: null, lesson: { module: { courseId } } },
    orderBy: { createdAt: "desc" },
    include: { author: userSel, lesson: { select: { title: true } }, _count: { select: { replies: { where: { deletedAt: null } } } } },
  });
  const [att, votes] = await Promise.all([attachments(rows.map((r) => r.attachmentId)), voteInfo("question", rows.map((r) => r.id), viewerId)]);
  const questions: QuestionView[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    author: author(r.author, viewerId),
    when: relTime(r.createdAt),
    edited: !!r.editedAt,
    upvotes: votes.counts.get(r.id) ?? 0,
    voted: votes.mine.has(r.id),
    replyCount: r._count.replies,
    lessonTitle: r.lesson.title,
    attachment: r.attachmentId ? (att.get(r.attachmentId) ?? null) : null,
  }));
  let thread: { question: QuestionView; replies: ReplyView[] } | null = null;
  const focus = focusId ? questions.find((q) => q.id === focusId) : undefined;
  if (focus) thread = { question: focus, replies: await loadReplies(focus.id, viewerId) };
  return { questions, thread };
}

export async function loadReplies(questionId: string, viewerId: string): Promise<ReplyView[]> {
  const rows = await db.questionReply.findMany({ where: { questionId, deletedAt: null }, orderBy: { createdAt: "asc" }, include: { author: userSel } });
  const [att, votes] = await Promise.all([attachments(rows.map((r) => r.attachmentId)), voteInfo("question_reply", rows.map((r) => r.id), viewerId)]);
  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    author: author(r.author, viewerId),
    when: relTime(r.createdAt),
    edited: !!r.editedAt,
    upvotes: votes.counts.get(r.id) ?? 0,
    voted: votes.mine.has(r.id),
    attachment: r.attachmentId ? (att.get(r.attachmentId) ?? null) : null,
  }));
}

/** Verifies an attachment id belongs to the user and is ready. */
export async function ownAttachment(assetId: string | null | undefined, userId: string) {
  if (!assetId) return null;
  const a = await db.mediaAsset.findFirst({ where: { id: assetId, ownerId: userId, status: "READY" }, select: { id: true } });
  return a?.id ?? undefined;
}
