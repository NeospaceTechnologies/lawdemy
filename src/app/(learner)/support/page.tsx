import type { Metadata } from "next";
import { Topbar } from "@/components/learner/Topbar";
import { SupportForm } from "@/features/account/SupportForm";
import { requireLearnerPage } from "@/lib/auth/pages";
import { LEARNER_SUPPORT_CATEGORIES } from "@/lib/support";

export const metadata: Metadata = { title: "Support" };

export default async function SupportPage() {
  await requireLearnerPage();
  return (
    <>
      <Topbar />
      <SupportForm categories={LEARNER_SUPPORT_CATEGORIES} />
    </>
  );
}
