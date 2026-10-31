import type { Metadata } from "next";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { NewPasswordForm } from "@/features/auth/NewPasswordForm";
import { LEARNER_HERO, LEARNER_SIGNUP_LINK } from "@/features/auth/hero";
import { findValidResetToken } from "@/lib/auth/reset";

export const metadata: Metadata = { title: "Set new password" };

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? "";
  const valid = await findValidResetToken(token, "LEARNER");
  return (
    <AuthLayout {...LEARNER_HERO} topLink={LEARNER_SIGNUP_LINK}>
      <NewPasswordForm role="learner" token={token} expired={!valid} basePath="/reset-password" signInHref="/sign-in" />
    </AuthLayout>
  );
}
