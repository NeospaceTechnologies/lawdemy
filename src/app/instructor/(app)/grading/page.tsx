import type { Metadata } from "next";
import Link from "next/link";
import { InstructorTopbar } from "@/components/layout/InstructorTopbar";
import { EmptyState } from "@/components/ui/EmptyState";
import { db } from "@/lib/db";
import { requireInstructorPage } from "@/lib/auth/pages";
import { gradingQueue } from "@/lib/grading";

export const metadata: Metadata = { title: "Quiz answers to mark" };

// Attempts with written answers waiting for the instructor, oldest first.
export default async function GradingQueuePage() {
  const { user } = await requireInstructorPage();
  const [rows, unread] = await Promise.all([gradingQueue(user.id), db.notification.count({ where: { userId: user.id, readAt: null } })]);
  return (
    <>
      <InstructorTopbar unread={unread} />
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-[30px] font-bold">Quiz answers to mark</h1>
        <p className="m-0 text-sm text-ink-3">Short-answer and upload questions need your mark before learners get their final score and certificate.</p>
      </div>
      {rows.length === 0 ? (
        <EmptyState title="You’re all caught up" body="New written answers will appear here and in your notifications." />
      ) : (
        <div className="overflow-x-auto rounded-card border border-line">
          <table className="w-full border-collapse text-[13px]">
            <thead><tr className="bg-surface text-left text-xs text-ink-3">{["Learner", "Course", "Submitted", ""].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="px-4 py-3 font-medium">{r.learner.firstName} {r.learner.lastName}</td>
                  <td className="px-4 py-3">{r.quiz.course.title}</td>
                  <td className="px-4 py-3 text-ink-3">{r.submittedAt.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" })}</td>
                  <td className="px-4 py-3 text-right"><Link href={`/instructor/grading/${r.id}`} className="font-semibold">Mark answers</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
