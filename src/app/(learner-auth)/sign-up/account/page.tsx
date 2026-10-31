import type { Metadata } from "next";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { AccountInfoForm } from "@/features/auth/SignUpForms";
import { LEARNER_HERO, LEARNER_SIGNIN_LINK } from "@/features/auth/hero";

export const metadata: Metadata = { title: "Account information" };

export default function Page() {
  return (
    <AuthLayout {...LEARNER_HERO} topLink={LEARNER_SIGNIN_LINK}>
      <AccountInfoForm role="learner" back="/sign-up" next="/sign-up/verify" />
    </AuthLayout>
  );
}
