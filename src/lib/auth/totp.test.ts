import { describe, expect, it } from "vitest";
import { base32Decode, base32Encode, hotp, totp, verifyTotp } from "./totp";

// RFC 6238 appendix B test secret ("12345678901234567890" in ASCII).
const SECRET = base32Encode(Buffer.from("12345678901234567890"));

describe("totp", () => {
  it("round-trips base32", () => {
    const buf = Buffer.from("lawdemy staff 2fa");
    expect(base32Decode(base32Encode(buf)).equals(buf)).toBe(true);
  });

  it("matches the RFC 6238 SHA-1 vectors (last 6 digits)", () => {
    expect(totp(SECRET, 59_000)).toBe("287082");
    expect(totp(SECRET, 1_111_111_109_000)).toBe("081804");
    expect(totp(SECRET, 1_234_567_890_000)).toBe("005924");
    expect(totp(SECRET, 2_000_000_000_000)).toBe("279037");
  });

  it("matches the RFC 4226 HOTP vectors", () => {
    expect(hotp(SECRET, 0)).toBe("755224");
    expect(hotp(SECRET, 1)).toBe("287082");
  });

  it("accepts one step of clock drift and rejects older codes", () => {
    const now = 1_700_000_000_000;
    expect(verifyTotp(SECRET, totp(SECRET, now - 30_000), now)).toBe(true);
    expect(verifyTotp(SECRET, totp(SECRET, now + 30_000), now)).toBe(true);
    expect(verifyTotp(SECRET, totp(SECRET, now - 90_000), now)).toBe(false);
    expect(verifyTotp(SECRET, "12345", now)).toBe(false);
  });
});
