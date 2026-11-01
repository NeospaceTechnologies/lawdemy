import "server-only";
import { db } from "@/lib/db";
import { LIVE, listCourses } from "@/lib/catalog";

/** Public numbers and featured courses for the marketing home page. Only Live courses count. */
export async function landingData() {
  const [{ cards }, courseCount, instructors, categories] = await Promise.all([
    listCourses({}, "popular", 6),
    db.course.count({ where: LIVE }),
    db.course.findMany({ where: LIVE, distinct: ["instructorId"], select: { instructorId: true } }),
    db.course.findMany({ where: { ...LIVE, category: { not: null } }, distinct: ["category"], select: { category: true }, orderBy: { category: "asc" } }),
  ]);
  return {
    featured: cards,
    courseCount,
    instructorCount: instructors.length,
    categories: categories.map((c) => c.category as string),
  };
}

export type LandingData = Awaited<ReturnType<typeof landingData>>;
