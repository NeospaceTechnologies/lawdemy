import "server-only";
import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { BUSINESS } from "@/lib/config";
import { formatNaira } from "@/lib/format";

// Course discovery (PRD 4.4 LRN-DISC). Only Live courses are visible to learners (PRD 7.2).

export const LIVE: Prisma.CourseWhereInput = { status: "LIVE", deletedAt: null };

const cardSelect = {
  id: true,
  title: true,
  subtitle: true,
  category: true,
  level: true,
  access: true,
  priceKobo: true,
  discountPct: true,
  discountEndsAt: true,
  hasCertificate: true,
  durationSeconds: true,
  publishedAt: true,
  thumbnailAssetId: true,
  instructor: { select: { firstName: true, lastName: true } },
  ratings: { select: { stars: true } },
} satisfies Prisma.CourseSelect;

type CardRow = Prisma.CourseGetPayload<{ select: typeof cardSelect }>;

export type CourseCardData = {
  id: string;
  title: string;
  category: string | null;
  instructor: string;
  initials: string;
  priceLabel: string;
  oldLabel: string | null;
  offLabel: string | null;
  isFree: boolean;
  badge: "Trending" | "New" | null;
  level: string;
  thumbnailUrl: string | null;
  rating: { avg: number; count: number } | null;
};

/** What a learner pays right now, honouring an active discount. */
export function effectivePrice(c: Pick<CardRow, "access" | "priceKobo" | "discountPct" | "discountEndsAt">, now = new Date()) {
  if (c.access === "FREE" || !c.priceKobo) return { kobo: 0, fullKobo: 0, pct: null as number | null, endsAt: null as Date | null };
  const active = !!c.discountPct && !!c.discountEndsAt && c.discountEndsAt > now;
  const kobo = active ? Math.round((c.priceKobo * (100 - c.discountPct!)) / 100) : c.priceKobo;
  return { kobo, fullKobo: c.priceKobo, pct: active ? c.discountPct : null, endsAt: active ? c.discountEndsAt : null };
}

/** Course ids with the most enrolments in the last 14 days (Trending badge and sort). Shared within one render. */
export const trendingIds = cache(async (limit: number = 10) => {
  const rows = await db.enrollment.groupBy({
    by: ["courseId"],
    where: { createdAt: { gte: new Date(Date.now() - 14 * 86400_000) } },
    _count: { courseId: true },
    orderBy: { _count: { courseId: "desc" } },
    take: limit,
  });
  return rows.map((r) => r.courseId);
});

export function toCard(c: CardRow, trending: Set<string>): CourseCardData {
  const p = effectivePrice(c);
  const isNew = !!c.publishedAt && Date.now() - c.publishedAt.getTime() < BUSINESS.newCourseDays * 86400_000;
  const name = `${c.instructor.firstName} ${c.instructor.lastName}`;
  return {
    id: c.id,
    title: c.title,
    category: c.category,
    instructor: name,
    initials: `${c.instructor.firstName[0] ?? ""}${c.instructor.lastName[0] ?? ""}`.toUpperCase(),
    priceLabel: p.kobo === 0 ? "FREE COURSE" : formatNaira(p.kobo),
    oldLabel: p.pct ? formatNaira(p.fullKobo) : null,
    offLabel: p.pct ? `${p.pct}% off` : null,
    isFree: p.kobo === 0,
    badge: trending.has(c.id) ? "Trending" : isNew ? "New" : null,
    level: c.level ?? "Beginner",
    thumbnailUrl: c.thumbnailAssetId ? `/api/media/${c.thumbnailAssetId}` : null,
    rating: c.ratings.length ? { avg: c.ratings.reduce((a, r) => a + r.stars, 0) / c.ratings.length, count: c.ratings.length } : null,
  };
}

export const SORTS = {
  newest: "Newest",
  trending: "Trending",
  popular: "Most Popular",
  az: "A–Z",
  za: "Z–A",
  shortest: "Shortest Duration",
  longest: "Longest Duration",
} as const;
export type SortKey = keyof typeof SORTS;

export type CatalogFilters = {
  q?: string;
  categories?: string[];
  level?: string;
  price?: "discount" | "free" | "paid";
  minKobo?: number;
  maxKobo?: number;
  certificate?: boolean;
  newArrivals?: boolean;
};

export function filterWhere(f: CatalogFilters): Prisma.CourseWhereInput {
  const and: Prisma.CourseWhereInput[] = [LIVE];
  const q = f.q?.trim();
  if (q) {
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { subtitle: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
        { instructor: { OR: [{ firstName: { contains: q, mode: "insensitive" } }, { lastName: { contains: q, mode: "insensitive" } }] } },
      ],
    });
  }
  if (f.categories?.length) and.push({ category: { in: f.categories } });
  if (f.level) and.push({ level: f.level });
  const now = new Date();
  if (f.price === "free") and.push({ access: "FREE" });
  if (f.price === "paid") and.push({ access: "PAID" });
  if (f.price === "discount") and.push({ access: "PAID", discountPct: { not: null }, discountEndsAt: { gt: now } });
  if (f.price !== "free" && (f.minKobo || f.maxKobo)) {
    and.push({ priceKobo: { ...(f.minKobo ? { gte: f.minKobo } : {}), ...(f.maxKobo ? { lte: f.maxKobo } : {}) } });
  }
  if (f.certificate) and.push({ hasCertificate: true });
  if (f.newArrivals) and.push({ publishedAt: { gte: new Date(Date.now() - BUSINESS.newCourseDays * 86400_000) } });
  return { AND: and };
}

