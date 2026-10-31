import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { issueIfEligible } from "@/lib/certificates";
import { recomputeProgress } from "@/lib/learning";
import { notify } from "@/lib/notify";
import { gradeQuiz, needsManualMarking, type Answer, type Marks } from "@/lib/quiz";

// Instructor marking of short-answer and upload questions (PRD 5.3 quiz types; INS-ENG).

export async function attemptForInstructor(attemptId: string, instructorId: string) {
  return db.quizAttempt.findFirst({
    where: { id: attemptId, quiz: { course: { instructorId } } },
    include: {
      learner: { select: { id: true, firstName: true, lastName: true } },
      quiz: { include: { questions: { orderBy: { position: "asc" } }, course: { select: { id: true, title: true } } } },
    },
  });
}

export async function gradingQueue(instructorId: string) {
  return db.quizAttempt.findMany({
    where: { status: "awaiting_review", quiz: { course: { instructorId } } },
    orderBy: { submittedAt: "asc" },
    include: { learner: { select: { firstName: true, lastName: true } }, quiz: { select: { course: { select: { id: true, title: true } } } } },
  });
}

export async function markAttempt(attemptId: string, instructorId: string, marks: Marks) {
  const a = await attemptForInstructor(attemptId, instructorId);
  if (!a) return { error: "Attempt not found." } as const;
  if (a.status !== "awaiting_review") return { error: "This attempt has already been marked." } as const;
  const answers = a.answers as Record<string, Answer>;
  const questions = a.quiz.questions.map((q) => ({ id: q.id, type: q.type, options: q.options as { text: string; correct: boolean }[] }));
  const toMark = a.quiz.questions.filter((q) => needsManualMarking(q.type) && typeof answers[q.id] === "string" && String(answers[q.id]).trim());
  const missing = toMark.filter((q) => !marks[q.id]);
  if (missing.length) return { error: "Mark every written answer before saving." } as const;
  const clean: Marks = Object.fromEntries(toMark.map((q) => [q.id, { correct: !!marks[q.id].correct, comment: marks[q.id].comment?.trim() || null }]));
  const graded = gradeQuiz(questions, answers, clean);

  const done = await db.quizAttempt.updateMany({
    where: { id: a.id, status: "awaiting_review" },
    data: { status: "graded", scorePct: graded.scorePct, passed: graded.passed, marks: clean as Prisma.InputJsonValue, reviewedAt: new Date(), reviewedById: instructorId },
  });
  if (!done.count) return { error: "This attempt has already been marked." } as const;
  await audit({ actorId: instructorId, action: "quiz_marked", targetType: "quiz_attempt", targetId: a.id, after: { scorePct: graded.scorePct, passed: graded.passed } });

  const enrollment = await db.enrollment.findUnique({ where: { courseId_learnerId: { courseId: a.quiz.course.id, learnerId: a.learner.id } }, select: { id: true } });
  let certificateId: string | null = null;
  if (enrollment) {
    await recomputeProgress(enrollment.id);
    if (graded.passed) certificateId = (await issueIfEligible(enrollment.id))?.id ?? null;
  }
  await notify(a.learner.id, {
    type: "quiz_pending",
    title: graded.passed ? "You passed the final quiz" : "Your quiz has been marked",
    body: `“${a.quiz.course.title}”: you scored ${graded.scorePct}%.${graded.passed ? (certificateId ? " Your certificate is ready." : "") : " Review the feedback and try again."}`,
    link: `/learn/${a.quiz.course.id}/quiz`,
  });
  return { scorePct: graded.scorePct, passed: graded.passed } as const;
}
