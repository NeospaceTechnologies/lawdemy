// Password policy (PRD 7.1). Shared by the client checklist and the server.
// Base rule for everyone: min 8 chars, 1 lowercase, 1 special character.
// Instructors and admins handle money, so they also need 1 number or uppercase letter.

export type PasswordRole = "learner" | "instructor";

export type PasswordRule = { id: string; label: string; test: (pw: string) => boolean };

const base: PasswordRule[] = [
  { id: "length", label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { id: "lower", label: "One lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { id: "special", label: "One special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

const instructorExtra: PasswordRule = {
  id: "upperOrNumber",
  label: "One uppercase letter or number",
  test: (pw) => /[A-Z0-9]/.test(pw),
};

export function passwordRules(role: PasswordRole): PasswordRule[] {
  return role === "learner" ? base : [base[0], base[1], instructorExtra, base[2]];
}

// A small sample of the most common passwords. Production must load the full
// 10,000-entry list (PRD 7.1) on the server; see docs/BUILD-NOTES.md.
const COMMON = new Set([
  "password", "password1", "password!", "12345678", "123456789", "qwerty123", "iloveyou",
  "admin123", "welcome1", "abc12345", "passw0rd", "p@ssw0rd", "p@ssword", "letmein1",
  "football", "sunshine", "princess", "baseball", "11111111", "00000000", "qwertyuiop",
]);

export function isCommonPassword(pw: string): boolean {
  return COMMON.has(pw.toLowerCase());
}

export function checkPassword(pw: string, role: PasswordRole) {
  const results = passwordRules(role).map((r) => ({ id: r.id, label: r.label, ok: r.test(pw) }));
  const common = pw.length > 0 && isCommonPassword(pw);
  return { results, common, valid: results.every((r) => r.ok) && !common };
}

export type Strength = { score: 0 | 1 | 2 | 3 | 4; label: "" | "Weak" | "Fair" | "Good" | "Strong" };

export function passwordStrength(pw: string, role: PasswordRole): Strength {
  if (!pw) return { score: 0, label: "" };
  const { results, common } = checkPassword(pw, role);
  if (common) return { score: 1, label: "Weak" };
  const passed = results.filter((r) => r.ok).length;
  let score = Math.max(1, Math.round((passed / results.length) * 3)) as 1 | 2 | 3 | 4;
  if (passed === results.length && pw.length >= 12) score = 4;
  const labels = ["", "Weak", "Fair", "Good", "Strong"] as const;
  return { score, label: labels[score] };
}
