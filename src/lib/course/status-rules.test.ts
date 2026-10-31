import { describe, expect, it } from "vitest";
import { allowedActions } from "./status-rules";

describe("allowedActions (PRD 7.2)", () => {
  it("locks Under Review courses", () => expect(allowedActions("UNDER_REVIEW", 0)).toEqual([]));
  it("Live courses can only be duplicated or archived", () => expect(allowedActions("LIVE", 10).sort()).toEqual(["archive", "duplicate"]));
  it("archived courses with learners can't be deleted", () => {
    expect(allowedActions("ARCHIVED", 3)).not.toContain("delete");
    expect(allowedActions("ARCHIVED", 0)).toContain("delete");
  });
  it("drafts and rejected courses can be edited and submitted", () => {
    for (const s of ["DRAFT", "REJECTED"] as const) expect(allowedActions(s, 0)).toEqual(expect.arrayContaining(["edit", "submit", "delete"]));
  });
});
