import { describe, expect, it } from "vitest";
import { emptyDraft, type CourseDraft, type QuestionDraft } from "./schema";
import { lessonIssues, priceIssues, publishIssues, questionIssues, todayInWAT } from "./rules";

const TODAY = "2026-10-25";

function readyDraft(over: Partial<CourseDraft> = {}): CourseDraft {
  const d = emptyDraft();
  d.info = { ...d.info, title: "Contract Law Basics", description: "Intro", category: "Law Practice Areas" };
  d.price = { ...d.price, access: "PAID", priceKobo: 2_290_000, hasCertificate: false };
  d.modules = [
    {
      id: "m1",
      title: "Intro",
      lessons: [{ id: "l1", title: "Welcome", video: null, captions: null, writeUp: "<p>Hello</p>", durationSeconds: 300, durationFormat: "MINUTES_SECONDS", isPreview: false }],
    },
  ];
  return { ...d, ...over };
}

const mc = (over: Partial<QuestionDraft> = {}): QuestionDraft => ({
  id: "q1",
  type: "MC",
  prompt: "What is consideration?",
  options: [
    { text: "Something of value", correct: true },
    { text: "A feeling", correct: false },
  ],
  modelAnswer: "",
  feedback: "",
  ...over,
});

describe("lessonIssues", () => {
  it("needs a video or a write-up (INS-CRS acceptance criteria)", () => {
    expect(lessonIssues({ title: "A", video: null, writeUp: "" })).toContain("Add a video or a write-up.");
    expect(lessonIssues({ title: "A", video: null, writeUp: "<p> </p>" })).toContain("Add a video or a write-up.");
    expect(lessonIssues({ title: "A", video: { id: "v", fileName: "a.mp4", sizeBytes: 1 }, writeUp: "" })).toEqual([]);
    expect(lessonIssues({ title: "A", video: null, writeUp: "<p>text</p>" })).toEqual([]);
  });
});

describe("questionIssues", () => {
  it("flags a multiple-choice question with no correct option", () => {
    const q = mc({ options: [{ text: "a", correct: false }, { text: "b", correct: false }] });
    expect(questionIssues(q)).toContain("Mark exactly one correct answer.");
  });
  it("needs 2+ filled options", () => {
    expect(questionIssues(mc({ options: [{ text: "a", correct: true }] }))).toContain("Add at least 2 options.");
    expect(questionIssues(mc({ options: [{ text: "a", correct: true }, { text: " ", correct: false }] }))).toContain("Fill in every option.");
  });
  it("accepts short answer and upload without options", () => {
    expect(questionIssues(mc({ type: "SHORT", options: [] }))).toEqual([]);
    expect(questionIssues(mc({ type: "UPLOAD", options: [] }))).toEqual([]);
  });
});

describe("priceIssues", () => {
  it("requires a price above 0 when paid", () => {
    expect(priceIssues({ access: "PAID", priceKobo: 0, discountPct: null, discountEndsAt: null, hasCertificate: false }, TODAY)).not.toEqual([]);
    expect(priceIssues({ access: "FREE", priceKobo: null, discountPct: null, discountEndsAt: null, hasCertificate: false }, TODAY)).toEqual([]);
  });
  it("caps discount at 90% and needs a future end date", () => {
    const base = { access: "PAID" as const, priceKobo: 100_00, hasCertificate: false };
    expect(priceIssues({ ...base, discountPct: 95, discountEndsAt: "2026-12-01" }, TODAY)).toHaveLength(1);
    expect(priceIssues({ ...base, discountPct: 20, discountEndsAt: TODAY }, TODAY)).toHaveLength(1);
    expect(priceIssues({ ...base, discountPct: 20, discountEndsAt: "2026-12-01" }, TODAY)).toEqual([]);
  });
});

describe("publishIssues", () => {
  it("is ready with info, price and one lesson", () => {
    expect(publishIssues(readyDraft(), TODAY)).toEqual([]);
  });
  it("needs at least one lesson", () => {
    expect(publishIssues(readyDraft({ modules: [{ id: "m", title: "", lessons: [] }] }), TODAY)).toContain("Add at least one lesson to a module.");
  });
  it("needs a valid quiz when the certificate is on (INS-CRS-10)", () => {
    const d = readyDraft();
    d.price.hasCertificate = true;
    expect(publishIssues(d, TODAY).join()).toMatch(/final quiz/);
    d.quiz = { title: "Final", instructions: "", questions: [mc()] };
    expect(publishIssues(d, TODAY)).toEqual([]);
  });
  it("requires title, description and category", () => {
    const d = readyDraft();
    d.info.description = "";
    d.info.category = "";
    expect(publishIssues(d, TODAY)).toEqual(expect.arrayContaining(["Add a course description.", "Choose a course category."]));
  });
});

describe("todayInWAT", () => {
  it("rolls over at 23:00 UTC (midnight in Lagos)", () => {
    expect(todayInWAT(new Date("2026-10-25T22:59:00Z"))).toBe("2026-10-25");
    expect(todayInWAT(new Date("2026-10-25T23:00:00Z"))).toBe("2026-10-26");
  });
});
