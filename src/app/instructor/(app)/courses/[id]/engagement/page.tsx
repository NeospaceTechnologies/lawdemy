import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { COURSE_STATUS_LABEL, StatusBadge } from "@/components/ui/StatusBadge";
import { Engagement } from "@/features/instructor/Engagement";
import { db } from "@/lib/db";
import { requireInstructorPage } from "@/lib/auth/pages";
import { courseEngagement } from "@/lib/engagement";

export const metadata: Metadata = { title: "Course engagement" };

export default async function EngagementPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireInstructorPage();
  const id = (await params).id;
  const course = await db.course.findFirst({ where: { id, instructorId: user.id, deletedAt: null }, select: { id: true, title: true, status: true } });
  if (!course) notFound();
  const data = await courseEngagement(id);
  if (!data) notFound();
  const tab = (on: boolean) => clsx("flex h-11 items-center justify-center border-b-2 text-sm no-underline", on ? "border-accent font-semibold text-ink" : "border-transparent font-medium text-muted");
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <Link href="/instructor/courses" aria-label="Back to My Courses" className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-2"><ChevronLeftIcon /></Link>
        <span className="flex items-center gap-1.5 text-xs text-ink-3">Status <StatusBadge status={COURSE_STATUS_LABEL[course.status]} /></span>
      </div>
      <h1 className="m-0 text-[26px] font-semibold">{course.title}</h1>
      <div role="tablist" aria-label="Course sections" className="grid grid-cols-3 border-b border-line">
        <Link role="tab" aria-selected={false} href={`/instructor/courses/${id}`} className={tab(false)}>Overview</Link>
        <Link role="tab" aria-selected={false} href={`/instructor/courses/${id}?tab=content`} className={tab(false)}>Content</Link>
        <span role="tab" aria-selected="true" className={tab(true)}>Engagement</span>
      </div>
      <Engagement data={data} quizTitle={data.quizTitle} />
    </>
  );
}
