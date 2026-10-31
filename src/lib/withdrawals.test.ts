import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: {} }));
const { withdrawalProblem } = await import("./withdrawals");

describe("withdrawalProblem (INS-PAY-06 acceptance)", () => {
  it("blocks amounts over the available balance", () => {
    expect(withdrawalProblem(5_000_000, 4_000_000)).toBe("Amount exceeds your available balance");
  });
  it("enforces the ₦1,000 minimum", () => {
    expect(withdrawalProblem(50_000, 4_000_000)).toMatch(/Minimum withdrawal/);
  });
  it("includes the charge in the total debit", () => {
    expect(withdrawalProblem(4_000_000, 4_000_000)).toMatch(/charge/);
    expect(withdrawalProblem(3_998_000, 4_000_000)).toBeNull();
  });
});
