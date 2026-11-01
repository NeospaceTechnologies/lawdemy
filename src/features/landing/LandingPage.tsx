import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClass } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { RatingSummary } from "@/components/ui/Stars";
import {
  ArrowRightIcon,
  AwardIcon,
  BookIcon,
  CartIcon,
  ChatIcon,
  CheckIcon,
  LevelIcon,
  LockIcon,
  PlayIcon,
  QuizIcon,
  SearchIcon,
  TrophyIcon,
} from "@/components/ui/icons";
import { BUSINESS } from "@/lib/config";
import type { LandingData } from "@/lib/landing";
import { VerifyCertificateForm } from "./VerifyCertificateForm";

// Public marketing home page. Every CTA goes to a real flow: learner sign-up/sign-in,
// instructor sign-up/sign-in, and public certificate verification.

const LEARNER_SIGN_UP = "/sign-up";
const LEARNER_SIGN_IN = "/sign-in";
const INSTRUCTOR_SIGN_UP = "/instructor/sign-up";
const INSTRUCTOR_SIGN_IN = "/instructor/sign-in";

export function LandingPage({ data }: { data: LandingData }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1">
        <Hero data={data} />
        <Audiences />
        <FeaturedCourses data={data} />
        <HowItWorks />
        <Features />
        <Certificates />
        <Teach />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

/* ---------- Layout helpers ---------- */

function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1200px] px-4 sm:px-6 ${className}`}>{children}</div>;
}

function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <p className={`m-0 text-xs font-semibold tracking-[0.12em] uppercase ${light ? "text-accent-soft" : "text-accent"}`}>{children}</p>
  );
}

function SectionHead({ eyebrow, title, intro, light = false }: { eyebrow: string; title: string; intro?: string; light?: boolean }) {
  return (
    <div className="flex max-w-[680px] flex-col gap-3">
      <Eyebrow light={light}>{eyebrow}</Eyebrow>
      <h2 className={`m-0 text-[28px] leading-tight font-bold sm:text-[34px] ${light ? "text-white" : "text-ink"}`}>{title}</h2>
      {intro && <p className={`m-0 text-base leading-relaxed ${light ? "text-white/75" : "text-ink-3"}`}>{intro}</p>}
    </div>
  );
}

function Tick({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${light ? "bg-white/15 text-white" : "bg-success-bg text-success"}`}>
        <CheckIcon size={12} />
      </span>
      <span>{children}</span>
    </li>
  );
}

/* ---------- Header ---------- */

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="Lawdemy home" className="no-underline">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-7 text-sm font-medium lg:flex">
          <a href="#courses" className="text-ink-2 no-underline hover:text-primary">Courses</a>
          <a href="#how-it-works" className="text-ink-2 no-underline hover:text-primary">How it works</a>
          <a href="#certificates" className="text-ink-2 no-underline hover:text-primary">Certificates</a>
          <a href="#teach" className="text-ink-2 no-underline hover:text-primary">Teach on Lawdemy</a>
          <a href="#faq" className="text-ink-2 no-underline hover:text-primary">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href={LEARNER_SIGN_IN} className={buttonClass("ghost", "md", "hidden sm:inline-flex")}>
            Sign in
          </Link>
          <Link href={LEARNER_SIGN_UP} className={buttonClass("primary", "md")}>
            Get started
          </Link>
        </div>
      </Container>
    </header>
  );
}

/* ---------- Hero ---------- */

