import type { Metadata } from "next";
import { InstructorTopbar } from "@/components/layout/InstructorTopbar";
import { SupportForm } from "@/features/account/SupportForm";
import { db } from "@/lib/db";
import { requireInstructorPage } from "@/lib/auth/pages";
import { INSTRUCTOR_SUPPORT_CATEGORIES } from "@/lib/support";

export const metadata: Metadata = { title: "Support" };

export default async function InstructorSupportPage() {
  const { user } = await requireInstructorPage();
  const unread = await db.notification.count({ where: { userId: user.id, readAt: null } });
  return (
    <>
      <InstructorTopbar unread={unread} />
      <SupportForm variant="instructor" categories={INSTRUCTOR_SUPPORT_CATEGORIES} subtitle="Our friendly team would love to hear from you. We’ll get back to you via email within 24 hours." />
    </>
  );
}
