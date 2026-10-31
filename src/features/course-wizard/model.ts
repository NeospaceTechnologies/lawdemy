import { LIMITS } from "@/lib/course/constants";
import type { AssetRef, CourseDraft, ModuleDraft, QuizDraft } from "@/lib/course/schema";
import { infoIssues } from "@/lib/course/rules";
import { joinDuration, koboToNairaInput, nairaToKobo, splitDuration, type DurationFormat } from "@/lib/format";

// Form state keeps numbers as the strings the user typed; buildDraft converts
// to the wire format the API validates.

export type InfoForm = {
  title: string;
  subtitle: string;
  description: string;
  outcomes: string;
  durationFormat: DurationFormat;
  durA: string;
  durB: string;
  category: CourseDraft["info"]["category"];
  level: CourseDraft["info"]["level"];
};

export type PriceForm = {
  access: "FREE" | "PAID";
  price: string;
  discountOn: boolean;
  discountPct: string;
  discountEndsAt: string;
  hasCertificate: boolean;
};

export function infoFormFrom(d: CourseDraft): InfoForm {
  const [durA, durB] = splitDuration(d.info.durationSeconds, d.info.durationFormat);
  return {
    title: d.info.title,
    subtitle: d.info.subtitle,
    description: d.info.description,
    outcomes: d.info.outcomes,
    durationFormat: d.info.durationFormat,
    durA,
    durB,
    category: d.info.category,
    level: d.info.level,
  };
}

export function priceFormFrom(d: CourseDraft): PriceForm {
  return {
    access: d.price.access,
    price: koboToNairaInput(d.price.priceKobo),
    discountOn: d.price.discountPct !== null,
    discountPct: d.price.discountPct === null ? "" : String(d.price.discountPct),
    discountEndsAt: d.price.discountEndsAt ?? "",
    hasCertificate: d.price.hasCertificate,
  };
}

const MAX_PRICE_KOBO = 1_000_000_000;

/** Price step problems, keyed by field so they can show inline. */
export function priceFormIssues(p: PriceForm, today: string): Partial<Record<"price" | "discountPct" | "discountEndsAt", string>> {
  if (p.access === "FREE") return {};
  const out: Partial<Record<"price" | "discountPct" | "discountEndsAt", string>> = {};
  const kobo = nairaToKobo(p.price);
  if (kobo === null || kobo <= 0) out.price = "Enter a price above ₦0.";
  else if (kobo > MAX_PRICE_KOBO) out.price = "Enter a lower price.";
  if (p.discountOn) {
    const pct = Number(p.discountPct);
    if (!Number.isInteger(pct) || pct < 1 || pct > LIMITS.maxDiscountPct) out.discountPct = `Enter a whole number from 1 to ${LIMITS.maxDiscountPct}.`;
    if (!p.discountEndsAt) out.discountEndsAt = "Choose an end date.";
    else if (p.discountEndsAt <= today) out.discountEndsAt = "Choose a date after today.";
  }
  return out;
}

export function buildDraft(args: {
  info: InfoForm;
  thumbnail: AssetRef | null;
  price: PriceForm;
  modules: ModuleDraft[];
  quiz: QuizDraft | null;
  maxStep: number;
  today: string;
}): CourseDraft {
  const { info, price } = args;
  const issues = priceFormIssues(price, args.today);
  const kobo = nairaToKobo(price.price);
  const discountValid = price.discountOn && !issues.discountPct && !issues.discountEndsAt;
  return {
    wizardStep: args.maxStep,
    info: {
      title: info.title,
      subtitle: info.subtitle,
      description: info.description,
      outcomes: info.outcomes,
      durationSeconds: Math.min(joinDuration(info.durA, info.durB, info.durationFormat) ?? 0, 1000 * 3600) || null,
      durationFormat: info.durationFormat,
      category: info.category,
      level: info.level,
      thumbnail: args.thumbnail,
    },
    price: {
      access: price.access,
      priceKobo: kobo !== null && kobo <= MAX_PRICE_KOBO ? kobo : null,
      discountPct: discountValid ? Number(price.discountPct) : null,
      discountEndsAt: discountValid ? price.discountEndsAt : null,
      hasCertificate: price.hasCertificate,
    },
    modules: args.modules,
    quiz: args.quiz,
  };
}

export const infoOk = (d: CourseDraft) => infoIssues(d.info).length === 0;

export function newId() {
  return crypto.randomUUID();
}

// Toast copy from Inst-CreateCourse.
export const TOASTS = {
  price: { title: "Price information saved", body: "Next, build your course structure." },
  lesson: { title: "Lesson Saved!", body: "You can continue adding or editing lessons." },
  lessonUpdated: { title: "Lesson Updated!", body: "Your changes have been saved successfully." },
  lessonDeleted: { title: "Lesson Deleted", body: "The lesson has been removed from this module." },
  file: { title: "File Deleted", body: "The video has been removed from this lesson." },
  module: { title: "Module Deleted Successfully", body: "The module and all its lessons have been removed." },
  draft: { title: "Changes saved to draft", body: "You can come back and finish your course anytime." },
  published: { title: "Course submitted for review", body: "We’ll notify you once your course is live." },
  quizAdded: { title: "Quiz added successfully", body: "Learners will take this quiz at the end of the course." },
  quizUpdated: { title: "Quiz updated successfully", body: "Your changes to the quiz have been saved." },
  quizDeleted: { title: "Quiz Deleted", body: "The quiz has been removed from this course." },
} as const;
export type ToastKey = keyof typeof TOASTS;
