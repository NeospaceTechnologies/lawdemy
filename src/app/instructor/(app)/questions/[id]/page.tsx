import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReplyQuestion } from "@/features/instructor/ReplyQuestion";
import { db } from "@/lib/db";
import { requireInstructorPage } from "@/lib/auth/pages";
import { loadCourseQuestions } from "@/lib/discussions";

export const metadata: Metadata = { title: "Reply to question" };

export default async function InstructorQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireInstructorPage();
  const id = (await params).id;
  const q = await db.question.findFirst({ where: { id, deletedAt: null, lesson: { module: { course: { instructorId: user.id } } } }, select: { lesson: { select: { module: { select: { course: { select: { id: true, title: true } } } } } } } });
  if (!q) notFound();
  const course = q.lesson.module.course;
  const data = await loadCourseQuestions(course.id, user.id, id);
  if (!data.thread) notFound();
  return (
    <>
      <h1 className="m-0 text-[26px] font-semibold">{course.title}</h1>
      <div aria-hidden="true" className="flex flex-col gap-3">
        <div className="h-28 rounded-card bg-surface" />
        <div className="h-48 rounded-card bg-surface" />
      </div>
      <ReplyQuestion question={data.thread.question} replies={data.thread.replies} closeHref={`/instructor/courses/${course.id}/engagement`} />
    </>
  );
}
