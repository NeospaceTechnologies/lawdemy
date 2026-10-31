import { z } from "zod";
import { db } from "@/lib/db";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";
import { issueIfEligible } from "@/lib/certificates";
import { recomputeProgress, activeEnrollment } from "@/lib/learning";
import { notify } from "@/lib/notify";
import { gradeQuiz } from "@/lib/quiz";

const schema = z.object({ answers: z.record(z.string(), z.union([z.number().int().min(0), z.string().max(5000), z.null()])) });

// Submit the final quiz; grading happens on the server (PRD 7.1 pass mark).
export async function POST(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const { user, error } = await requireUser("LEARNER");
  if (error) return error;
  const courseId = (await params).courseId;
  const enrollment = await activeEnrollment(courseId, user.id);
  if (!enrollment) return fail(403, "NOT_ENROLLED", "Enrol in this course to take the quiz.");
  const quiz = await db.quiz.findUnique({ where: { courseId }, include: { questions: { orderBy: { position: "asc" } }, course: { select: { title: true, instructorId: true } } } });
  if (!quiz) return fail(404, "NO_QUIZ", "This course has no final quiz.");
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);

  const questions = quiz.questions.map((q) => ({ id: q.id, type: q.type, options: q.options as { text: string; correct: boolean }[] }));
  const graded = gradeQuiz(questions, p.data.answers);
  const attempt = await db.quizAttempt.create({
    data: { quizId: quiz.id, learnerId: user.id, scorePct: graded.scorePct, passed: graded.passed, answers: p.data.answers, status: graded.awaitingReview ? "awaiting_review" : "graded" },
  });
  if (graded.awaitingReview) {
    await notify(quiz.course.instructorId, {
      type: "quiz_pending",
      title: "Quiz answers to mark",
      body: `${user.firstName} ${user.lastName} submitted written answers on “${quiz.course.title}”.`,
      link: `/instructor/grading/${attempt.id}`,
    });
  }
  await recomputeProgress(enrollment.id);
  const cert = graded.passed ? await issueIfEligible(enrollment.id) : null;
  const feedback = quiz.questions.map((q, i) => ({
    questionId: q.id,
    correct: graded.results[i].correct,
    outcome: graded.results[i].outcome,
    // Feedback for written answers waits for the instructor's mark.
    feedback: graded.results[i].outcome === "pending" ? null : q.feedback,
    correctIndex: (q.options as { correct: boolean }[]).findIndex((o) => o.correct),
  }));
  return ok({ scorePct: graded.scorePct, passed: graded.passed, awaitingReview: graded.awaitingReview, feedback, certificateId: cert?.id ?? null });
}
