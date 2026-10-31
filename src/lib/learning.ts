import "server-only";
import { db } from "@/lib/db";

// Enrolled learning (PRD 4.6 LRN-LEARN): outline, progress and resume position.

/**
 * The learner's enrolment, or null when they have none or staff took the course down
 * for a legal or safety reason (ADM-03), which ends access for everyone.
 */
export async function activeEnrollment(courseId: string, learnerId: string) {
  const e = await db.enrollment.findUnique({ where: { courseId_learnerId: { courseId, learnerId } }, include: { course: { select: { takedownRevokes: true } } } });
  if (!e || e.course.takedownRevokes) return null;
  const { course: _c, ...enrollment } = e;
  return enrollment;
}

export async function courseOutline(courseId: string) {
  return db.module.findMany({
    where: { courseId },
    orderBy: { position: "asc" },
    include: { lessons: { orderBy: { position: "asc" }, select: { id: true, title: true, durationSeconds: true, isPreview: true, videoAssetId: true, captionsAssetId: true, writeUp: true } } },
  });
}

export function flatLessons(outline: Awaited<ReturnType<typeof courseOutline>>) {
  return outline.flatMap((m, mi) => m.lessons.map((l, li) => ({ ...l, moduleId: m.id, moduleIndex: mi, moduleTitle: m.title, number: li + 1 })));
}

function minutesLeft(seconds: number) {
  const m = Math.max(1, Math.ceil(seconds / 60));
  return `${m} min${m === 1 ? "" : "s"} left`;
}

export async function learnerStats(userId: string) {
  const enrollments = await db.enrollment.findMany({ where: { learnerId: userId }, select: { id: true, completedAt: true, progressPct: true } });
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const done = await db.lessonProgress.findMany({
    where: { enrollment: { learnerId: userId }, completedAt: { gte: monthStart } },
    select: { lessonId: true },
  });
  const lessons = done.length ? await db.lesson.findMany({ where: { id: { in: done.map((d) => d.lessonId) } }, select: { durationSeconds: true } }) : [];
  const seconds = lessons.reduce((a, l) => a + l.durationSeconds, 0);
  return {
    total: enrollments.length,
    completed: enrollments.filter((e) => e.completedAt).length,
    inProgress: enrollments.filter((e) => !e.completedAt && e.progressPct > 0).length,
    hoursThisMonth: Math.round((seconds / 3600) * 10) / 10,
  };
}

/** The lesson to resume: the saved current lesson, else the first incomplete one. */
export async function resumeLesson(enrollmentId: string, courseId: string) {
  const [enr, outline, progress] = await Promise.all([
    db.enrollment.findUnique({ where: { id: enrollmentId }, select: { currentLessonId: true } }),
    courseOutline(courseId),
    db.lessonProgress.findMany({ where: { enrollmentId } }),
  ]);
  const lessons = flatLessons(outline);
  const doneIds = new Set(progress.filter((p) => p.completedAt).map((p) => p.lessonId));
  const current = lessons.find((l) => l.id === enr?.currentLessonId) ?? lessons.find((l) => !doneIds.has(l.id)) ?? lessons[0];
  const pos = progress.find((p) => p.lessonId === current?.id)?.positionSeconds ?? 0;
  return { lesson: current, index: current ? lessons.indexOf(current) : -1, positionSeconds: pos, lessons, doneIds };
}

export async function continueLearning(userId: string, take = 3) {
  const enrollments = await db.enrollment.findMany({
    where: { learnerId: userId, completedAt: null },
    orderBy: { lastActiveAt: "desc" },
    take,
    include: { course: { select: { id: true, title: true, category: true, thumbnailAssetId: true } } },
  });
  return Promise.all(
    enrollments.map(async (e) => {
      const r = await resumeLesson(e.id, e.courseId);
      return {
        enrollmentId: e.id,
        courseTitle: e.course.title,
        category: e.course.category,
        lessonLabel: r.lesson ? `${r.index + 1}. ${r.lesson.title}` : "Course introduction",
        leftLabel: r.lesson ? minutesLeft(Math.max(0, r.lesson.durationSeconds - r.positionSeconds)) : "",
        pct: e.progressPct,
        href: r.lesson ? `/learn/${e.courseId}/${r.lesson.id}` : `/learn/${e.courseId}`,
        thumbnailUrl: e.course.thumbnailAssetId ? `/api/media/${e.course.thumbnailAssetId}` : null,
      };
    }),
  );
}

/** Recomputes progress after a lesson is completed. Course completion also needs a passed quiz when a certificate is offered. */
export async function recomputeProgress(enrollmentId: string) {
  const enr = await db.enrollment.findUnique({ where: { id: enrollmentId }, include: { course: { select: { id: true, hasCertificate: true, quiz: { select: { id: true } } } } } });
  if (!enr) return null;
  const total = await db.lesson.count({ where: { module: { courseId: enr.courseId } } });
  const done = await db.lessonProgress.count({ where: { enrollmentId, completedAt: { not: null } } });
  const pct = total ? Math.round((done / total) * 100) : 0;
  let completed = pct === 100;
  if (completed && enr.course.quiz) {
    completed = (await db.quizAttempt.count({ where: { quizId: enr.course.quiz.id, learnerId: enr.learnerId, passed: true } })) > 0;
  }
  return db.enrollment.update({
    where: { id: enrollmentId },
    data: { progressPct: pct, completedAt: completed ? (enr.completedAt ?? new Date()) : null, lastActiveAt: new Date() },
  });
}
