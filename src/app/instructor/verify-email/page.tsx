import type { Metadata } from "next";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { ToastViewport } from "@/components/ui/Toast";
import { VerifyResult } from "@/features/auth/SignUpForms";
import { INSTRUCTOR_HERO } from "@/features/auth/hero";

export const metadata: Metadata = { title: "Email verification" };

export default async function InstructorVerifyEmailPage({ searchParams }: { searchParams: Promise<{ status?: string; email?: string }> }) {
  const { status, email } = await searchParams;
  return (
    <AuthLayout {...INSTRUCTOR_HERO}>
      <ToastViewport className="mb-4" />
      <VerifyResult status={status === "verified" ? "verified" : "expired"} email={email} role="instructor" next="/instructor/onboarding" body="Your account is active. Let’s set up your instructor profile." cta="Continue" />
    </AuthLayout>
  );
}
