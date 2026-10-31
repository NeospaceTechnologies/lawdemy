import type { Metadata } from "next";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { BackgroundForm } from "@/features/auth/InstructorOnboarding";
import { INSTRUCTOR_HERO } from "@/features/auth/hero";
import { requireInstructorPage } from "@/lib/auth/pages";

export const metadata: Metadata = { title: "Your legal background" };

export default async function BackgroundPage() {
  const { profile } = await requireInstructorPage({ onboarding: true });
  return (
    <AuthLayout {...INSTRUCTOR_HERO}>
      <BackgroundForm initial={{ professionalTitle: profile.professionalTitle, yearsExperience: profile.yearsExperience, jurisdictions: profile.jurisdictions, practiceAreas: profile.practiceAreas }} />
    </AuthLayout>
  );
}
