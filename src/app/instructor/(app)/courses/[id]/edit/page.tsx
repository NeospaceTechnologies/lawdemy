import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { COURSE_STATUS_LABEL, StatusBadge } from "@/components/ui/StatusBadge";
import { CourseWizard } from "@/features/course-wizard/CourseWizard";
import { getCurrentUser } from "@/lib/auth/session";
import { EDITABLE_STATUSES, findOwnedCourse, toDraft } from "@/lib/course/repository";
import { todayInWAT } from "@/lib/course/rules";

export const metadata: Metadata = { title: "Edit course" };

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const user = (await getCurrentUser("INSTRUCTOR"))!;
  const course = await findOwnedCourse((await params).id, user.id);
  if (!course) notFound();

  // Under Review, Live and Archived courses are locked (PRD 7.2).
  if (!EDITABLE_STATUSES.includes(course.status)) {
    return (
      <div className="flex flex-col items-start gap-3">
        <StatusBadge status={COURSE_STATUS_LABEL[course.status]} />
        <h1 className="m-0 text-2xl font-bold">{course.title}</h1>
        <p className="m-0 text-sm text-ink-3">
          This course can’t be edited while it is {COURSE_STATUS_LABEL[course.status].toLowerCase()}.
        </p>
        <ButtonLink href="/instructor/dashboard" variant="outline" size="md">Back to dashboard</ButtonLink>
      </div>
    );
  }
  return <CourseWizard courseId={course.id} initial={toDraft(course)} today={todayInWAT()} />;
}
