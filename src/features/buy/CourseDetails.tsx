"use client";
import { RatingSummary } from "@/components/ui/Stars";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useLearner } from "@/components/learner/LearnerContext";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { AwardIcon, BookIcon, CalendarIcon, ChevronDownIcon, HeartIcon, LevelIcon, LockIcon, PlayIcon, QuizIcon, TimerIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/Toast";
import { api, ApiClientError } from "@/lib/api-client";

export type DetailsData = {
  id: string;
  title: string;
  instructor: string;
  initials: string;
  bio: string | null;
  description: string;
  outcomes: string[];
  level: string;
  updatedAt: string;
  rating: { avg: number; count: number } | null;
  hasCertificate: boolean;
  isFree: boolean;
  priceLabel: string;
  oldLabel: string | null;
  daysLeft: number | null;
  lessonCount: number;
  quizCount: number;
  totalLabel: string;
  trailer: { videoUrl: string | null; lessonId: string } | null;
  modules: { id: string; title: string; meta: string; lessons: { id: string; name: string; len: string; preview: boolean }[] }[];
  thumbnailUrl: string | null;
  state: { enrolled: boolean; inCart: boolean; inWishlist: boolean; resumeHref: string | null };
};

/** Non-enrolled course details: Overview and Content tabs (CourseDetails*.dc.html). */
export function CourseDetails({ d, initialTab }: { d: DetailsData; initialTab: "overview" | "content" }) {
  const router = useRouter();
  const toast = useToast();
  const { setCounts } = useLearner();
  const [tab, setTab] = useState(initialTab);
  const [more, setMore] = useState(false);
  const [open, setOpen] = useState<string[]>(d.modules.slice(0, 1).map((m) => m.id));
  const [review, setReview] = useState(false);
  const [inCart, setInCart] = useState(d.state.inCart);
  const [wished, setWished] = useState(d.state.inWishlist);
  const [busy, setBusy] = useState<"" | "cart" | "buy" | "free">("");
  const [playing, setPlaying] = useState(false);

  async function addToCart(silent = false) {
    if (inCart) return true;
    try {
      const r = await api<{ count: number }>("/api/learner/cart", { body: { courseId: d.id } });
      setInCart(true);
      setCounts({ cart: r.count });
      if (!silent) toast.show({ title: "Course added to cart", body: "You can proceed to checkout or keep exploring." });
      return true;
    } catch (err) {
      toast.show({ tone: "error", title: "Couldn’t add to cart", body: err instanceof ApiClientError ? err.message : undefined });
      return false;
    }
  }

  async function buy() {
    setBusy("buy");
    if (await addToCart(true)) setReview(true);
    setBusy("");
  }

  async function enrolFree() {
    setBusy("free");
    try {
      await api("/api/learner/enroll-free", { body: { courseId: d.id } });
      toast.show({ title: "You’re enrolled!", body: "Start learning right away." });
      router.push(`/learn/${d.id}`);
      router.refresh();
    } catch (err) {
      toast.show({ tone: "error", title: "Couldn’t enrol", body: err instanceof ApiClientError ? err.message : undefined });
      setBusy("");
    }
  }

  async function toggleWish() {
    const next = !wished;
    setWished(next);
    try {
      if (next) await api("/api/learner/wishlist", { body: { courseId: d.id } });
      else await api(`/api/learner/wishlist/${d.id}`, { method: "DELETE" });
      toast.show({ title: next ? "Added to wishlist" : "Removed from wishlist", body: next ? "You can find this course in your wishlist." : undefined });
    } catch {
      setWished(!next);
    }
  }

  const tabCls = (on: boolean) =>
    clsx("flex h-11 items-center justify-center gap-1.5 border-0 border-b-2 bg-transparent text-[15px]", on ? "border-accent font-medium text-ink" : "border-transparent text-muted");
  const allOpen = open.length === d.modules.length;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex max-w-[640px] flex-col gap-1.5">
          {d.daysLeft !== null && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-danger-text">
              <TimerIcon />
              {d.daysLeft <= 1 ? "1 day" : `${d.daysLeft} days`} left at this price!
            </span>
          )}
          <h1 className="m-0 text-[30px] leading-[1.2] font-semibold tracking-[-0.01em]">{d.title}</h1>
          <span className="text-[13px] text-ink-3">Course Instructor: <strong className="font-semibold text-ink">{d.instructor}</strong></span>
        </div>
        <div className="flex items-center gap-2.5">
          <button type="button" aria-pressed={wished} aria-label={wished ? "Remove from wishlist" : "Add to wishlist"} onClick={toggleWish} className="flex h-11 w-11 items-center justify-center rounded-control border border-line-input text-primary">
            <HeartIcon size={18} filled={wished} />
          </button>
          {d.state.enrolled ? (
            <ButtonLink href={d.state.resumeHref ?? `/learn/${d.id}`}>Go to Course</ButtonLink>
          ) : d.isFree ? (
            <Button onClick={enrolFree} busy={busy === "free"} busyLabel="Enrolling…">Enrol for Free</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => addToCart()} disabled={inCart} busy={busy === "cart"}>{inCart ? "In cart" : "Add to cart"}</Button>
              <Button onClick={buy} busy={busy === "buy"} busyLabel="Please wait…">Buy {d.priceLabel}</Button>
            </>
          )}
        </div>
      </div>

      <div role="tablist" aria-label="Course sections" className="grid grid-cols-3 border-b border-line">
        <button type="button" role="tab" aria-selected={tab === "overview"} onClick={() => setTab("overview")} className={tabCls(tab === "overview")}>Overview</button>
        <button type="button" role="tab" aria-selected={tab === "content"} onClick={() => setTab("content")} className={tabCls(tab === "content")}>Content</button>
        {d.state.enrolled ? (
          <Link role="tab" aria-selected={false} href={`/learn/${d.id}?tab=qa`} className={clsx(tabCls(false), "no-underline")}>Questions and Answers</Link>
        ) : (
          <button type="button" role="tab" aria-disabled="true" title="Enroll to join the discussion" className="flex h-11 cursor-not-allowed items-center justify-center gap-1.5 border-0 border-b-2 border-transparent bg-transparent text-[15px] text-placeholder">
            <LockIcon />
            Questions and Answers
          </button>
        )}
      </div>

      <div className="relative flex aspect-[16/7] items-center justify-center overflow-hidden rounded-card bg-[#2E2A27] bg-cover bg-center" style={d.thumbnailUrl && !playing ? { backgroundImage: `url(${d.thumbnailUrl})` } : undefined}>
        {playing && d.trailer?.videoUrl ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={d.trailer.videoUrl} controls autoPlay className="h-full w-full bg-black object-contain" />
        ) : (
          <>
            {!d.thumbnailUrl && <span className="absolute top-3 left-3.5 text-xs text-[#E4D9CE]">[Course trailer]</span>}
            {d.trailer &&
              (d.trailer.videoUrl ? (
                <button type="button" aria-label="Play course trailer" onClick={() => setPlaying(true)} className="flex h-14 w-14 items-center justify-center rounded-full border-0 bg-white/85">
                  <PlayIcon />
                </button>
              ) : (
                <Link href={`/learn/${d.id}/${d.trailer.lessonId}`} aria-label="Open preview lesson" className="flex h-14 w-14 items-center justify-center rounded-full bg-white/85">
                  <PlayIcon />
                </Link>
              ))}
          </>
        )}
      </div>

      {tab === "overview" ? (
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap gap-8">
            <div className="flex flex-[999_1_420px] flex-col gap-2">
              <h2 className="m-0 text-lg font-semibold">{d.title}</h2>
              <span className="text-[13px] text-ink-3">Course Instructor: <strong className="font-semibold text-ink">{d.instructor}</strong></span>
              {(more ? d.description.split("\n\n") : d.description.split("\n\n").slice(0, 1)).map((p, i) => (
                <p key={i} className="m-0 mt-1 text-sm leading-[1.65] text-ink-2">{p}</p>
              ))}
              {more && d.bio && <p className="m-0 text-sm leading-[1.65] text-ink-2"><strong>About the instructor:</strong> {d.bio}</p>}
              <button type="button" onClick={() => setMore((m) => !m)} className="self-start border-0 bg-transparent py-1 text-[13px] font-semibold text-primary underline">
                {more ? "Show less" : "Show more"}
              </button>
            </div>
            <div className="flex flex-[1_1_240px] flex-col gap-2.5">
              <h2 className="m-0 text-lg font-semibold">Course Summary</h2>
              <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[13px] text-ink-2">
                <li className="flex items-center gap-2"><BookIcon />{d.lessonCount} Lessons <span className="text-muted">({d.totalLabel})</span></li>
                <li className="flex items-center gap-2"><QuizIcon />{d.quizCount} {d.quizCount === 1 ? "Quiz" : "Quizzes"}</li>
                {d.hasCertificate && <li className="flex items-center gap-2"><AwardIcon />Certificate of completion</li>}
                <li className="flex items-center gap-2"><LevelIcon size={14} />Level: {d.level}</li>
                <li className="flex items-center gap-2"><CalendarIcon />Last Updated: {d.updatedAt}</li>
                {d.rating && <li className="flex items-center gap-2"><RatingSummary avg={d.rating.avg} count={d.rating.count} className="text-[13px]" /></li>}
              </ul>
            </div>
          </div>
          {d.outcomes.length > 0 && (
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="m-0 text-xl font-semibold">What You’ll Learn in This Course</h2>
                <button type="button" onClick={() => setTab("content")} className="border-0 bg-transparent text-[13px] font-semibold text-primary underline">See all</button>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
                {d.modules.slice(0, 4).map((m, i) => (
                  <article key={m.id} className="overflow-hidden rounded-card border border-line bg-white shadow-[0_1px_3px_rgba(16,24,40,0.08)]">
                    <div className="flex h-[140px] items-end bg-[#2B2F36] p-2.5"><span className="text-[11px] text-line-input">Module {i + 1}</span></div>
                    <div className="flex flex-col gap-2.5 p-3">
                      <h3 className="m-0 text-sm leading-[1.4] font-medium">{d.outcomes[i] ?? m.title}</h3>
                      <span className="flex items-center gap-2 text-xs text-ink-3">
                        <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#FDEAD7] text-[9px] font-bold text-warning-text">{d.initials}</span>
                        {d.instructor}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <section className="flex flex-col gap-3.5">
          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="m-0 text-xl font-medium">Course Content</h2>
              <span className="text-xs text-ink-3">{d.modules.length} Modules • {d.lessonCount} Lectures • {d.totalLabel} total length</span>
            </div>
            <button type="button" onClick={() => setOpen(allOpen ? [] : d.modules.map((m) => m.id))} className="border-0 bg-transparent py-1.5 text-[13px] font-semibold text-primary">
              {allOpen ? "Collapse All" : "Expand All"}
            </button>
          </div>
          <div className="flex flex-col border-t border-line">
            {d.modules.map((m) => {
              const isOpen = open.includes(m.id);
              return (
                <div key={m.id} className="border-b border-line">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? open.filter((x) => x !== m.id) : [...open, m.id])}
                    className={clsx("flex w-full items-center justify-between gap-3 border-0 px-4 py-3.5 text-left text-ink", isOpen ? "bg-surface" : "bg-white")}
                  >
                    <span className="flex flex-col gap-2"><span className="text-sm font-medium">{m.title}</span><span className="text-xs text-ink-3">{m.meta}</span></span>
                    <ChevronDownIcon className={clsx("text-ink-2 transition-transform", isOpen && "rotate-180")} strokeWidth={2} />
                  </button>
                  {isOpen && (
                    <ul className="m-0 flex list-none flex-col px-4 pt-1 pb-3">
                      {m.lessons.map((l) => (
                        <li key={l.id} className="flex items-start justify-between gap-3 py-2.5">
                          <span className="flex items-start gap-2.5 text-[13px] text-ink-2">
                            <input type="checkbox" disabled aria-label="Not started" className="mt-0.5 h-3.5 w-3.5" />
                            <span className="flex flex-col gap-1.5">{l.name}<span className="text-xs text-muted">{l.len}</span></span>
                          </span>
                          {l.preview && <Link href={`/learn/${d.id}/${l.id}`} className="text-[13px] font-semibold">Preview</Link>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <ConfirmDialog
        open={review}
        title="Review Before Checkout"
        body="You’ll be redirected to your cart to confirm your selected course(s) before proceeding to payment."
        confirmLabel="Go to Cart"
        onCancel={() => setReview(false)}
        onConfirm={() => router.push("/cart")}
      />
    </>
  );
}
