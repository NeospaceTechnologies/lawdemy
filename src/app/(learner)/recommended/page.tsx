import type { Metadata } from "next";
import { Topbar } from "@/components/learner/Topbar";
import { CourseCard, CourseGrid } from "@/components/learner/CourseCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { recommendedFor } from "@/lib/catalog";
import { requireLearnerPage } from "@/lib/auth/pages";

export const metadata: Metadata = { title: "Recommended courses" };

export default async function RecommendedPage() {
  const { user } = await requireLearnerPage();
  const cards = await recommendedFor(user.id, 24);
  return (
    <>
      <Topbar back="/dashboard" />
      <h1 className="m-0 text-[28px] font-bold tracking-[-0.01em]">Recommended Courses</h1>
      {cards.length ? <CourseGrid>{cards.map((c) => <CourseCard key={c.id} c={c} />)}</CourseGrid> : <EmptyState dashed body="No recommendations yet. Explore all courses instead." />}
    </>
  );
}
