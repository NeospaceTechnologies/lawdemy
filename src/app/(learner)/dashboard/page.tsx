import type { Metadata } from "next";
import Link from "next/link";
import { Topbar } from "@/components/learner/Topbar";
import { CourseCard, CourseGrid } from "@/components/learner/CourseCard";
import { buttonClass } from "@/components/ui/Button";
import { BookIcon, ClockIcon, ContinueIcon } from "@/components/ui/icons";
import { ProgressBar } from "@/components/ui/Upload";
import { ExploreSection } from "@/features/discovery/ExploreSection";
import { SectionHeader } from "@/features/discovery/CourseSectionHeader";
import { byCategory, recommendedFor } from "@/lib/catalog";
import { getTaxonomy } from "@/lib/taxonomy-store";
import { requireLearnerPage } from "@/lib/auth/pages";
import { continueLearning, learnerStats } from "@/lib/learning";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { user } = await requireLearnerPage();
  const [stats, progress, recommended, explore] = await Promise.all([
    learnerStats(user.id),
    continueLearning(user.id, 3),
    recommendedFor(user.id, 3),
    getTaxonomy().then((t) => Promise.all(t.category.map(async (c) => [c, await byCategory(c, 3)] as const))).then(Object.fromEntries),
  ]);
  const firstTime = stats.total === 0;

  return (
    <>
      <Topbar />
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-[30px] font-bold tracking-[-0.01em]">Welcome, {user.firstName}</h1>
        <p className="m-0 text-sm text-ink-3">Ready to dive into legal knowledge tailored to you?</p>
      </div>

      {firstTime ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-5">
          <section className="flex items-center gap-5 rounded-card border border-[#EDE7C7] bg-cream p-6">
            <div className="flex h-[72px] w-[72px] flex-none items-center justify-center rounded-[14px] border-[1.5px] border-primary bg-white text-primary"><BookIcon size={32} /></div>
            <div className="flex flex-col items-start gap-2">
              <h2 className="m-0 text-xl font-bold">No Courses yet</h2>
              <p className="m-0 text-[13px] text-ink-3">Start by enrolling for a course.</p>
              <Link href="/courses" className={buttonClass("primary", "md", "h-[38px]")}>Browse Courses <ContinueIcon /></Link>
            </div>
          </section>
          <section className="flex items-center justify-between gap-4 rounded-card border border-line bg-[#FAF8F2] p-6">
            <div className="flex flex-col items-start gap-2">
              <h2 className="m-0 text-xl font-bold">Our community</h2>
              <p className="m-0 max-w-[260px] text-[13px] text-ink-3">Join the conversation with fellow learners in our legal community.</p>
              <Link href="/community" className={buttonClass("primary", "md", "h-[38px]")}>Join Community <ContinueIcon /></Link>
            </div>
            <div className="grid grid-cols-[repeat(2,44px)] gap-2" aria-hidden="true">
              {["#BFE6D2", "#C9D7F5", "#F6D9B8", "#DCD3F7"].map((c) => (
                <span key={c} className="h-11 w-11 rounded-full" style={{ background: c }} />
              ))}
            </div>
          </section>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-px overflow-hidden rounded-card border border-[#EDE7C7] bg-[#EDE7C7]">
            {[
              ["Total Courses", stats.total],
              ["Completed Courses", stats.completed],
              ["In Progress", stats.inProgress],
              ["Hours Spent This Month", stats.hoursThisMonth],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col gap-3 bg-cream px-5 py-4">
                <div className="flex items-center gap-2 text-[13px] text-ink-2">
                  <span className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-primary bg-white text-primary"><BookIcon /></span>
                  {label}
                </div>
                <span className="text-[26px] font-bold">{value}</span>
              </div>
            ))}
          </div>
          {progress.length > 0 && (
            <section className="flex flex-col gap-4">
              <SectionHeader title="Continue Learning" href="/my-courses" />
              <CourseGrid>
                {progress.map((p) => (
                  <Link key={p.enrollmentId} href={p.href} className="flex flex-col overflow-hidden rounded-card border border-line bg-white text-ink no-underline shadow-[0_1px_3px_rgba(16,24,40,0.08)] hover:text-ink hover:shadow-md">
                    <div className="flex h-[140px] items-end bg-[#8A8D91] bg-cover bg-center p-2.5" style={p.thumbnailUrl ? { backgroundImage: `url(${p.thumbnailUrl})` } : undefined}>
                      {!p.thumbnailUrl && <span className="text-[11px] text-white">[Course image]</span>}
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-3">
                      <span className="text-[11px] text-muted">{p.courseTitle}</span>
                      <h3 className="m-0 text-[15px] leading-[1.35] font-semibold">{p.lessonLabel}</h3>
                      <span className="mt-auto flex items-center gap-1.5 text-xs text-ink-3"><ClockIcon size={12} />{p.leftLabel}</span>
                      <ProgressBar value={p.pct} label={`${p.courseTitle} progress`} />
                    </div>
                  </Link>
                ))}
              </CourseGrid>
            </section>
          )}
        </>
      )}

      <section className="flex flex-col gap-4">
        <SectionHeader title="Recommended Courses for you" href="/recommended" />
        <CourseGrid>{recommended.map((c) => <CourseCard key={c.id} c={c} />)}</CourseGrid>
      </section>

      <ExploreSection byCategory={explore} />
    </>
  );
}
