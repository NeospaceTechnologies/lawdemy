import { db } from "@/lib/db";
import { ok } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";
import { cardsByIds, LIVE } from "@/lib/catalog";
import { POPULAR_SEARCHES } from "@/lib/taxonomy";

// Search dropdown data: recent searches, popular searches, top courses.
export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  const rows = await db.recentSearch.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 });
  const seen = new Set<string>();
  const recent = rows.filter((r) => !seen.has(r.query.toLowerCase()) && seen.add(r.query.toLowerCase())).slice(0, 6);
  const top = await db.course.findMany({ where: LIVE, orderBy: { enrollments: { _count: "desc" } }, take: 3, select: { id: true } });
  return ok({ recent: recent.map((r) => ({ id: r.id, query: r.query })), popular: POPULAR_SEARCHES, top: await cardsByIds(top.map((t) => t.id)) });
}

// Clear all.
export async function DELETE() {
  const { user, error } = await requireUser();
  if (error) return error;
  await db.recentSearch.deleteMany({ where: { userId: user.id } });
  return ok({ ok: true });
}
