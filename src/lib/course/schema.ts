import { z } from "zod";
import { LEVELS, LIMITS } from "./constants";

// Wire format for saving a course draft. Drafts may be incomplete, so this
// schema only enforces types and limits; completeness is checked by rules.ts
// when the instructor publishes.

const durationFormat = z.enum(["HOURS_MINUTES", "MINUTES_SECONDS"]);
const id = z.string().min(1).max(64);
const assetRef = z.object({ id, fileName: z.string().max(255), sizeBytes: z.number().int().nonnegative() });

export const optionSchema = z.object({
  text: z.string().max(LIMITS.option),
  correct: z.boolean(),
});

export const questionSchema = z.object({
  id,
  type: z.enum(["MC", "TF", "SHORT", "UPLOAD"]),
  prompt: z.string().max(LIMITS.question),
  options: z.array(optionSchema).max(10),
  modelAnswer: z.string().max(LIMITS.question).default(""),
  feedback: z.string().max(LIMITS.feedback).default(""),
});

export const quizSchema = z.object({
  title: z.string().max(LIMITS.quizTitle),
  instructions: z.string().max(LIMITS.description).default(""),
  questions: z.array(questionSchema).max(100),
});

export const lessonSchema = z.object({
  id,
  title: z.string().max(LIMITS.title),
  video: assetRef.nullable(),
  /** WebVTT captions for the video (PRD 9 accessibility). */
  captions: assetRef.nullable().default(null),
  writeUp: z.string().max(LIMITS.writeUp).default(""),
  durationSeconds: z.number().int().min(0).max(24 * 3600),
  durationFormat,
  isPreview: z.boolean(),
});

export const moduleSchema = z.object({
  id,
  title: z.string().max(LIMITS.title),
  lessons: z.array(lessonSchema).max(200),
});

export const courseDraftSchema = z.object({
  wizardStep: z.number().int().min(1).max(3),
  info: z.object({
    title: z.string().max(LIMITS.title),
    subtitle: z.string().max(LIMITS.subtitle).default(""),
    description: z.string().max(LIMITS.description).default(""),
    outcomes: z.string().max(LIMITS.outcomes).default(""),
    durationSeconds: z.number().int().min(0).max(1000 * 3600).nullable(),
    durationFormat,
    category: z.string().max(80),
    level: z.enum(LEVELS),
    thumbnail: assetRef.nullable(),
  }),
  price: z.object({
    access: z.enum(["FREE", "PAID"]),
    priceKobo: z.number().int().min(0).max(1_000_000_000).nullable(),
    discountPct: z.number().int().min(1).max(LIMITS.maxDiscountPct).nullable(),
    discountEndsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    hasCertificate: z.boolean(),
  }),
  modules: z.array(moduleSchema).max(100),
  quiz: quizSchema.nullable(),
});

export type CourseDraft = z.infer<typeof courseDraftSchema>;
export type ModuleDraft = z.infer<typeof moduleSchema>;
export type LessonDraft = z.infer<typeof lessonSchema>;
export type QuizDraft = z.infer<typeof quizSchema>;
export type QuestionDraft = z.infer<typeof questionSchema>;
export type AssetRef = z.infer<typeof assetRef>;

export function emptyDraft(): CourseDraft {
  return {
    wizardStep: 1,
    info: {
      title: "",
      subtitle: "",
      description: "",
      outcomes: "",
      durationSeconds: null,
      durationFormat: "HOURS_MINUTES",
      category: "",
      level: "Beginner",
      thumbnail: null,
    },
    price: { access: "PAID", priceKobo: null, discountPct: null, discountEndsAt: null, hasCertificate: true },
    modules: [],
    quiz: null,
  };
}
