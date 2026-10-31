"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Topbar } from "@/components/learner/Topbar";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ArrowRightIcon, ChevronDownIcon, CloseIcon, ExpandIcon, LockIcon, QuizIcon, TrophyIcon } from "@/components/ui/icons";
import { StarInput } from "@/components/ui/Stars";
import { ProgressBar } from "@/components/ui/Upload";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api-client";

export type PlayerData = {
  courseId: string;
  courseTitle: string;
  instructor: string;
  enrolled: boolean;
  progressPct: number;
  lesson: { id: string; title: string; number: number; videoUrl: string | null; captionsUrl: string | null; writeUp: string | null; positionSeconds: number; completed: boolean };
  prevHref: string | null;
  nextHref: string | null;
  summary: string;
  modules: { id: string; title: string; meta: string; lessons: { id: string; name: string; len: string; done: boolean; locked: boolean }[] }[];
  quiz: { href: string; passed: boolean } | null;
  certificateId: string | null;
  myRating: number;
};

/** Enrolled lesson view: video and/or write-up, course content panel, Q&A tab (Lesson-*.dc.html). */
export function LessonPlayer({ d, tab, view, children }: { d: PlayerData; tab: "content" | "qa"; view: "normal" | "expanded"; children?: ReactNode }) {
  const router = useRouter();
  const toast = useToast();
  const [panel, setPanel] = useState(true);
  const [done, setDone] = useState<Record<string, boolean>>(() => Object.fromEntries(d.modules.flatMap((m) => m.lessons.map((l) => [l.id, l.done]))));
  const [pct, setPct] = useState(d.progressPct);
  const [openMods, setOpenMods] = useState<string[]>(() => d.modules.filter((m) => m.lessons.some((l) => l.id === d.lesson.id)).map((m) => m.id));
  const [showProgress, setShowProgress] = useState(false);
  const [rating, setRating] = useState(d.myRating);
  const video = useRef<HTMLVideoElement>(null);
  const lastSaved = useRef(0);

  const base = `/learn/${d.courseId}/${d.lesson.id}`;

  const save = useCallback(
    async (body: { positionSeconds?: number; completed?: boolean }) => {
      if (!d.enrolled) return null;
      return api<{ progressPct: number; certificateId: string | null }>("/api/learner/progress", { body: { lessonId: d.lesson.id, ...body } }).catch(() => null);
    },
    [d.enrolled, d.lesson.id],
  );

  async function setCompleted(lessonId: string, value: boolean) {
    setDone((s) => ({ ...s, [lessonId]: value }));
    const r = await api<{ progressPct: number; certificateId: string | null }>("/api/learner/progress", { body: { lessonId, completed: value } }).catch(() => null);
    if (!r) {
      setDone((s) => ({ ...s, [lessonId]: !value }));
      return;
    }
    setPct(r.progressPct);
    if (r.certificateId) toast.show({ title: "Course completed!", body: "Your certificate is ready in Certifications." });
    router.refresh();
  }

  // Resume position and periodic save.
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const onMeta = () => {
      if (d.lesson.positionSeconds > 0 && d.lesson.positionSeconds < v.duration - 5) v.currentTime = d.lesson.positionSeconds;
    };
    const onTime = () => {
      if (Math.abs(v.currentTime - lastSaved.current) >= 10) {
        lastSaved.current = v.currentTime;
        void save({ positionSeconds: Math.floor(v.currentTime) });
      }
    };
    const onEnded = () => {
      if (!done[d.lesson.id]) void setCompleted(d.lesson.id, true);
    };
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnded);
    return () => {
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", onEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.lesson.id]);

  // Opening a lesson marks it as the current one.
  useEffect(() => {
    void save({});
  }, [save]);

  const media = (expanded: boolean) => (
    <>
      {d.lesson.videoUrl && (
        <div className={clsx("relative overflow-hidden rounded-card bg-[#2E2A27]", expanded ? "min-h-[560px] flex-1" : "aspect-video")}>
          <video ref={video} src={d.lesson.videoUrl} controls preload="metadata" className="h-full w-full bg-black object-contain">
            {d.lesson.captionsUrl && <track kind="captions" src={d.lesson.captionsUrl} srcLang="en" label="English" default />}
          </video>
          <Link href={expanded ? base : `${base}?view=expanded`} aria-label={expanded ? "Exit full view" : "Expand video"} className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-control bg-white/85 text-ink">
            <ExpandIcon />
          </Link>
        </div>
      )}
      {d.lesson.writeUp && (
        <article className={clsx("relative flex flex-col rounded-card border border-line", expanded ? "mx-auto w-full max-w-[960px] gap-3.5 px-14 py-10" : "gap-2.5 px-6 py-5")}>
          {!d.lesson.videoUrl && (
            <Link href={expanded ? base : `${base}?view=expanded`} aria-label={expanded ? "Exit reading view" : "Expand reading view"} className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-control text-ink-3 hover:bg-surface">
              <ExpandIcon />
            </Link>
          )}
          <h2 className={clsx("m-0 pr-10 font-semibold", expanded ? "text-[26px]" : "text-xl")}>{d.lesson.title}</h2>
          <div className="prose-lesson text-sm leading-[1.7] text-ink-2" dangerouslySetInnerHTML={{ __html: d.lesson.writeUp }} />
          {expanded && d.enrolled && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
              {d.prevHref ? <ButtonLink href={`${d.prevHref}?view=expanded`} variant="outline" size="md" className="h-[42px]">Previous lesson</ButtonLink> : <span />}
              <Button size="md" className={clsx("h-[42px]", done[d.lesson.id] && "bg-success hover:bg-success")} onClick={() => setCompleted(d.lesson.id, !done[d.lesson.id])}>
                {done[d.lesson.id] ? "Completed" : "Mark as complete"}
              </Button>
            </div>
          )}
        </article>
      )}
    </>
  );

  if (view === "expanded") {
    return <div className="-mx-4 -mt-5 flex min-h-[calc(100vh-40px)] flex-col gap-4 p-3 md:-mx-8">{media(true)}</div>;
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Topbar back="/my-courses" />
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-[26px] leading-[1.25] font-semibold">{d.courseTitle}</h1>
          <span className="text-[13px] text-ink-3">Course Instructor: <strong className="font-semibold text-ink">{d.instructor}</strong></span>
        </div>
        {d.enrolled && (
          <div className="relative">
            <button type="button" aria-expanded={showProgress} onClick={() => setShowProgress((s) => !s)} className="flex h-10 items-center gap-1.5 rounded-control border-0 bg-transparent px-2.5 text-[13px] text-ink-2 hover:bg-surface">
              <TrophyIcon className="text-accent" /> Your progress
            </button>
            {showProgress && (
              <div className="absolute right-0 z-20 mt-1 flex w-64 flex-col gap-2 rounded-[10px] border border-line bg-white p-4 shadow-lg">
                <strong className="text-sm">{pct}% complete</strong>
                <ProgressBar value={pct} label="Course progress" />
                <span className="text-xs text-ink-3">{Object.values(done).filter(Boolean).length} of {Object.keys(done).length} lessons done{d.quiz ? (d.quiz.passed ? " · quiz passed" : " · final quiz pending") : ""}.</span>
                {d.certificateId && <Link href={`/certifications/${d.certificateId}`} className="text-[13px] font-semibold">View certificate</Link>}
                <div className="mt-1 flex flex-col gap-1 border-t border-line pt-2.5">
                  <span className="text-xs font-semibold">{rating ? "Your rating" : "Rate this course"}</span>
                  <StarInput
                    value={rating}
                    onChange={async (n) => {
                      const before = rating;
                      setRating(n);
                      const r = await api("/api/learner/ratings", { method: "PUT", body: { courseId: d.courseId, stars: n } }).catch(() => null);
                      if (r) toast.show({ title: "Thanks for rating this course" });
                      else setRating(before);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div role="tablist" aria-label="Course sections" className="grid grid-cols-3 border-b border-line">
        <Link role="tab" aria-selected={false} href={`/courses/${d.courseId}`} className="flex h-11 items-center justify-center border-b-2 border-transparent text-[15px] text-muted no-underline">Overview</Link>
        <Link role="tab" aria-selected={tab === "content"} href={base} className={clsx("flex h-11 items-center justify-center border-b-2 text-[15px] no-underline", tab === "content" ? "border-accent font-medium text-ink" : "border-transparent text-muted")}>Content</Link>
        {d.enrolled ? (
          <Link role="tab" aria-selected={tab === "qa"} href={`${base}?tab=qa`} className={clsx("flex h-11 items-center justify-center border-b-2 text-[15px] no-underline", tab === "qa" ? "border-accent font-medium text-ink" : "border-transparent text-muted")}>Questions and Answers</Link>
        ) : (
          <span role="tab" aria-disabled="true" title="Enroll to join the discussion" className="flex h-11 cursor-not-allowed items-center justify-center gap-1.5 border-b-2 border-transparent text-[15px] text-placeholder"><LockIcon />Questions and Answers</span>
        )}
      </div>

      {tab === "qa" ? (
        children
      ) : (
        <div className="flex flex-wrap items-start gap-5">
          <div className="flex min-w-0 flex-[999_1_420px] flex-col gap-4">
            {!d.enrolled && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-info-border bg-info-tint-2 px-4 py-3 text-[13px] text-info-text">
                You’re watching a free preview.
                <ButtonLink href={`/courses/${d.courseId}`} size="sm">See course options</ButtonLink>
              </div>
            )}
            {media(false)}
            {!d.lesson.videoUrl && !d.lesson.writeUp && <p className="m-0 rounded-card border border-dashed border-line-input p-8 text-center text-[13px] text-ink-3">This lesson has no content yet.</p>}
            {d.enrolled && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-[13px]">
                  <input type="checkbox" checked={!!done[d.lesson.id]} onChange={(e) => setCompleted(d.lesson.id, e.target.checked)} className="accent-primary" />
                  Mark this lesson as complete
                </label>
                {d.nextHref && <ButtonLink href={d.nextHref} size="md">Next <ArrowRightIcon /></ButtonLink>}
              </div>
            )}
            {!panel && <Button variant="outline" size="md" className="h-10 self-start" onClick={() => setPanel(true)}>Show course content</Button>}
          </div>
          {panel && (
            <section aria-labelledby="cc-t" className="flex-[1_1_320px] overflow-hidden rounded-card border border-line">
              <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3.5">
                <div className="flex flex-col gap-1">
                  <h2 id="cc-t" className="m-0 text-base font-semibold">Course Content</h2>
                  <span className="text-xs text-ink-3">{d.summary}</span>
                </div>
                <button type="button" aria-label="Close course content" onClick={() => setPanel(false)} className="flex h-8 w-8 items-center justify-center rounded-control text-ink hover:bg-surface"><CloseIcon /></button>
              </div>
              {d.modules.map((m) => {
                const open = openMods.includes(m.id);
                return (
                  <div key={m.id} className="border-b border-line last:border-b-0">
                    <button type="button" aria-expanded={open} onClick={() => setOpenMods(open ? openMods.filter((x) => x !== m.id) : [...openMods, m.id])} className="flex w-full items-center justify-between gap-2 border-0 bg-surface px-4 py-3 text-left">
                      <span className="flex flex-col gap-1.5"><span className="text-[13px] font-medium">{m.title}</span><span className="text-xs text-ink-3">{m.meta}</span></span>
                      <ChevronDownIcon className={clsx("text-ink-3 transition-transform", open && "rotate-180")} strokeWidth={2} />
                    </button>
                    {open && (
                      <ul className="m-0 list-none px-4 py-1">
                        {m.lessons.map((l) => (
                          <li key={l.id} className={clsx("-mx-4 flex items-start gap-2.5 px-4 py-2", l.id === d.lesson.id && "bg-[#EEEEFB]")}>
                            {d.enrolled ? (
                              <input type="checkbox" checked={!!done[l.id]} onChange={(e) => setCompleted(l.id, e.target.checked)} aria-label={`Mark ${l.name} complete`} className="mt-0.5 accent-primary" />
                            ) : l.locked ? (
                              <LockIcon className="mt-0.5 text-muted" />
                            ) : (
                              <span className="w-[14px]" />
                            )}
                            {l.locked ? (
                              <span className="flex flex-col gap-1 text-[13px] text-muted">{l.name}<span className="text-xs">{l.len}</span></span>
                            ) : (
                              <Link href={`/learn/${d.courseId}/${l.id}`} aria-current={l.id === d.lesson.id ? "page" : undefined} className={clsx("flex flex-col gap-1 text-[13px] no-underline", l.id === d.lesson.id ? "font-semibold text-primary" : "text-ink")}>
                                {l.name}
                                <span className="text-xs font-normal text-muted">{l.len}</span>
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
              {d.quiz && (
                <Link href={d.quiz.href} className="flex items-center gap-2.5 border-t border-line px-4 py-3 text-[13px] font-medium text-ink no-underline hover:bg-surface">
                  <QuizIcon className="text-info-text" /> Final Quiz {d.quiz.passed && <span className="ml-auto text-xs font-semibold text-success">Passed</span>}
                </Link>
              )}
            </section>
          )}
        </div>
      )}
    </>
  );
}
