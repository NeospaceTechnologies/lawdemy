import type { Metadata } from "next";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { ToastViewport } from "@/components/ui/Toast";
import { VerifySent } from "@/features/auth/SignUpForms";
import { INSTRUCTOR_HERO } from "@/features/auth/hero";

export const metadata: Metadata = { title: "Verify your email" };

export default function InstructorVerifySentPage() {
  return (
    <AuthLayout {...INSTRUCTOR_HERO} topLink={{ prompt: "Already have an account?", label: "Sign in", href: "/instructor/sign-in" }}>
      <ToastViewport className="mb-4" />
      <VerifySent role="instructor" back="/instructor/sign-up" />
    </AuthLayout>
  );
}
