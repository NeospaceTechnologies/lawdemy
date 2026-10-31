import type { Metadata } from "next";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { ToastViewport } from "@/components/ui/Toast";
import { VerifyResult } from "@/features/auth/SignUpForms";
import { LEARNER_HERO } from "@/features/auth/hero";

export const metadata: Metadata = { title: "Email verification" };

export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string; email?: string }> }) {
  const { status, email } = await searchParams;
  return (
    <AuthLayout {...LEARNER_HERO}>
      <ToastViewport className="mb-4" />
      <VerifyResult status={status === "verified" ? "verified" : "expired"} email={email} role="learner" next="/onboarding/legal-credentials" />
    </AuthLayout>
  );
}
