import type { Metadata } from "next";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { InstructorSignUpForm } from "@/features/auth/InstructorOnboarding";
import { INSTRUCTOR_HERO } from "@/features/auth/hero";

export const metadata: Metadata = { title: "Become an instructor" };

export default function InstructorSignUpPage() {
  return (
    <AuthLayout {...INSTRUCTOR_HERO} topLink={{ prompt: "Already have an account?", label: "Sign in", href: "/instructor/sign-in" }}>
      <InstructorSignUpForm />
    </AuthLayout>
  );
}
