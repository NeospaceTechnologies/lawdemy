import type { Metadata } from "next";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { LegalCredentialsForm } from "@/features/auth/LearnerOnboarding";
import { LEARNER_HERO } from "@/features/auth/hero";
import { requireLearnerPage } from "@/lib/auth/pages";

export const metadata: Metadata = { title: "Legal credentials" };

export default async function Page() {
  const { profile } = await requireLearnerPage({ onboarding: true });
  return (
    <AuthLayout {...LEARNER_HERO}>
      <LegalCredentialsForm initial={{ isLawyer: profile.isLawyer, callYear: profile.callYear, jurisdictions: profile.jurisdictions, practiceAreas: profile.practiceAreas }} />
    </AuthLayout>
  );
}
