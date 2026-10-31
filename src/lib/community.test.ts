import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: {} }));
const { monthStartWAT } = await import("./community");

describe("monthStartWAT", () => {
  it("counts months in West Africa Time", () => {
    // 23:30 UTC on 31 Oct is already 1 Nov in Lagos.
    expect(monthStartWAT(new Date("2026-10-31T23:30:00Z")).toISOString()).toBe("2026-10-31T23:00:00.000Z");
    expect(monthStartWAT(new Date("2026-10-15T10:00:00Z")).toISOString()).toBe("2026-09-30T23:00:00.000Z");
  });
});
