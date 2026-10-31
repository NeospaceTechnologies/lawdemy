// Course Information options (PRD 5.3, INS-CRS-05). Admin-managed in a later
// phase (ADM-11); kept here until that exists.
export const CATEGORIES = [
  "Law Practice Areas",
  "Legal Skills & Development",
  "Business, Tech & Compliance",
  "Cross-Sector & General Interest",
  "International & Emerging Fields",
] as const;

export const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;

export const LIMITS = {
  title: 120,
  subtitle: 160,
  description: 5000,
  outcomes: 3000,
  writeUp: 100_000,
  quizTitle: 200,
  question: 2000,
  option: 500,
  feedback: 2000,
  maxDiscountPct: 90, // PRD 7.1
  videoMaxBytes: 500 * 1024 * 1024, // PRD 7.1
  videoMaxSeconds: 30 * 60, // PRD 7.1
  imageMaxBytes: 5 * 1024 * 1024,
} as const;

export const VIDEO_MIME = ["video/mp4"] as const;
export const IMAGE_MIME = ["image/jpeg", "image/png"] as const;

export const QUESTION_TYPES = {
  MC: "Multiple choice",
  TF: "True or False",
  SHORT: "Short Answer",
  UPLOAD: "Upload (Essay/Attachment)",
} as const;
export type QuestionType = keyof typeof QUESTION_TYPES;

export const AUTOSAVE_MS = 30_000; // PRD INS-CRS-09
