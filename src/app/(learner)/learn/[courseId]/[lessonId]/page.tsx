import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { LessonPlayer, type PlayerData } from "@/features/learn/LessonPlayer";
import { LessonQA } from "@/features/qa/LessonQA";
import { db } from "@/lib/db";
import { requireLearnerPage } from "@/lib/auth/pages";
import { courseOutline, flatLessons, activeEnrollment } from "@/lib/learning";
import { loadCourseQuestions } from "@/lib/discussions";

type P = { params: Promise<{ courseId: string; lessonId: string }>; searchParams: Promise<{ tab?: string; view?: string; q?: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const l = await db.lesson.findUnique({ where: { id: (await params).lessonId }, select: { title: true } });
  return { title: l?.title ?? "Lesson" };
}

function mins(s: number) {
  const m = Math.max(1, Math.round(s / 60));
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}min`;
}

export default async function LessonPage({ params, searchParams }: P) {
  const { user } = await requireLearnerPage();
  const { courseId, lessonId } = await params;
  const sp = await searchParams;
  const course = await db.course.findFirst({
    where: { id: courseId, deletedAt: null },
    include: { instructor: { select: { firstName: true, lastName: true } }, quiz: { select: { id: true } } },
  });
  if (!course) notFound();
  const enrollment = await activeEnrollment(courseId, user.id);
  const outline = await courseOutline(courseId);
  const lessons = flatLessons(outline);
  const lesson = lessons.find((l) => l.id === lessonId);
  if (!lesson) notFound();
  // Enrolled learners keep access whatever the status; others can only open preview lessons of Live courses (PRD 7.2).
  if (!enrollment && !(lesson.isPreview && course.status === "LIVE")) redirect(`/courses/${courseId}`);

  const progress = enrollment ? await db.lessonProgress.findMany({ where: { enrollmentId: enrollment.id } }) : [];
  const done = new Set(progress.filter((p) => p.completedAt).map((p) => p.lessonId));
  const idx = lessons.indexOf(lesson);
  const passed = enrollment && course.quiz ? (await db.quizAttempt.count({ where: { quizId: course.quiz.id, learnerId: user.id, passed: true } })) > 0 : false;
  const total = lessons.reduce((a, l) => a + l.durationSeconds, 0);

  const data: PlayerData = {
    courseId,
    courseTitle: course.title,
    instructor: `${course.instructor.firstName} ${course.instructor.lastName}`,
    enrolled: !!enrollment,
    progressPct: enrollment?.progressPct ?? 0,
    lesson: {
      id: lesson.id,
      title: lesson.title,
      number: idx + 1,
      videoUrl: lesson.videoAssetId ? `/api/media/${lesson.videoAssetId}` : null,
      captionsUrl: lesson.videoAssetId && lesson.captionsAssetId ? `/api/media/${lesson.captionsAssetId}` : null,
      writeUp: lesson.writeUp,
      positionSeconds: progress.find((p) => p.lessonId === lesson.id)?.positionSeconds ?? 0,
      completed: done.has(lesson.id),
    },
    prevHref: idx > 0 && (enrollment || lessons[idx - 1].isPreview) ? `/learn/${courseId}/${lessons[idx - 1].id}` : null,
    nextHref: lessons[idx + 1] && (enrollment || lessons[idx + 1].isPreview) ? `/learn/${courseId}/${lessons[idx + 1].id}` : enrollment && course.quiz ? `/learn/${courseId}/quiz` : null,
    summary: `${outline.length} Modules • ${lessons.length} Lectures • ${mins(total)} total length`,
    modules: outline.map((m, mi) => ({
      id: m.id,
      title: `Module ${mi + 1}: ${m.title || "Untitled module"}`,
      meta: `${m.lessons.filter((l) => done.has(l.id)).length}/${m.lessons.length} · ${mins(m.lessons.reduce((a, l) => a + l.durationSeconds, 0))}`,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        name: `${lessons.findIndex((x) => x.id === l.id) + 1}. ${l.title}`,
        len: mins(l.durationSeconds),
        done: done.has(l.id),
        locked: !enrollment && !l.isPreview,
      })),
    })),
    quiz: course.quiz && enrollment ? { href: `/learn/${courseId}/quiz`, passed } : null,
    myRating: enrollment ? (await db.courseRating.findUnique({ where: { courseId_learnerId: { courseId, learnerId: user.id } }, select: { stars: true } }))?.stars ?? 0 : 0,
    certificateId: enrollment ? (await db.certificate.findUnique({ where: { enrollmentId: enrollment.id }, select: { id: true } }))?.id ?? null : null,
  };

  const tab = sp.tab === "qa" && enrollment ? "qa" : "content";
  const qa = tab === "qa" ? await loadCourseQuestions(courseId, user.id, sp.q) : null;
  return (
    <LessonPlayer d={data} tab={tab} view={sp.view === "expanded" ? "expanded" : "normal"}>
      {qa && <LessonQA data={qa} courseId={courseId} lessonId={lesson.id} viewer={{ id: user.id, firstName: user.firstName, lastName: user.lastName }} />}
    </LessonPlayer>
  );
}
