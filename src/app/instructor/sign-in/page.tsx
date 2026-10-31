import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { SignInForm } from "@/features/auth/SignInForm";
import { INSTRUCTOR_HERO, INSTRUCTOR_SIGNUP_LINK } from "@/features/auth/hero";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Instructor sign in" };

export default async function InstructorSignInPage() {
  if (await getCurrentUser("INSTRUCTOR")) redirect("/instructor/dashboard");
  return (
    <AuthLayout {...INSTRUCTOR_HERO} topLink={INSTRUCTOR_SIGNUP_LINK}>
      <SignInForm role="instructor" />
    </AuthLayout>
  );
}
