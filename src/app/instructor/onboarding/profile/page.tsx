import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { ProfileForm } from "@/features/auth/InstructorOnboarding";
import { INSTRUCTOR_HERO } from "@/features/auth/hero";
import { requireInstructorPage } from "@/lib/auth/pages";

export const metadata: Metadata = { title: "Your instructor profile" };

export default async function ProfilePage() {
  const { user, profile } = await requireInstructorPage({ onboarding: true });
  if (!profile.professionalTitle) redirect("/instructor/onboarding");
  return (
    <AuthLayout {...INSTRUCTOR_HERO}>
      <ProfileForm initial={{ bio: profile.bio, photoUrl: user.photoAssetId ? `/api/media/${user.photoAssetId}` : null, links: (profile.links ?? {}) as Record<string, string> }} />
    </AuthLayout>
  );
}
