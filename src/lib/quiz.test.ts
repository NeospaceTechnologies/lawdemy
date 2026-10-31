import { describe, expect, it } from "vitest";
import { gradeQuiz } from "./quiz";

const qs = [
  { id: "a", type: "MC" as const, options: [{ text: "x", correct: false }, { text: "y", correct: true }] },
  { id: "b", type: "TF" as const, options: [{ text: "True", correct: true }, { text: "False", correct: false }] },
  { id: "c", type: "SHORT" as const, options: [] },
];

describe("gradeQuiz", () => {
  it("marks MC/TF automatically and holds an answered short answer for review", () => {
    const r = gradeQuiz(qs, { a: 1, b: 0, c: "consideration" });
    expect(r.results.map((x) => x.outcome)).toEqual(["correct", "correct", "pending"]);
    expect(r.scorePct).toBe(67);
    expect(r.awaitingReview).toBe(true);
    expect(r.passed).toBe(false);
  });

  it("passes once the instructor marks the short answer correct", () => {
    const r = gradeQuiz(qs, { a: 1, b: 0, c: "consideration" }, { c: { correct: true } });
    expect(r.scorePct).toBe(100);
    expect(r.awaitingReview).toBe(false);
    expect(r.passed).toBe(true);
  });

  it("fails when the instructor marks it wrong and the rest fall short", () => {
    const r = gradeQuiz(qs, { a: 1, b: 0, c: "offer" }, { c: { correct: false } });
    expect(r.scorePct).toBe(67);
    expect(r.passed).toBe(false);
  });

  it("is final straight away when even a correct pending answer can't reach the pass mark", () => {
    const r = gradeQuiz(qs, { a: 0, b: 1, c: "consideration" });
    expect(r.bestPossiblePct).toBe(33);
    expect(r.awaitingReview).toBe(false);
    expect(r.passed).toBe(false);
  });

  it("treats an empty short answer as incorrect", () => {
    const r = gradeQuiz(qs, { a: 0, b: 0, c: "" });
    expect(r.scorePct).toBe(33);
    expect(r.results[2].outcome).toBe("incorrect");
  });
});
