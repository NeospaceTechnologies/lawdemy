import { BUSINESS } from "@/lib/config";

export type Answer = number | string | null;
export type GradableQuestion = { id: string; type: "MC" | "TF" | "SHORT" | "UPLOAD"; options: { text: string; correct: boolean }[] };
/** Instructor marks for short-answer and upload questions. */
export type Marks = Record<string, { correct: boolean; comment?: string | null }>;
export type Outcome = "correct" | "incorrect" | "pending";

const MANUAL = new Set(["SHORT", "UPLOAD"]);

/**
 * Grades a final-quiz attempt. Multiple choice and True/False are marked automatically.
 * Answered short-answer and upload questions stay "pending" until the instructor marks
 * them (or `marks` supplies the mark); unanswered ones are incorrect.
 *
 * - scorePct counts only questions marked correct so far.
 * - awaitingReview: some answers are pending and the learner could still reach the pass mark.
 *   If they can't pass even with every pending answer right, the attempt is final at once.
 */
export function gradeQuiz(questions: GradableQuestion[], answers: Record<string, Answer>, marks: Marks = {}) {
  let correct = 0;
  let pending = 0;
  const results = questions.map((q) => {
    const a = answers[q.id];
    let outcome: Outcome;
    if (q.type === "MC" || q.type === "TF") outcome = typeof a === "number" && !!q.options[a]?.correct ? "correct" : "incorrect";
    else if (typeof a !== "string" || !a.trim()) outcome = "incorrect";
    else if (marks[q.id]) outcome = marks[q.id].correct ? "correct" : "incorrect";
    else outcome = "pending";
    if (outcome === "correct") correct += 1;
    if (outcome === "pending") pending += 1;
    return { questionId: q.id, outcome, correct: outcome === "correct" };
  });
  const pct = (n: number) => (questions.length ? Math.round((n / questions.length) * 100) : 0);
  const scorePct = pct(correct);
  const bestPossiblePct = pct(correct + pending);
  const awaitingReview = pending > 0 && bestPossiblePct >= BUSINESS.quizPassPct;
  return { scorePct, bestPossiblePct, awaitingReview, passed: !awaitingReview && scorePct >= BUSINESS.quizPassPct, results };
}

export function needsManualMarking(type: string) {
  return MANUAL.has(type);
}
