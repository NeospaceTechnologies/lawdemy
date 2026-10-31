import type { Metadata } from "next";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { redirect } from "next/navigation";
import { SignInForm } from "@/features/auth/SignInForm";
import { LEARNER_HERO, LEARNER_SIGNUP_LINK } from "@/features/auth/hero";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function Page() {
  if (await getCurrentUser("LEARNER")) redirect("/dashboard");
  return (
    <AuthLayout {...LEARNER_HERO} topLink={LEARNER_SIGNUP_LINK}>
      <SignInForm role="learner" />
    </AuthLayout>
  );
}
