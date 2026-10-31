import type { Metadata } from "next";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { ResetRequestForm } from "@/features/auth/ResetRequestForm";
import { LEARNER_HERO, LEARNER_SIGNUP_LINK } from "@/features/auth/hero";

export const metadata: Metadata = { title: "Reset password" };

export default function Page() {
  return (
    <AuthLayout {...LEARNER_HERO} topLink={LEARNER_SIGNUP_LINK}>
      <ResetRequestForm role="learner" basePath="/reset-password" signInHref="/sign-in" />
    </AuthLayout>
  );
}
