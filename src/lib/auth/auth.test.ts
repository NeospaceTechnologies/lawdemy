import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: {} }));

const { computeLock, LOCK_MS } = await import("./lockout");
const { checkPassword, passwordStrength } = await import("./password-rules");

const at = (min: number) => new Date(Date.UTC(2026, 9, 25, 10, 0) + min * 60_000);
const fail = (min: number) => ({ success: false, createdAt: at(min) });

describe("computeLock (5 failures in 15 min → 15 min lock)", () => {
  it("does not lock after 4 failures", () => {
    expect(computeLock([0, 1, 2, 3].map(fail), at(4).getTime())).toBeNull();
  });
  it("locks on the 5th failure for 15 minutes", () => {
    const lock = computeLock([0, 1, 2, 3, 4].map(fail), at(5).getTime());
    expect(lock?.getTime()).toBe(at(4).getTime() + LOCK_MS);
    expect(computeLock([0, 1, 2, 3, 4].map(fail), at(19).getTime() + 1)).toBeNull();
  });
  it("ignores failures outside the 15-minute window", () => {
    expect(computeLock([0, 1, 2, 3, 20].map(fail), at(21).getTime())).toBeNull();
  });
  it("a successful sign-in resets the count", () => {
    const attempts = [fail(0), fail(1), fail(2), { success: true, createdAt: at(3) }, fail(4), fail(5)];
    expect(computeLock(attempts, at(6).getTime())).toBeNull();
  });
});

describe("password policy (PRD 7.1)", () => {
  it("learners need 8+ chars, a lowercase letter and a special character", () => {
    expect(checkPassword("abcdefg!", "learner").valid).toBe(true);
    expect(checkPassword("abcdefgh", "learner").valid).toBe(false);
  });
  it("instructors also need an uppercase letter or a number", () => {
    expect(checkPassword("abcdefg!", "instructor").valid).toBe(false);
    expect(checkPassword("abcdefg!1", "instructor").valid).toBe(true);
    expect(checkPassword("Abcdefg!", "instructor").valid).toBe(true);
  });
  it("rejects common passwords", () => {
    const r = checkPassword("P@ssw0rd", "instructor");
    expect(r.common).toBe(true);
    expect(r.valid).toBe(false);
  });
  it("rates long passwords that pass every rule as Strong", () => {
    expect(passwordStrength("Lawdemy#2026-strong", "instructor").label).toBe("Strong");
    expect(passwordStrength("ab", "instructor").label).toBe("Weak");
  });
});
