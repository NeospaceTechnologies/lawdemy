import type { Metadata } from "next";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { NewPasswordForm } from "@/features/auth/NewPasswordForm";
import { INSTRUCTOR_HERO, INSTRUCTOR_SIGNUP_LINK } from "@/features/auth/hero";
import { findValidResetToken } from "@/lib/auth/reset";

export const metadata: Metadata = { title: "Set new password" };

export default async function InstructorNewPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? "";
  const valid = await findValidResetToken(token, "INSTRUCTOR");
  return (
    <AuthLayout {...INSTRUCTOR_HERO} topLink={INSTRUCTOR_SIGNUP_LINK}>
      <NewPasswordForm role="instructor" token={token} expired={!valid} basePath="/instructor/reset-password" signInHref="/instructor/sign-in" />
    </AuthLayout>
  );
}
