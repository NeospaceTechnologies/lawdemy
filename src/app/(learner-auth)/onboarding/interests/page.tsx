import type { Metadata } from "next";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { InterestsForm } from "@/features/auth/LearnerOnboarding";
import { LEARNER_HERO } from "@/features/auth/hero";
import { requireLearnerPage } from "@/lib/auth/pages";

export const metadata: Metadata = { title: "Areas of interest" };

export default async function Page() {
  const { profile } = await requireLearnerPage({ onboarding: true });
  return (
    <AuthLayout {...LEARNER_HERO}>
      <InterestsForm initial={profile.interests} />
    </AuthLayout>
  );
}
