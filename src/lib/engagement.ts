import "server-only";
import { db } from "@/lib/db";

// Learner engagement for one course (INS-ENG-01..03). Only name, role,
// jurisdiction and course activity are exposed; never email or phone (INS-ENG-05).

export type LearnerRow = {
  id: string;
  name: string;
  initials: string;
  role: "Lawyer" | "Non-Lawyer";
  jurisdiction: string;
  lastActiveDays: number;
  quiz: "Done" | "Not Started";
  qa: number;
  completion: "Completed" | "In Progress" | "Not Started";
  progressPct: number;
  modulesDone: number;
  modulesTotal: number;
  currentModule: string;
  attempt: { scorePct: number; passed: boolean; at: string } | null;
  firstQuestionId: string | null;
};

export async function courseEngagement(courseId: string) {
  const [course, enrollments] = await Promise.all([
    db.course.findUnique({
      where: { id: courseId },
      select: { quiz: { select: { id: true, title: true } }, modules: { orderBy: { position: "asc" }, select: { id: true, title: true, position: true, lessons: { select: { id: true } } } } },
    }),
    db.enrollment.findMany({
      where: { courseId },
      include: { learner: { select: { id: true, firstName: true, lastName: true, learnerProfile: { select: { isLawyer: true, jurisdictions: true } } } }, progress: { where: { completedAt: { not: null } }, select: { lessonId: true } } },
    }),
  ]);
  if (!course) return null;
  const learnerIds = enrollments.map((e) => e.learnerId);
  const [questions, attempts] = await Promise.all([
    db.question.findMany({ where: { deletedAt: null, authorId: { in: learnerIds }, lesson: { module: { courseId } } }, select: { id: true, authorId: true }, orderBy: { createdAt: "desc" } }),
    course.quiz ? db.quizAttempt.findMany({ where: { quizId: course.quiz.id, learnerId: { in: learnerIds } }, orderBy: { scorePct: "desc" } }) : Promise.resolve([]),
  ]);
  const lessonModule = new Map(course.modules.flatMap((m) => m.lessons.map((l) => [l.id, m] as const)));
  const now = Date.now();
  const rows: LearnerRow[] = enrollments.map((e) => {
    const done = new Set(e.progress.map((p) => p.lessonId));
    const modulesDone = course.modules.filter((m) => m.lessons.length > 0 && m.lessons.every((l) => done.has(l.id))).length;
    const current = e.currentLessonId ? lessonModule.get(e.currentLessonId) : undefined;
    const best = attempts.find((a) => a.learnerId === e.learnerId);
    const mine = questions.filter((q) => q.authorId === e.learnerId);
    const completion = e.completedAt ? "Completed" : e.progressPct > 0 ? "In Progress" : "Not Started";
    return {
      id: e.learnerId,
      name: `${e.learner.firstName} ${e.learner.lastName}`,
      initials: `${e.learner.firstName[0] ?? ""}${e.learner.lastName[0] ?? ""}`.toUpperCase(),
      role: e.learner.learnerProfile?.isLawyer ? "Lawyer" : "Non-Lawyer",
      jurisdiction: e.learner.learnerProfile?.jurisdictions[0] ?? "—",
      lastActiveDays: Math.max(0, Math.floor((now - e.lastActiveAt.getTime()) / 86400_000)),
      quiz: best ? "Done" : "Not Started",
      qa: mine.length,
      completion,
      progressPct: e.progressPct,
      modulesDone,
      modulesTotal: course.modules.length,
      currentModule: completion === "Completed" ? "All modules completed" : current ? `Module ${current.position + 1}: ${current.title}` : course.modules[0] ? `Module 1: ${course.modules[0].title}` : "—",
      attempt: best ? { scorePct: best.scorePct, passed: best.passed, at: best.submittedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Africa/Lagos" }) } : null,
      firstQuestionId: mine[0]?.id ?? null,
    };
  });
  const scored = rows.filter((r) => r.attempt);
  return {
    quizTitle: course.quiz?.title ?? null,
    total: rows.length,
    attempted: scored.length,
    avgScore: scored.length ? Math.round(scored.reduce((a, r) => a + (r.attempt?.scorePct ?? 0), 0) / scored.length) : null,
    rows,
  };
}
