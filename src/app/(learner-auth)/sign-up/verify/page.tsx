import type { Metadata } from "next";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { ToastViewport } from "@/components/ui/Toast";
import { VerifySent } from "@/features/auth/SignUpForms";
import { LEARNER_HERO, LEARNER_SIGNIN_LINK } from "@/features/auth/hero";

export const metadata: Metadata = { title: "Verify your email" };

export default function Page() {
  return (
    <AuthLayout {...LEARNER_HERO} topLink={LEARNER_SIGNIN_LINK}>
      <ToastViewport className="mb-4" />
      <VerifySent role="learner" back="/sign-up/account" />
    </AuthLayout>
  );
}
