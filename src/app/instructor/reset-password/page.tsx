import type { Metadata } from "next";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { ResetRequestForm } from "@/features/auth/ResetRequestForm";
import { INSTRUCTOR_HERO, INSTRUCTOR_SIGNUP_LINK } from "@/features/auth/hero";

export const metadata: Metadata = { title: "Reset password" };

export default function InstructorResetRequestPage() {
  return (
    <AuthLayout {...INSTRUCTOR_HERO} topLink={INSTRUCTOR_SIGNUP_LINK}>
      <ResetRequestForm role="instructor" basePath="/instructor/reset-password" signInHref="/instructor/sign-in" />
    </AuthLayout>
  );
}
