import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/learner/Topbar";
import { CourseDetails, type DetailsData } from "@/features/buy/CourseDetails";
import { db } from "@/lib/db";
import { effectivePrice, LIVE } from "@/lib/catalog";
import { formatNaira } from "@/lib/format";
import { requireLearnerPage } from "@/lib/auth/pages";
import { resumeLesson } from "@/lib/learning";

type Params = { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const c = await db.course.findFirst({ where: { AND: [LIVE, { id: (await params).id }] }, select: { title: true } });
  return { title: c?.title ?? "Course" };
}

function hm(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}min`;
}

export default async function CoursePage({ params, searchParams }: Params) {
  const { user } = await requireLearnerPage();
  const id = (await params).id;
  const course = await db.course.findFirst({
    where: { AND: [LIVE, { id }] },
    include: {
      instructor: { select: { firstName: true, lastName: true, instructorProfile: { select: { bio: true } } } },
      modules: { orderBy: { position: "asc" }, include: { lessons: { orderBy: { position: "asc" } } } },
      quiz: { select: { id: true } },
    },
  });
  if (!course) notFound();
  const [enrollment, inCart, inWishlist, rating] = await Promise.all([
    db.enrollment.findUnique({ where: { courseId_learnerId: { courseId: id, learnerId: user.id } } }),
    db.cartItem.count({ where: { learnerId: user.id, courseId: id } }),
    db.wishlistItem.count({ where: { learnerId: user.id, courseId: id } }),
    db.courseRating.aggregate({ where: { courseId: id }, _avg: { stars: true }, _count: true }),
  ]);
  const price = effectivePrice(course);
  const lessons = course.modules.flatMap((m) => m.lessons);
  const total = lessons.reduce((a, l) => a + l.durationSeconds, 0);
  const preview = lessons.find((l) => l.isPreview);
  let resumeHref: string | null = null;
  if (enrollment) {
    const r = await resumeLesson(enrollment.id, id);
    resumeHref = r.lesson ? `/learn/${id}/${r.lesson.id}` : `/learn/${id}`;
  }

  const data: DetailsData = {
    id,
    title: course.title,
    instructor: `${course.instructor.firstName} ${course.instructor.lastName}`,
    initials: `${course.instructor.firstName[0]}${course.instructor.lastName[0]}`.toUpperCase(),
    bio: course.instructor.instructorProfile?.bio ?? null,
    description: course.description ?? "",
    outcomes: (course.outcomes ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
    level: course.level ?? "Beginner",
    updatedAt: course.updatedAt.toLocaleDateString("en-GB", { timeZone: "Africa/Lagos" }),
    rating: rating._count ? { avg: rating._avg.stars ?? 0, count: rating._count } : null,
    hasCertificate: course.hasCertificate,
    isFree: price.kobo === 0,
    priceLabel: formatNaira(price.kobo).replace(/\.00$/, ""),
    oldLabel: price.pct ? formatNaira(price.fullKobo) : null,
    daysLeft: price.endsAt ? Math.max(1, Math.ceil((price.endsAt.getTime() - Date.now()) / 86400_000)) : null,
    lessonCount: lessons.length,
    quizCount: course.quiz ? 1 : 0,
    totalLabel: hm(total),
    trailer: preview ? { lessonId: preview.id, videoUrl: preview.videoAssetId ? `/api/media/${preview.videoAssetId}` : null } : null,
    modules: course.modules.map((m, mi) => ({
      id: m.id,
      title: `Module ${mi + 1}: ${m.title || "Untitled module"}`,
      meta: `0/${m.lessons.length}  ·  ${hm(m.lessons.reduce((a, l) => a + l.durationSeconds, 0))}`,
      lessons: m.lessons.map((l, li) => ({ id: l.id, name: `${li + 1}. ${l.title}`, len: hm(l.durationSeconds), preview: l.isPreview })),
    })),
    thumbnailUrl: course.thumbnailAssetId ? `/api/media/${course.thumbnailAssetId}` : null,
    state: { enrolled: !!enrollment, inCart: inCart > 0, inWishlist: inWishlist > 0, resumeHref },
  };
  return (
    <>
      <Topbar back="/courses" />
      <CourseDetails d={data} initialTab={(await searchParams).tab === "content" ? "content" : "overview"} />
    </>
  );
}
