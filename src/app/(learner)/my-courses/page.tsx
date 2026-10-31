import type { Metadata } from "next";
import Link from "next/link";
import { Topbar } from "@/components/learner/Topbar";
import { CourseCard, CourseGrid } from "@/components/learner/CourseCard";
import { buttonClass } from "@/components/ui/Button";
import { AwardIcon, BookIcon, ClockIcon } from "@/components/ui/icons";
import { ProgressBar } from "@/components/ui/Upload";
import { ExploreSection } from "@/features/discovery/ExploreSection";
import { SectionHeader } from "@/features/discovery/CourseSectionHeader";
import { db } from "@/lib/db";
import { byCategory, recommendedFor } from "@/lib/catalog";
import { getTaxonomy } from "@/lib/taxonomy-store";
import { requireLearnerPage } from "@/lib/auth/pages";
import { continueLearning, learnerStats } from "@/lib/learning";

export const metadata: Metadata = { title: "My Courses" };

/** Consecutive days (ending today or yesterday) with lesson activity. */
async function streakDays(userId: string) {
  const rows = await db.lessonProgress.findMany({ where: { enrollment: { learnerId: userId } }, select: { updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 500 });
  const days = new Set(rows.map((r) => new Date(r.updatedAt.getTime() + 3600_000).toISOString().slice(0, 10)));
  let n = 0;
  const d = new Date(Date.now() + 3600_000);
  if (!days.has(d.toISOString().slice(0, 10))) d.setUTCDate(d.getUTCDate() - 1);
  while (days.has(d.toISOString().slice(0, 10))) {
    n += 1;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return n;
}

export default async function MyCoursesPage() {
  const { user } = await requireLearnerPage();
  const [stats, progress, recommended, explore, streak, notStarted, completed] = await Promise.all([
    learnerStats(user.id),
    continueLearning(user.id, 12),
    recommendedFor(user.id, 3),
    getTaxonomy().then((t) => Promise.all(t.category.map(async (c) => [c, await byCategory(c, 3)] as const))).then(Object.fromEntries),
    streakDays(user.id),
    db.enrollment.findMany({ where: { learnerId: user.id, progressPct: 0, completedAt: null }, orderBy: { createdAt: "desc" }, include: { course: { select: { id: true, title: true, thumbnailAssetId: true } } } }),
    db.enrollment.findMany({ where: { learnerId: user.id, completedAt: { not: null } }, orderBy: { completedAt: "desc" }, include: { course: { select: { id: true, title: true, category: true } }, certificate: { select: { id: true } } } }),
  ]);
  const started = progress.filter((p) => p.pct > 0);
  const subtitle = stats.total === 0
    ? "Enroll in courses and track your progress all in one place."
    : streak > 1 ? `You’re on a ${streak}-day learning streak! Keep it up.` : "Pick up where you left off.";

  return (
    <>
      <Topbar />
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-[30px] font-bold tracking-[-0.01em]">My Courses</h1>
        <p className="m-0 text-sm text-ink-3">{subtitle}</p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-px overflow-hidden rounded-card border border-[#EDE7C7] bg-[#EDE7C7]">
        {[["Total Courses", stats.total], ["Completed Courses", stats.completed], ["In Progress", stats.inProgress], ["Hours Spent This Month", stats.hoursThisMonth]].map(([label, value]) => (
          <div key={label} className="flex flex-col gap-3 bg-cream px-5 py-4">
            <div className="flex items-center gap-2 text-[13px] text-ink-2">
              <span className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-primary bg-white text-primary"><BookIcon /></span>
              {label}
            </div>
            <span className="text-[26px] font-bold">{value}</span>
          </div>
        ))}
      </div>

      <section className="flex flex-col gap-4">
        {notStarted.length === 0 && started.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-card border border-primary bg-info-tint-2 text-primary"><BookIcon size={22} /></span>
            <h2 className="m-0 text-base font-semibold">Nothing to continue just yet</h2>
            <p className="m-0 max-w-[380px] text-[13px] text-ink-3">Your ongoing courses will appear here once you start learning. Browse available courses and pick up where you left off anytime.</p>
          </div>
        ) : (
          <>
          <h2 className="m-0 text-xl font-semibold">Continue Learning</h2>
          <CourseGrid>
            {notStarted.map((e) => (
              <article key={e.id} className="flex flex-col overflow-hidden rounded-card border border-line bg-white shadow-[0_1px_3px_rgba(16,24,40,0.08)]">
                <div className="flex h-[140px] items-end bg-[#8A8D91] bg-cover bg-center p-2.5" style={e.course.thumbnailAssetId ? { backgroundImage: `url(/api/media/${e.course.thumbnailAssetId})` } : undefined}>
                  {!e.course.thumbnailAssetId && <span className="text-[11px] text-white">[Course image]</span>}
                </div>
                <div className="flex flex-1 flex-col gap-3 p-3">
                  <h3 className="m-0 text-[15px] leading-[1.35] font-semibold">{e.course.title}</h3>
                  <Link href={`/learn/${e.course.id}`} className={buttonClass("primary", "md", "mt-auto h-10")}>Start Course</Link>
                </div>
              </article>
            ))}
            {started.map((p) => (
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
          </>
        )}
      </section>

      {completed.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="m-0 text-xl font-semibold">Completed</h2>
          <ul className="m-0 flex list-none flex-col divide-y divide-line rounded-card border border-line p-0">
            {completed.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <Link href={`/learn/${e.course.id}`} className="text-sm font-medium text-ink no-underline hover:underline">{e.course.title}</Link>
                  <span className="text-xs text-muted">{e.course.category}</span>
                </div>
                {e.certificate && (
                  <Link href={`/certifications/${e.certificate.id}`} className="inline-flex items-center gap-1.5 text-[13px] font-semibold"><AwardIcon />View certificate</Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <ExploreSection byCategory={explore} />
      <section className="flex flex-col gap-4">
        <SectionHeader title="Recommended Courses for you" href="/recommended" />
        <CourseGrid>{recommended.map((c) => <CourseCard key={c.id} c={c} />)}</CourseGrid>
      </section>
    </>
  );
}
