import type { Metadata } from "next";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { InstructorAllSet } from "@/features/auth/InstructorOnboarding";
import { INSTRUCTOR_HERO } from "@/features/auth/hero";
import { requireInstructorPage } from "@/lib/auth/pages";

export const metadata: Metadata = { title: "You’re all set" };

export default async function DonePage() {
  await requireInstructorPage({ onboarding: true });
  return (
    <AuthLayout {...INSTRUCTOR_HERO}>
      <InstructorAllSet />
    </AuthLayout>
  );
}
