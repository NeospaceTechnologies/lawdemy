import type { Metadata } from "next";
import Link from "next/link";
import { InstructorTopbar } from "@/components/layout/InstructorTopbar";
import { buttonClass } from "@/components/ui/Button";
import { BookIcon, ChatIcon, PlusIcon } from "@/components/ui/icons";
import { DashboardCourses } from "@/features/instructor/DashboardCourses";
import { db } from "@/lib/db";
import { formatNaira } from "@/lib/format";
import { requireInstructorPage } from "@/lib/auth/pages";
import { courseRows, instructorStats, recentQuestions } from "@/lib/instructor";

export const metadata: Metadata = { title: "Dashboard" };

export default async function InstructorDashboardPage() {
  const { user, profile } = await requireInstructorPage();
  const [stats, rows, questions, unread, toMark] = await Promise.all([
    instructorStats(user.id),
    courseRows(user.id),
    recentQuestions(user.id),
    db.notification.count({ where: { userId: user.id, readAt: null } }),
    db.quizAttempt.count({ where: { status: "awaiting_review", quiz: { course: { instructorId: user.id } } } }),
  ]);
  const firstTime = rows.length === 0;
  const tiles = [
    ["Total Courses", String(stats.courses), "#17B26A"],
    ["Total Learners", stats.learners.toLocaleString("en-NG"), "#101828"],
    ["Total Earnings", formatNaira(stats.earningsKobo), "#D92D20"],
    ["Average Rating", stats.rating ?? "—", "#7F56D9"],
    ["Questions", String(stats.openQuestions), "#F79009"],
  ];
  const profileIncomplete = !profile.bio || !user.photoAssetId;

  return (
    <>
      <InstructorTopbar unread={unread} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-[28px] font-bold">Welcome, {user.firstName}</h1>
          <p className="m-0 text-sm text-ink-3">{firstTime ? "Ready to share your legal expertise?" : "Here’s how your courses are doing."}</p>
        </div>
        <Link href="/instructor/courses/new" className={buttonClass("primary", "md")}><PlusIcon size={14} /> Create Course</Link>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
        {tiles.map(([label, value, color]) => (
          <div key={label} className="overflow-hidden rounded-[10px] border border-line bg-white">
            <div className="h-[5px]" style={{ background: color }} />
            <div className="flex flex-col gap-2 px-4 py-3.5"><span className="text-xs text-ink-3">{label}</span><strong className="text-[22px]">{value}</strong></div>
          </div>
        ))}
      </div>
      {profileIncomplete && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-[#6D28D9] px-5 py-4 text-white">
          <div className="flex flex-col gap-1"><strong className="text-[15px]">Complete your instructor profile</strong><span className="text-[13px] text-[#EDE9FE]">A complete profile helps learners trust your courses.</span></div>
          <Link href="/instructor/settings" className="inline-flex h-[38px] items-center rounded-control bg-white px-3.5 text-[13px] font-semibold text-info-text no-underline">Update Profile</Link>
        </div>
      )}

      {toMark > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-[#FEDF89] bg-[#FFFAEB] px-5 py-4">
          <div className="flex flex-col gap-1"><strong className="text-[15px]">{toMark} quiz {toMark === 1 ? "attempt needs" : "attempts need"} your marks</strong><span className="text-[13px] text-ink-3">Learners get their final score and certificate once you mark their written answers.</span></div>
          <Link href="/instructor/grading" className="inline-flex h-[38px] items-center rounded-control bg-primary px-3.5 text-[13px] font-semibold text-white no-underline hover:text-white">Mark answers</Link>
        </div>
      )}

      {firstTime ? (
        <section className="flex flex-col gap-4">
          <h2 className="m-0 text-lg font-semibold">My Courses</h2>
          <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-line-input px-6 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-card bg-info-tint text-info-text"><BookIcon size={22} /></span>
            <h3 className="m-0 text-base font-semibold">Share your expertise with the world</h3>
            <p className="m-0 max-w-[420px] text-[13px] text-ink-3">You haven’t created any courses yet. Start building your first course and reach learners everywhere.</p>
            <Link href="/instructor/courses/new" className={buttonClass("primary", "md", "mt-2")}>Create Course</Link>
          </div>
        </section>
      ) : (
        <DashboardCourses rows={rows} />
      )}

      <section className="flex flex-col gap-4">
        <h2 className="m-0 text-lg font-semibold">Recent Questions from Learners</h2>
        {questions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-line-input px-6 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-card bg-info-tint text-info-text"><ChatIcon size={22} /></span>
            <h3 className="m-0 text-base font-semibold">No Questions From Learners Yet</h3>
            <p className="m-0 max-w-[420px] text-[13px] text-ink-3">When learners ask questions on your courses, they’ll show up here so you can respond.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-card border border-line">
            <table className="w-full min-w-[760px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-surface text-left text-xs text-ink-3">
                  {["Learner", "Question", "Course", "Asked"].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Action</span></th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q.id} className="border-t border-line">
                    <td className="px-4 py-3"><span className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E0E7FF] text-[10px] font-bold text-[#3730A3]">{q.initials}</span>{q.name}</span></td>
                    <td className="px-4 py-3">{q.text}</td>
                    <td className="px-4 py-3 text-ink-3">{q.course}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-3">{q.when}</td>
                    <td className="px-4 py-3 text-right"><Link href={`/instructor/questions/${q.id}`} className="font-semibold">Reply</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
