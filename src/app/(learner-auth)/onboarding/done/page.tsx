import type { Metadata } from "next";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { AllSetForm } from "@/features/auth/LearnerOnboarding";
import { LEARNER_HERO } from "@/features/auth/hero";
import { requireLearnerPage } from "@/lib/auth/pages";

export const metadata: Metadata = { title: "You’re all set" };

export default async function Page() {
  await requireLearnerPage({ onboarding: true });
  return (
    <AuthLayout {...LEARNER_HERO}>
      <AllSetForm />
    </AuthLayout>
  );
}
