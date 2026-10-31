import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Topbar } from "@/components/learner/Topbar";
import { QuizTaker } from "@/features/learn/QuizTaker";
import { db } from "@/lib/db";
import { activeEnrollment } from "@/lib/learning";
import { BUSINESS } from "@/lib/config";
import { requireLearnerPage } from "@/lib/auth/pages";

export const metadata: Metadata = { title: "Final quiz" };

export default async function QuizPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { user } = await requireLearnerPage();
  const courseId = (await params).courseId;
  const enrollment = await activeEnrollment(courseId, user.id);
  if (!enrollment) redirect(`/courses/${courseId}`);
  const quiz = await db.quiz.findUnique({ where: { courseId }, include: { questions: { orderBy: { position: "asc" } }, course: { select: { title: true } } } });
  if (!quiz) notFound();
  const [best, latest] = await Promise.all([
    db.quizAttempt.findFirst({ where: { quizId: quiz.id, learnerId: user.id, status: "graded" }, orderBy: { scorePct: "desc" } }),
    db.quizAttempt.findFirst({ where: { quizId: quiz.id, learnerId: user.id }, orderBy: { submittedAt: "desc" } }),
  ]);
  const marks = (latest?.marks ?? {}) as Record<string, { correct: boolean; comment?: string | null }>;
  const review = latest && (latest.status === "awaiting_review" || latest.reviewedAt)
    ? {
        status: latest.status as "awaiting_review" | "graded",
        scorePct: latest.scorePct,
        passed: latest.passed,
        comments: quiz.questions.filter((q) => marks[q.id]).map((q) => ({ prompt: q.prompt, correct: marks[q.id].correct, comment: marks[q.id].comment ?? null })),
      }
    : null;
  return (
    <>
      <Topbar back={`/learn/${courseId}`} />
      <QuizTaker
        courseId={courseId}
        courseTitle={quiz.course.title}
        title={quiz.title}
        instructions={quiz.instructions}
        passPct={BUSINESS.quizPassPct}
        best={best ? { scorePct: best.scorePct, passed: best.passed } : null}
        review={review}
        questions={quiz.questions.map((q) => ({ id: q.id, type: q.type, prompt: q.prompt, options: (q.options as { text: string }[]).map((o) => o.text) }))}
      />
    </>
  );
}
