import type { Metadata } from "next";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { ToastViewport } from "@/components/ui/Toast";
import { CheckEmail } from "@/features/auth/CheckEmail";
import { LEARNER_HERO, LEARNER_SIGNUP_LINK } from "@/features/auth/hero";

export const metadata: Metadata = { title: "Check your email" };

export default function Page() {
  return (
    <AuthLayout {...LEARNER_HERO} topLink={LEARNER_SIGNUP_LINK}>
      <ToastViewport className="mb-4" />
      <CheckEmail role="learner" basePath="/reset-password" />
    </AuthLayout>
  );
}