export async function listCourses(f: CatalogFilters, sort: SortKey = "newest", take = 60) {
  const trending = await trendingIds(sort === "trending" ? 100 : 10);
  const trendSet = new Set(trending);
  const orderBy: Prisma.CourseOrderByWithRelationInput[] =
    sort === "az" ? [{ title: "asc" }]
    : sort === "za" ? [{ title: "desc" }]
    : sort === "shortest" ? [{ durationSeconds: { sort: "asc", nulls: "last" } }]
    : sort === "longest" ? [{ durationSeconds: { sort: "desc", nulls: "last" } }]
    : sort === "popular" ? [{ enrollments: { _count: "desc" } }]
    : [{ publishedAt: { sort: "desc", nulls: "last" } }];
  const rows = await db.course.findMany({ where: filterWhere(f), select: cardSelect, orderBy, take: sort === "trending" ? 500 : take });
  let ordered = rows;
  if (sort === "trending") {
    const rank = new Map(trending.map((id, i) => [id, i]));
    ordered = [...rows].sort((a, b) => (rank.get(a.id) ?? 1e9) - (rank.get(b.id) ?? 1e9)).slice(0, take);
  }
  const total = await db.course.count({ where: filterWhere(f) });
  return { total, cards: ordered.map((c) => toCard(c, trendSet)) };
}

/** Recommendations from areas of interest and practice areas (LRN-DASH-01), topped up with popular courses. */
export async function recommendedFor(userId: string, take = 8) {
  const profile = await db.learnerProfile.findUnique({ where: { userId } });
  const owned = await db.enrollment.findMany({ where: { learnerId: userId }, select: { courseId: true } });
  const exclude = owned.map((o) => o.courseId);
  const terms = [...(profile?.interests ?? []), ...(profile?.practiceAreas ?? [])].flatMap((t) => t.split(/[,&]/)).map((t) => t.trim()).filter((t) => t.length > 2);
  const trendSet = new Set(await trendingIds());
  const matched = terms.length
    ? await db.course.findMany({
        where: {
          AND: [
            LIVE,
            { id: { notIn: exclude } },
            { OR: terms.flatMap((t) => [{ title: { contains: t, mode: "insensitive" as const } }, { description: { contains: t, mode: "insensitive" as const } }, { category: { contains: t, mode: "insensitive" as const } }]) },
          ],
        },
        select: cardSelect,
        take,
      })
    : [];
  let rows = matched;
  if (rows.length < take) {
    const more = await db.course.findMany({
      where: { AND: [LIVE, { id: { notIn: [...exclude, ...rows.map((r) => r.id)] } }] },
      select: cardSelect,
      orderBy: { enrollments: { _count: "desc" } },
      take: take - rows.length,
    });
    rows = [...rows, ...more];
  }
  return rows.map((c) => toCard(c, trendSet));
}

export async function byCategory(category: string, take = 6) {
  const trendSet = new Set(await trendingIds());
  const rows = await db.course.findMany({ where: { AND: [LIVE, { category }] }, select: cardSelect, orderBy: { publishedAt: "desc" }, take });
  return rows.map((c) => toCard(c, trendSet));
}

export async function cardsByIds(ids: string[]) {
  if (!ids.length) return [];
  const trendSet = new Set(await trendingIds());
  const rows = await db.course.findMany({ where: { id: { in: ids } }, select: cardSelect });
  const map = new Map(rows.map((r) => [r.id, r]));
  return ids.flatMap((id) => (map.has(id) ? [toCard(map.get(id)!, trendSet)] : []));
}

export function parseFilters(sp: Record<string, string | string[] | undefined>): { filters: CatalogFilters; sort: SortKey } {
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined));
  const cats = (one("category") ?? "").split("|").filter((c) => c.length > 0 && c.length <= 80);
  const price = one("price");
  const naira = (k: string) => (one(k) ? Math.round(Number(one(k)) * 100) || undefined : undefined);
  const sort = one("sort") as SortKey | undefined;
  return {
    filters: {
      q: one("q"),
      categories: cats,
      level: ["Beginner", "Intermediate", "Advanced"].includes(one("level") ?? "") ? one("level") : undefined,
      price: price === "discount" || price === "free" || price === "paid" ? price : undefined,
      minKobo: naira("min"),
      maxKobo: naira("max"),
      certificate: one("cert") === "1",
      newArrivals: one("new") === "1",
    },
    sort: sort && sort in SORTS ? sort : "newest",
  };
}
