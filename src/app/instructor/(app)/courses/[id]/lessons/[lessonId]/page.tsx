import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonPreview } from "@/features/instructor/LessonPreview";
import { requireInstructorPage } from "@/lib/auth/pages";
import { EDITABLE_STATUSES, findOwnedCourse, toDraft } from "@/lib/course/repository";

export const metadata: Metadata = { title: "Lesson preview" };

export default async function LessonPreviewPage({ params, searchParams }: { params: Promise<{ id: string; lessonId: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { user } = await requireInstructorPage();
  const { id, lessonId } = await params;
  const course = await findOwnedCourse(id, user.id);
  if (!course) notFound();
  const draft = toDraft(course);
  if (!draft.modules.some((m) => m.lessons.some((l) => l.id === lessonId))) notFound();
  return <LessonPreview courseId={id} draft={draft} lessonId={lessonId} editable={EDITABLE_STATUSES.includes(course.status)} initialTab={(await searchParams).tab === "text" ? "text" : "video"} />;
}
