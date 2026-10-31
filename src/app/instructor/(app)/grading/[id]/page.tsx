import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { GradeAttempt } from "@/features/instructor/GradeAttempt";
import { requireInstructorPage } from "@/lib/auth/pages";
import { attemptForInstructor } from "@/lib/grading";
import { gradeQuiz, needsManualMarking, type Answer, type Marks } from "@/lib/quiz";
import { BUSINESS } from "@/lib/config";

export const metadata: Metadata = { title: "Mark quiz answers" };

export default async function GradeAttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireInstructorPage();
  const a = await attemptForInstructor((await params).id, user.id);
  if (!a) notFound();
  const answers = a.answers as Record<string, Answer>;
  const marks = (a.marks ?? {}) as Marks;
  const graded = gradeQuiz(a.quiz.questions.map((q) => ({ id: q.id, type: q.type, options: q.options as { text: string; correct: boolean }[] })), answers, marks);
  const items = a.quiz.questions.map((q, i) => {
    const raw = answers[q.id];
    const opts = q.options as { text: string; correct: boolean }[];
    const answer =
      typeof raw === "number" ? opts[raw]?.text ?? "—"
      : typeof raw === "string" && raw.startsWith("asset:") ? { assetId: raw.slice(6) }
      : typeof raw === "string" && raw.trim() ? raw
      : null;
    return {
      id: q.id,
      n: i + 1,
      type: q.type,
      prompt: q.prompt,
      answer,
      modelAnswer: needsManualMarking(q.type) ? q.modelAnswer : opts.find((o) => o.correct)?.text ?? null,
      outcome: graded.results[i].outcome,
      mark: marks[q.id] ?? null,
    };
  });
  return (
    <>
      <Link href="/instructor/grading" aria-label="Back to quiz answers" className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-2"><ChevronLeftIcon /></Link>
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-[26px] font-semibold">{a.learner.firstName} {a.learner.lastName} · {a.quiz.title}</h1>
        <p className="m-0 text-sm text-ink-3">{a.quiz.course.title} · pass mark {BUSINESS.quizPassPct}% · auto-marked so far {graded.scorePct}%</p>
      </div>
      <GradeAttempt attemptId={a.id} readOnly={a.status !== "awaiting_review"} total={items.length} passPct={BUSINESS.quizPassPct} items={items} />
    </>
  );
}
