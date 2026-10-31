import type { Metadata } from "next";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { ToastViewport } from "@/components/ui/Toast";
import { CheckEmail } from "@/features/auth/CheckEmail";
import { INSTRUCTOR_HERO, INSTRUCTOR_SIGNUP_LINK } from "@/features/auth/hero";

export const metadata: Metadata = { title: "Check your email" };

export default function InstructorResetCheckEmailPage() {
  return (
    <AuthLayout {...INSTRUCTOR_HERO} topLink={INSTRUCTOR_SIGNUP_LINK}>
      <ToastViewport className="mb-4" />
      <CheckEmail role="instructor" basePath="/instructor/reset-password" />
    </AuthLayout>
  );
}
