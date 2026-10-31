import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseDetailsView } from "@/features/instructor/CourseDetailsView";
import { db } from "@/lib/db";
import { requireInstructorPage } from "@/lib/auth/pages";
import { allowedActions } from "@/lib/course/status-rules";
import { findOwnedCourse, toDraft } from "@/lib/course/repository";
import { durationLabel, formatNaira } from "@/lib/format";

export const metadata: Metadata = { title: "Course details" };

export default async function InstructorCourseDetailsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { user } = await requireInstructorPage();
  const course = await findOwnedCourse((await params).id, user.id);
  if (!course) notFound();
  const [enrolled, decision] = await Promise.all([
    db.enrollment.count({ where: { courseId: course.id } }),
    db.reviewDecision.findFirst({ where: { courseId: course.id, decision: "rejected" }, orderBy: { decidedAt: "desc" } }),
  ]);
  const draft = toDraft(course);
  const lessons = draft.modules.flatMap((m) => m.lessons);
  const total = lessons.reduce((a, l) => a + l.durationSeconds, 0);
  return (
    <CourseDetailsView
      id={course.id}
      initialTab={(await searchParams).tab === "content" ? "content" : "overview"}
      status={course.status}
      enrolled={enrolled}
      actions={allowedActions(course.status, enrolled)}
      rejection={decision?.reason ?? null}
      draft={draft}
      thumbnailUrl={course.thumbnailAssetId ? `/api/media/${course.thumbnailAssetId}` : null}
      summary={[
        { k: "Modules", v: `${draft.modules.length} Modules (${durationLabel(total, "HOURS_MINUTES")})` },
        { k: "Quizzes", v: draft.quiz ? `${draft.quiz.questions.length} Questions` : "No final quiz" },
        { k: "Students", v: enrolled.toLocaleString("en-NG") },
        { k: "Category", v: draft.info.category || "—" },
        { k: "Level", v: draft.info.level },
      ]}
      price={[
        { k: "Access Type", v: draft.price.access === "FREE" ? "Free" : "Paid" },
        { k: "Price", v: draft.price.access === "FREE" || !draft.price.priceKobo ? "Free" : formatNaira(draft.price.priceKobo).replace(/\.00$/, "") },
        ...(draft.price.discountPct ? [{ k: "Discount", v: `${draft.price.discountPct}% until ${draft.price.discountEndsAt}` }] : []),
        { k: "Access", v: "Lifetime" },
        { k: "Certificate", v: draft.price.hasCertificate ? "Yes" : "No" },
      ]}
    />
  );
}
