import "server-only";
import { db } from "@/lib/db";
import { relTime } from "@/lib/discussions";
import { formatNaira } from "@/lib/format";
import { balances } from "@/lib/wallet";

// Instructor dashboard data (INS-DASH-01/02).

/** Questions on the instructor's courses that the instructor hasn't replied to yet. */
export async function openQuestionsWhere(instructorId: string) {
  return {
    deletedAt: null,
    lesson: { module: { course: { instructorId } } },
    replies: { none: { authorId: instructorId, deletedAt: null } },
  };
}

export async function instructorStats(instructorId: string) {
  const [courses, learners, ratings, open, money] = await Promise.all([
    db.course.count({ where: { instructorId, deletedAt: null } }),
    db.enrollment.count({ where: { course: { instructorId } } }),
    db.courseRating.aggregate({ where: { course: { instructorId } }, _avg: { stars: true }, _count: true }),
    db.question.count({ where: await openQuestionsWhere(instructorId) }),
    balances(instructorId),
  ]);
  return {
    courses,
    learners,
    earningsKobo: money.totalKobo,
    rating: ratings._count ? (ratings._avg.stars ?? 0).toFixed(1) : null,
    openQuestions: open,
  };
}

export type CourseRow = { id: string; title: string; status: string; learners: number; rating: string | null; earnings: string | null; updatedAt: string; updatedLabel: string; category: string | null; level: string | null; thumbnailUrl: string | null; priceLabel: string };

export async function courseRows(instructorId: string): Promise<CourseRow[]> {
  const courses = await db.course.findMany({
    where: { instructorId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, status: true, updatedAt: true, category: true, level: true, thumbnailAssetId: true, access: true, priceKobo: true, _count: { select: { enrollments: true } } },
  });
  const ids = courses.map((c) => c.id);
  const [earnings, ratings] = await Promise.all([
    db.walletTransaction.findMany({ where: { instructorId, type: "ENROLLMENT", status: { not: "FAILED" }, orderItem: { courseId: { in: ids } } }, select: { amountKobo: true, orderItem: { select: { courseId: true } } } }),
    db.courseRating.groupBy({ by: ["courseId"], where: { courseId: { in: ids } }, _avg: { stars: true } }),
  ]);
  const earned = new Map<string, number>();
  for (const e of earnings) if (e.orderItem) earned.set(e.orderItem.courseId, (earned.get(e.orderItem.courseId) ?? 0) + e.amountKobo);
  const rated = new Map(ratings.map((r) => [r.courseId, (r._avg.stars ?? 0).toFixed(1)]));
  return courses.map((c) => ({
    id: c.id,
    title: c.title || "(Untitled course)",
    status: c.status,
    learners: c._count.enrollments,
    rating: rated.get(c.id) ?? null,
    earnings: c.status === "DRAFT" || c.status === "UNDER_REVIEW" ? null : formatNaira(earned.get(c.id) ?? 0),
    updatedAt: c.updatedAt.toISOString(),
    updatedLabel: c.updatedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Africa/Lagos" }),
    category: c.category,
    level: c.level,
    thumbnailUrl: c.thumbnailAssetId ? `/api/media/${c.thumbnailAssetId}` : null,
    priceLabel: c.access === "FREE" || !c.priceKobo ? "Free" : formatNaira(c.priceKobo).replace(/\.00$/, ""),
  }));
}

export async function recentQuestions(instructorId: string, take = 5) {
  const rows = await db.question.findMany({
    where: { deletedAt: null, lesson: { module: { course: { instructorId } } } },
    orderBy: { createdAt: "desc" },
    take,
    include: { author: { select: { firstName: true, lastName: true } }, lesson: { select: { module: { select: { course: { select: { title: true } } } } } } },
  });
  return rows.map((q) => ({
    id: q.id,
    name: `${q.author.firstName} ${q.author.lastName}`,
    initials: `${q.author.firstName[0] ?? ""}${q.author.lastName[0] ?? ""}`.toUpperCase(),
    text: q.title,
    course: q.lesson.module.course.title,
    when: relTime(q.createdAt),
  }));
}