function Hero({ data }: { data: LandingData }) {
  const top = data.featured[0];
  const stats = [
    data.courseCount > 0 && { value: data.courseCount, label: data.courseCount === 1 ? "live course" : "live courses" },
    data.instructorCount > 0 && { value: data.instructorCount, label: data.instructorCount === 1 ? "expert instructor" : "expert instructors" },
    data.categories.length > 0 && { value: data.categories.length, label: data.categories.length === 1 ? "practice area" : "practice areas" },
  ].filter(Boolean) as { value: number; label: string }[];

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#F5F3FF_0%,#FFFFFF_70%)]">
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 h-[420px] w-[420px] rounded-full bg-accent/10 blur-3xl" />
      <Container className="relative grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.05fr_1fr]">
        <div className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-info-border bg-white px-3 py-1 text-xs font-semibold text-info-text">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Courses by African legal professionals
          </span>
          <h1 className="m-0 text-[38px] leading-[1.08] font-bold tracking-tight text-ink sm:text-[52px]">
            Learn the law that works <span className="text-primary">where you do.</span>
          </h1>
          <p className="m-0 max-w-[560px] text-lg leading-relaxed text-ink-3">
            Practical, locally relevant courses for lawyers growing their practice, and plain-language law for founders, compliance teams and
            students. Learn at your own pace and earn certificates anyone can verify.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={LEARNER_SIGN_UP} className={buttonClass("primary", "lg", "h-12! px-6! text-[15px]!")}>
              Start learning <ArrowRightIcon />
            </Link>
            <Link href={INSTRUCTOR_SIGN_UP} className={buttonClass("outline", "lg", "h-12! px-6! text-[15px]!")}>
              Become an instructor
            </Link>
          </div>
          <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm text-ink-2 sm:flex-row sm:flex-wrap sm:gap-x-6">
            <Tick>Every course reviewed before it goes live</Tick>
            <Tick>Free and paid courses, priced in Naira</Tick>
          </ul>
          {stats.length > 0 && (
            <dl className="m-0 mt-2 flex flex-wrap gap-x-10 gap-y-4 border-t border-line pt-6">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col">
                  <dt className="order-2 text-sm text-ink-3">{s.label}</dt>
                  <dd className="order-1 m-0 text-3xl font-bold text-ink">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <HeroVisual courseTitle={top?.title} instructor={top?.instructor} />
      </Container>
    </section>
  );
}

/** A composed product preview: lesson player, instructor reply and verified certificate. */
function HeroVisual({ courseTitle, instructor }: { courseTitle?: string; instructor?: string }) {
  const title = courseTitle ?? "Contract Drafting for Growing Businesses";
  const by = instructor ?? "a senior practitioner";
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-[520px] pb-10 lg:pb-0">
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_24px_60px_-20px_rgba(11,11,126,0.35)]">
        <div className="relative flex aspect-video items-center justify-center bg-[radial-gradient(circle_at_30%_20%,#1E1EA8_0%,#0B0B7E_45%,#06065A_100%)]">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,transparent_60%,rgba(242,107,29,0.25)_100%)]" />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-primary shadow-lg">
            <PlayIcon size={26} />
          </span>
          <span className="absolute top-3 left-3 rounded-md bg-black/35 px-2 py-1 text-[11px] font-medium text-white">Module 2 · Lesson 3</span>
          <div className="absolute inset-x-4 bottom-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/25">
              <div className="h-full w-[62%] rounded-full bg-accent" />
            </div>
            <span className="text-[11px] font-medium text-white/90">12:40 / 20:15</span>
          </div>
        </div>
        <div className="flex flex-col gap-3 p-4">
          <div>
            <p className="m-0 line-clamp-1 text-[15px] font-semibold text-ink">{title}</p>
            <p className="m-0 text-xs text-ink-3">with {by}</p>
          </div>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-[13px]">
            {[
              ["Key clauses and how they fail", true],
              ["Drafting for enforceability", true],
              ["Final quiz", false],
            ].map(([t, done]) => (
              <li key={t as string} className="flex items-center gap-2 text-ink-2">
                <span className={`flex h-4 w-4 items-center justify-center rounded-full ${done ? "bg-success-light text-white" : "border border-line-input text-transparent"}`}>
                  <CheckIcon size={10} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="absolute -bottom-2 -left-2 w-[250px] rounded-xl border border-line bg-white p-3 shadow-xl sm:-left-8 lg:-bottom-8">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">JA</span>
          <span className="text-xs font-semibold text-ink">Instructor</span>
          <span className="rounded bg-info-tint px-1.5 py-0.5 text-[10px] font-semibold text-info-text">Replied</span>
        </div>
        <p className="m-0 mt-2 text-xs leading-relaxed text-ink-3">“Good question. That clause usually needs board approval first. I cover it in Lesson 4…”</p>
      </div>

      <div className="absolute -top-5 -right-2 flex items-center gap-2.5 rounded-xl border border-line bg-white px-3 py-2.5 shadow-xl sm:-right-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success-bg text-success">
          <AwardIcon size={16} />
        </span>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-ink">Certificate verified</span>
          <span className="text-[11px] text-muted">ID LWD-8F2K1Q</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Audiences ---------- */

function Audiences() {
  const cards = [
    {
      tag: "For lawyers",
      title: "Upskill in your practice area",
      body: "Courses matched to your practice areas and jurisdictions, with certificates that carry your call-to-bar details.",
      points: ["Recommendations from your practice areas", "Certificates for your professional record"],
      cta: "Join as a lawyer",
      href: LEARNER_SIGN_UP,
      tone: "bg-primary text-white",
    },
    {
      tag: "For non-lawyers",
      title: "Understand the law that affects you",
      body: "Founders, compliance officers, HR teams, students and the curious public: plain-language law for African contexts.",
      points: ["No legal background needed", "Learn on any device, at your own pace"],
      cta: "Start learning",
      href: LEARNER_SIGN_UP,
      tone: "bg-accent text-white",
    },
    {
      tag: "For instructors",
      title: "Teach what you know, and get paid",
      body: "Senior lawyers, lecturers, consultants and retired judges: package your expertise and reach learners across the continent.",
      points: ["Guided course builder", "Earnings paid to your Nigerian bank account"],
      cta: "Become an instructor",
      href: INSTRUCTOR_SIGN_UP,
      tone: "bg-info text-white",
    },
  ];
  return (
    <section aria-labelledby="audiences-title" className="py-16 sm:py-20">
      <Container className="flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <Eyebrow>Built for everyone who works with the law</Eyebrow>
          <h2 id="audiences-title" className="m-0 max-w-[680px] text-[28px] leading-tight font-bold sm:text-[34px]">
            One platform. Three ways in.
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {cards.map((c) => (
            <article key={c.tag} className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-6 shadow-card transition-shadow hover:shadow-lg">
              <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${c.tone}`}>{c.tag}</span>
              <h3 className="m-0 text-xl font-bold text-ink">{c.title}</h3>
              <p className="m-0 text-sm leading-relaxed text-ink-3">{c.body}</p>
              <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm text-ink-2">
                {c.points.map((p) => (
                  <Tick key={p}>{p}</Tick>
                ))}
              </ul>
              <Link href={c.href} className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-semibold no-underline">
                {c.cta} <ArrowRightIcon />
              </Link>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Featured courses ---------- */

const CARD_TONES = ["from-[#0B0B7E] to-[#3B3BC4]", "from-[#93370D] to-[#F26B1D]", "from-[#5B21B6] to-[#7F56D9]", "from-[#067647] to-[#17B26A]", "from-[#101828] to-[#475467]", "from-[#C4320A] to-[#F79009]"];

function FeaturedCourses({ data }: { data: LandingData }) {
  if (data.featured.length === 0) return null;
  return (
    <section id="courses" aria-labelledby="courses-title" className="scroll-mt-20 bg-surface py-16 sm:py-20">
      <Container className="flex flex-col gap-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="flex max-w-[680px] flex-col gap-3">
            <Eyebrow>Popular right now</Eyebrow>
            <h2 id="courses-title" className="m-0 text-[28px] leading-tight font-bold sm:text-[34px]">
              Courses learners are taking
            </h2>
            <p className="m-0 text-base leading-relaxed text-ink-3">Taught by practitioners, reviewed by our team, and built for the way law works across Africa.</p>
          </div>
          <Link href={LEARNER_SIGN_UP} className={buttonClass("outline", "lg", "w-fit shrink-0")}>
            Browse all courses <ArrowRightIcon />
          </Link>
        </div>

        {data.categories.length > 0 && (
          <ul aria-label="Practice areas" className="m-0 flex list-none flex-wrap gap-2 p-0">
            {data.categories.map((c) => (
              <li key={c} className="rounded-full border border-line bg-white px-3 py-1.5 text-[13px] font-medium text-ink-2">
                {c}
              </li>
            ))}
          </ul>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.featured.map((c, i) => (
            <article key={c.id} className="group relative flex flex-col overflow-hidden rounded-card border border-line bg-white shadow-card transition-shadow hover:shadow-lg">
              <div
                className={`relative flex h-[150px] items-end bg-gradient-to-br bg-cover bg-center p-3 ${CARD_TONES[i % CARD_TONES.length]}`}
                style={c.thumbnailUrl ? { backgroundImage: `url(${c.thumbnailUrl})` } : undefined}
              >
                {!c.thumbnailUrl && (
                  <span aria-hidden="true" className="absolute top-3 right-4 text-[64px] leading-none font-bold text-white/15">
                    {(c.category ?? c.title).charAt(0)}
                  </span>
                )}
                <div className="relative flex flex-wrap gap-1.5">
                  {c.category && <span className="rounded bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-ink">{c.category}</span>}
                  {c.badge && <span className="rounded bg-accent px-2 py-0.5 text-[11px] font-semibold text-white">{c.badge}</span>}
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2.5 p-4">
                <h3 className="m-0 text-[15px] leading-snug font-semibold">
                  <Link href={LEARNER_SIGN_UP} className="text-ink no-underline after:absolute after:inset-0 group-hover:text-primary">
                    {c.title}
                  </Link>
                </h3>
                <div className="flex items-center gap-2 text-xs text-ink-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">{c.initials}</span>
                  {c.instructor}
                </div>
                <div className="flex items-center gap-3 text-xs text-ink-3">
                  <span className="inline-flex items-center gap-1">
                    <LevelIcon /> {c.level}
                  </span>
                  {c.rating && <RatingSummary avg={c.rating.avg} count={c.rating.count} />}
                </div>
                <div className="mt-auto flex items-baseline gap-2 border-t border-line pt-3">
                  <span className={`text-[15px] font-bold ${c.isFree ? "text-success" : "text-price"}`}>{c.priceLabel}</span>
                  {c.oldLabel && <span className="text-xs text-muted line-through">{c.oldLabel}</span>}
                  {c.offLabel && <span className="text-xs font-semibold text-success">{c.offLabel}</span>}
                </div>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- How it works ---------- */

function HowItWorks() {
  const steps = [
    { icon: <SearchIcon size={18} />, title: "Find your course", body: "Search and filter by practice area, level, price and certificate. Save favourites to your wishlist." },
    { icon: <PlayIcon size={18} />, title: "Learn at your pace", body: "Video and written lessons that remember where you stopped, on phone, tablet or laptop." },
    { icon: <ChatIcon size={18} />, title: "Ask the instructor", body: "Every lesson has its own Q&A. Instructors are notified of each question and reply in the thread." },
    { icon: <TrophyIcon size={18} />, title: "Pass and get certified", body: `Complete every lesson, score ${BUSINESS.quizPassPct}% or more on the final quiz, and your certificate is issued automatically.` },
  ];
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-20 py-16 sm:py-24">
      <Container className="flex flex-col gap-12">
        <div className="flex flex-col gap-3">
          <Eyebrow>How it works</Eyebrow>
          <h2 id="how-title" className="m-0 max-w-[680px] text-[28px] leading-tight font-bold sm:text-[34px]">
            From sign-up to certificate in four steps
          </h2>
        </div>
        <ol className="m-0 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="relative flex flex-col gap-3 rounded-2xl border border-line p-6">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-info-tint-2 text-primary">{s.icon}</span>
                <span className="text-4xl font-bold text-line">0{i + 1}</span>
              </div>
              <h3 className="m-0 text-lg font-bold text-ink">{s.title}</h3>
              <p className="m-0 text-sm leading-relaxed text-ink-3">{s.body}</p>
            </li>
          ))}
        </ol>
        <div>
          <Link href={LEARNER_SIGN_UP} className={buttonClass("primary", "lg")}>
            Create your free account <ArrowRightIcon />
          </Link>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Features ---------- */

function Features() {
  const items = [
    { icon: <BookIcon size={18} />, title: "Video and written lessons", body: "Stream lessons, switch to an expanded reading mode for write-ups, and pick up where you left off." },
    { icon: <QuizIcon size={18} />, title: "Quizzes with real feedback", body: "Final quizzes unlock when you finish the lessons, with an explanation from the instructor for every question." },
    { icon: <AwardIcon size={18} />, title: "Shareable certificates", body: "Download a PDF, share a link, and let anyone confirm it is genuine on our public verification page." },
    { icon: <ChatIcon size={18} />, title: "A community of practice", body: "Join discussions, upvote helpful answers and get announcements from your instructors." },
    { icon: <CartIcon size={18} />, title: "Simple checkout in Naira", body: "Add courses to your cart, apply instructor discounts and pay securely. Free courses are one click away." },
    { icon: <LockIcon size={18} />, title: "Quality you can trust", body: "Every course is checked by the Lawdemy team before it goes live, and the community is moderated." },
  ];
  return (
    <section aria-label="Features" className="bg-cream py-16 sm:py-20">
      <Container className="flex flex-col gap-10">
        <SectionHead eyebrow="Everything in one place" title="Built for busy legal minds" intro="All the tools you need to learn properly, not just watch videos." />
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((f) => (
            <div key={f.title} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-card">{f.icon}</span>
              <div className="flex flex-col gap-1.5">
                <h3 className="m-0 text-base font-bold text-ink">{f.title}</h3>
                <p className="m-0 text-sm leading-relaxed text-ink-3">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Certificates ---------- */

function Certificates() {
  return (
    <section id="certificates" aria-labelledby="cert-title" className="scroll-mt-16 bg-primary py-16 text-white sm:py-24">
      <Container className="grid items-center gap-12 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Eyebrow light>Certificates</Eyebrow>
          <h2 id="cert-title" className="m-0 text-[28px] leading-tight font-bold text-white sm:text-[38px]">
            Proof of learning that employers and clients can check
          </h2>
          <p className="m-0 text-base leading-relaxed text-white/75">
            Every Lawdemy certificate shows your name, the course, the instructor, the completion date and a unique verification ID. Lawyers&apos;
            certificates also show call-to-bar details.
          </p>
          <ul className="m-0 flex list-none flex-col gap-3 p-0 text-sm text-white/90">
            <Tick light>Issued automatically when you complete the course and pass the final quiz</Tick>
            <Tick light>Download as a PDF or share a link with employers and clients</Tick>
            <Tick light>A public page confirms each certificate is genuine</Tick>
          </ul>
          <div className="flex flex-col gap-2 rounded-2xl border border-white/15 bg-white/5 p-5">
            <p className="m-0 text-sm font-semibold text-white">Received a Lawdemy certificate? Check it here.</p>
            <VerifyCertificateForm />
          </div>
        </div>

        <div aria-hidden="true" className="mx-auto w-full max-w-[520px]">
          <div className="rotate-[-2deg] rounded-2xl bg-white p-2 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
            <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-[#E9D7B4] bg-[#FFFDF7] px-6 py-8 text-center sm:px-10">
              <Logo />
              <p className="m-0 text-[11px] font-semibold tracking-[0.25em] text-muted uppercase">Certificate of completion</p>
              <p className="m-0 text-xs text-ink-3">This certifies that</p>
              <p className="m-0 font-serif text-3xl text-ink italic">Adaeze Nwosu</p>
              <p className="m-0 max-w-[320px] text-xs leading-relaxed text-ink-3">
                has successfully completed the course and passed the final assessment for
              </p>
              <p className="m-0 text-base font-bold text-primary">Corporate Governance for Nigerian Companies</p>
              <div className="mt-3 grid w-full grid-cols-3 items-end gap-2 border-t border-[#E9D7B4] pt-4 text-[10px] text-muted">
                <div className="flex flex-col gap-0.5 text-left">
                  <span className="font-semibold text-ink-2">James Adeniola</span>
                  Instructor
                </div>
                <div className="flex justify-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white">
                    <AwardIcon size={22} />
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 text-right">
                  <span className="font-semibold text-ink-2">LWD-8F2K1Q</span>
                  Verification ID
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Teach ---------- */

function Teach() {
  const steps = [
    { title: "Create your instructor profile", body: "Tell learners about your experience, practice areas and jurisdictions." },
    { title: "Build your course", body: "A guided three-step builder for details, modules with video or written lessons, and a final quiz." },
    { title: "We review it", body: "Our team checks every course for quality before it goes live, and tells you exactly what to fix if it needs changes." },
    { title: "Earn and withdraw", body: `Sales clear after ${BUSINESS.pendingDays} days, then withdraw to your Nigerian bank account, protected by your transaction PIN.` },
  ];
  return (
    <section id="teach" aria-labelledby="teach-title" className="scroll-mt-16 py-16 sm:py-24">
      <Container className="grid items-start gap-12 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col gap-6 lg:sticky lg:top-24">
          <Eyebrow>Teach on Lawdemy</Eyebrow>
          <h2 id="teach-title" className="m-0 text-[28px] leading-tight font-bold sm:text-[38px]">
            Your expertise deserves a bigger courtroom.
          </h2>
          <p className="m-0 text-base leading-relaxed text-ink-3">
            Turn years of practice into courses that lawyers and professionals across Africa can take on their own schedule. We handle payments,
            hosting and certificates. You focus on teaching.
          </p>

          <div className="rounded-2xl border border-line bg-white p-5 shadow-card" aria-label="Example earnings summary">
            <div className="flex items-center justify-between">
              <p className="m-0 text-sm font-semibold text-ink">Earnings</p>
              <span className="text-[11px] text-muted">Example</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-success-tint p-3">
                <p className="m-0 text-[11px] text-ink-3">Available to withdraw</p>
                <p className="m-0 mt-1 text-xl font-bold text-success">₦184,500</p>
              </div>
              <div className="rounded-xl bg-warning-bg/60 p-3">
                <p className="m-0 text-[11px] text-ink-3">Pending earnings</p>
                <p className="m-0 mt-1 text-xl font-bold text-warning-text">₦42,000</p>
              </div>
            </div>
            <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0 text-xs">
              {[
                ["Enrollment · Data Privacy Essentials", "+₦12,000"],
                ["Enrollment · Contract Drafting", "+₦9,600"],
                ["Withdrawal to Access Bank ••4251", "−₦100,000"],
              ].map(([l, a]) => (
                <li key={l} className="flex items-center justify-between gap-3 border-t border-line pt-2 text-ink-2">
                  <span className="truncate">{l}</span>
                  <span className={`shrink-0 font-semibold ${a.startsWith("+") ? "text-success" : "text-ink"}`}>{a}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={INSTRUCTOR_SIGN_UP} className={buttonClass("primary", "lg", "h-12! px-6!")}>
              Become an instructor <ArrowRightIcon />
            </Link>
            <Link href={INSTRUCTOR_SIGN_IN} className={buttonClass("ghost", "lg", "h-12!")}>
              Instructor sign in
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <ol className="m-0 flex list-none flex-col p-0">
            {steps.map((s, i) => (
              <li key={s.title} className="relative flex gap-5 pb-8 last:pb-0">
                {i < steps.length - 1 && <span aria-hidden="true" className="absolute top-11 bottom-0 left-[21px] w-px bg-line" />}
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">{i + 1}</span>
                <div className="flex flex-col gap-1.5 pt-2">
                  <h3 className="m-0 text-lg font-bold text-ink">{s.title}</h3>
                  <p className="m-0 text-sm leading-relaxed text-ink-3">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Engage your learners", "Answer lesson questions, post course announcements and run discussions in the community."],
              ["See what is working", "Track enrolments, completion, quiz results and questions for every course."],
              ["Grade written answers", "Review open-ended quiz answers in a dedicated grading queue."],
              ["Promotions and discounts", "Run time-limited discounts on your paid courses, or publish free courses to build an audience."],
            ].map(([t, b]) => (
              <div key={t} className="rounded-2xl border border-line bg-surface p-5">
                <h3 className="m-0 text-[15px] font-bold text-ink">{t}</h3>
                <p className="m-0 mt-1.5 text-sm leading-relaxed text-ink-3">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- FAQ ---------- */

function Faq() {
  const faqs = [
    ["Who is Lawdemy for?", "Practising lawyers who want to upskill and show proof of learning, and non-lawyers (founders, compliance officers, HR teams, students) who need clear, practical law that fits African jurisdictions."],
    ["Who teaches the courses?", "Experienced legal professionals: senior lawyers, lecturers, consultants and retired judges. Every course is reviewed by the Lawdemy team before learners can see it."],
    ["Are there free courses?", "Yes. Instructors can publish free courses alongside paid ones. Paid courses are priced in Naira, and some carry limited-time discounts."],
    ["How do I get a certificate?", `Finish every lesson and score at least ${BUSINESS.quizPassPct}% on the final quiz of a course that offers a certificate. It is issued automatically, and you can download or share it.`],
    ["How can someone check my certificate?", "Each certificate has a unique ID. Anyone can enter it on this page, or open your share link, to confirm it is genuine."],
    ["Do I need to install an app?", "No. Lawdemy works in your browser on phone, tablet and computer."],
    ["How do instructors get paid?", `Each sale is credited to your earnings. After ${BUSINESS.pendingDays} days it becomes available, and you can withdraw to your verified Nigerian bank account using your transaction PIN.`],
  ];
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-16 bg-surface py-16 sm:py-24">
      <Container className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
        <div className="flex flex-col gap-3">
          <Eyebrow>FAQ</Eyebrow>
          <h2 id="faq-title" className="m-0 text-[28px] leading-tight font-bold sm:text-[34px]">
            Questions, answered
          </h2>
          <p className="m-0 text-base leading-relaxed text-ink-3">
            Still curious? <Link href={LEARNER_SIGN_UP}>Create an account</Link> and reach our support team from your dashboard.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {faqs.map(([q, a]) => (
            <details key={q} className="group rounded-xl border border-line bg-white px-5 py-4 open:shadow-card">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {q}
                <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-lg leading-none text-primary transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="m-0 mt-3 text-sm leading-relaxed text-ink-3">{a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Final CTA and footer ---------- */

function FinalCta() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#0B0B7E_0%,#1E1EA8_60%,#5B21B6_100%)] px-6 py-12 text-center sm:px-12 sm:py-16">
          <div aria-hidden="true" className="absolute -right-16 -bottom-16 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
          <div className="relative mx-auto flex max-w-[640px] flex-col items-center gap-5">
            <h2 className="m-0 text-[28px] leading-tight font-bold text-white sm:text-[38px]">Start learning, or start teaching, today.</h2>
            <p className="m-0 text-base text-white/80">Creating an account is free. You only pay for the paid courses you choose.</p>
            <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
              <Link href={LEARNER_SIGN_UP} className={buttonClass("outline", "lg", "h-12! border-white! bg-white! px-6!")}>
                Start learning <ArrowRightIcon />
              </Link>
              <Link href={INSTRUCTOR_SIGN_UP} className={buttonClass("primary", "lg", "h-12! border border-white/40 bg-transparent! px-6! hover:bg-white/10!")}>
                Become an instructor
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Footer() {
  const cols = [
    { title: "Learn", links: [["Create an account", LEARNER_SIGN_UP], ["Sign in", LEARNER_SIGN_IN], ["Browse courses", "#courses"], ["How it works", "#how-it-works"]] },
    { title: "Teach", links: [["Become an instructor", INSTRUCTOR_SIGN_UP], ["Instructor sign in", INSTRUCTOR_SIGN_IN], ["How teaching works", "#teach"]] },
    { title: "Certificates", links: [["Verify a certificate", "#certificates"], ["FAQ", "#faq"]] },
  ];
  return (
    <footer className="border-t border-line bg-white">
      <Container className="grid gap-10 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="m-0 max-w-[300px] text-sm leading-relaxed text-ink-3">Learn law and teach it: courses by African legal professionals.</p>
        </div>
        {cols.map((c) => (
          <nav key={c.title} aria-label={c.title} className="flex flex-col gap-3">
            <p className="m-0 text-sm font-semibold text-ink">{c.title}</p>
            <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm">
              {c.links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-ink-3 no-underline hover:text-primary">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>
      <div className="border-t border-line">
        <Container className="flex flex-col justify-between gap-2 py-5 text-xs text-muted sm:flex-row">
          <span>© {new Date().getFullYear()} Lawdemy. All rights reserved.</span>
          <span>Made for the African legal community.</span>
        </Container>
      </div>
    </footer>
  );
}
