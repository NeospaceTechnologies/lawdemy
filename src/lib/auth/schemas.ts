import { z } from "zod";

export const roleParam = z.enum(["learner", "instructor"]);
export const toDbRole = (r: z.infer<typeof roleParam>): "LEARNER" | "INSTRUCTOR" => (r === "learner" ? "LEARNER" : "INSTRUCTOR");

// Sign-in also accepts staff (admin) accounts; sign-up and reset do not.
export const signInRole = z.enum(["learner", "instructor", "admin"]);
export const toDbSignInRole = (r: z.infer<typeof signInRole>) => ({ learner: "LEARNER", instructor: "INSTRUCTOR", admin: "ADMIN" } as const)[r];

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.")
  .max(254);

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(256),
  role: signInRole,
});

export const resetRequestSchema = z.object({ email, role: roleParam });

export const resetConfirmSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().max(256),
    confirm: z.string(),
    role: roleParam,
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match." });
