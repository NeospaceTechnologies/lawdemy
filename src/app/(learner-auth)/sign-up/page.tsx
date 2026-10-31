import type { Metadata } from "next";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { SignUpEmailForm } from "@/features/auth/SignUpForms";
import { LEARNER_HERO, LEARNER_SIGNIN_LINK } from "@/features/auth/hero";

export const metadata: Metadata = { title: "Create your account" };

export default function Page() {
  return (
    <AuthLayout {...LEARNER_HERO} topLink={LEARNER_SIGNIN_LINK}>
      <SignUpEmailForm role="learner" next="/sign-up/account" signInHref="/sign-in" />
    </AuthLayout>
  );
}
