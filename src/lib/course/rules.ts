import { LIMITS } from "./constants";
import type { CourseDraft, LessonDraft, QuestionDraft, QuizDraft } from "./schema";

// Completeness rules for the Create Course wizard (PRD 5.3). Used by the UI to
// enable buttons and by the server to accept a submission; never trust the UI alone.

export function htmlToText(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function infoIssues(info: CourseDraft["info"]): string[] {
  const issues: string[] = [];
  if (!info.title.trim()) issues.push("Add a course title.");
  if (info.title.length > LIMITS.title) issues.push(`Course title must be ${LIMITS.title} characters or fewer.`);
  if (info.subtitle.length > LIMITS.subtitle) issues.push(`Subtitle must be ${LIMITS.subtitle} characters or fewer.`);
  if (!info.description.trim()) issues.push("Add a course description.");
  if (!info.category.trim()) issues.push("Choose a course category.");
  return issues;
}

/** `today` is a YYYY-MM-DD string in WAT, passed in so the rule stays pure. */
export function priceIssues(price: CourseDraft["price"], today: string): string[] {
  if (price.access === "FREE") return [];
  const issues: string[] = [];
  if (!price.priceKobo || price.priceKobo <= 0) issues.push("Enter a price above ₦0.");
  if (price.discountPct !== null || price.discountEndsAt !== null) {
    if (!price.discountPct || price.discountPct < 1 || price.discountPct > LIMITS.maxDiscountPct) {
      issues.push(`Discount must be between 1% and ${LIMITS.maxDiscountPct}%.`);
    }
    if (!price.discountEndsAt) issues.push("Choose when the discount ends.");
    else if (price.discountEndsAt <= today) issues.push("The discount end date must be in the future.");
  }
  return issues;
}

export function lessonIssues(lesson: Pick<LessonDraft, "title" | "video" | "writeUp">): string[] {
  const issues: string[] = [];
  if (!lesson.title.trim()) issues.push("Add a lesson title.");
  if (!lesson.video && !htmlToText(lesson.writeUp)) issues.push("Add a video or a write-up.");
  return issues;
}

export function questionIssues(q: QuestionDraft): string[] {
  const issues: string[] = [];
  if (!q.prompt.trim()) issues.push("Type the question.");
  if (q.type === "MC") {
    if (q.options.length < 2) issues.push("Add at least 2 options.");
    if (q.options.some((o) => !o.text.trim())) issues.push("Fill in every option.");
    if (q.options.filter((o) => o.correct).length !== 1) issues.push("Mark exactly one correct answer.");
  }
  if (q.type === "TF" && q.options.filter((o) => o.correct).length !== 1) issues.push("Mark the correct answer.");
  return issues;
}

export function quizIssues(quiz: QuizDraft): string[] {
  const issues: string[] = [];
  if (!quiz.title.trim()) issues.push("Add a quiz title.");
  if (quiz.questions.length === 0) issues.push("Add at least one question.");
  quiz.questions.forEach((q, i) => {
    if (questionIssues(q).length) issues.push(`Question ${i + 1} is incomplete.`);
  });
  return issues;
}

export function publishIssues(draft: CourseDraft, today: string): string[] {
  const issues = [...infoIssues(draft.info), ...priceIssues(draft.price, today)];
  const lessons = draft.modules.flatMap((m) => m.lessons);
  if (lessons.length === 0) issues.push("Add at least one lesson to a module.");
  draft.modules.forEach((m, mi) =>
    m.lessons.forEach((l, li) => {
      if (lessonIssues(l).length) issues.push(`Module ${mi + 1}, lesson ${li + 1} is incomplete.`);
    }),
  );
  if (draft.price.hasCertificate) {
    if (!draft.quiz) issues.push("Add a final quiz: it is required when the course offers a certificate.");
    else issues.push(...quizIssues(draft.quiz));
  } else if (draft.quiz) {
    issues.push(...quizIssues(draft.quiz));
  }
  return issues;
}

export function todayInWAT(now = new Date()) {
  // Africa/Lagos is UTC+1 all year (no DST).
  return new Date(now.getTime() + 3600_000).toISOString().slice(0, 10);
}
