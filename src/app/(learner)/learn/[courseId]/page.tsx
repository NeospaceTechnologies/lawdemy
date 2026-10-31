import { notFound, redirect } from "next/navigation";
import { requireLearnerPage } from "@/lib/auth/pages";
import { resumeLesson, activeEnrollment } from "@/lib/learning";

// /learn/:course → resume where the learner left off.
export default async function ResumePage({ params, searchParams }: { params: Promise<{ courseId: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { user } = await requireLearnerPage();
  const courseId = (await params).courseId;
  const e = await activeEnrollment(courseId, user.id);
  if (!e) redirect(`/courses/${courseId}`);
  const r = await resumeLesson(e.id, courseId);
  if (!r.lesson) notFound();
  const tab = (await searchParams).tab;
  redirect(`/learn/${courseId}/${r.lesson.id}${tab ? `?tab=${tab}` : ""}`);
}
