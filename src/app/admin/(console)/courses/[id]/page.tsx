import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReviewActions } from "@/features/admin/ReviewActions";
import { requireStaffPage } from "@/lib/auth/staff";
import { db } from "@/lib/db";
import { formatNaira } from "@/lib/format";

export const metadata: Metadata = { title: "Review course" };

// Read-only course preview for reviewers: lessons, quiz, price (ADM-01).
export default async function AdminCoursePage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaffPage();
  const c = await db.course.findFirst({
    where: { id: (await params).id, deletedAt: null },
    include: {
      instructor: { select: { firstName: true, lastName: true } },
      modules: { orderBy: { position: "asc" }, include: { lessons: { orderBy: { position: "asc" } } } },
      quiz: { include: { questions: { orderBy: { position: "asc" } } } },
      decisions: { orderBy: { decidedAt: "desc" }, take: 5 },
    },
  });
  if (!c) notFound();
  return (
    <>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-ink-3">{c.status} · {c.category} · {c.level} · by {c.instructor.firstName} {c.instructor.lastName}</span>
        <h1 className="m-0 text-2xl font-bold">{c.title}</h1>
        {c.subtitle && <p className="m-0 text-sm text-ink-3">{c.subtitle}</p>}
      </div>
      <section className="flex flex-col gap-1 text-sm">
        <strong>Price</strong>
        <span>{c.access === "FREE" ? "Free" : `${formatNaira(c.priceKobo ?? 0)}${c.discountPct ? ` (${c.discountPct}% off until ${c.discountEndsAt?.toLocaleDateString("en-GB")})` : ""}`} · Certificate: {c.hasCertificate ? "Yes" : "No"}</span>
      </section>
      <section className="flex flex-col gap-1 text-sm"><strong>Description</strong><p className="m-0 whitespace-pre-line text-ink-2">{c.description}</p></section>
      {c.modules.map((m, mi) => (
        <section key={m.id} className="flex flex-col gap-2 rounded-card border border-line p-4">
          <strong className="text-sm">Module {mi + 1}: {m.title}</strong>
          {m.lessons.map((l, li) => (
            <details key={l.id} className="rounded-control border border-line px-3 py-2 text-[13px]">
              <summary className="cursor-pointer">Lesson {li + 1}: {l.title} {l.isPreview && "(preview)"} {l.videoAssetId && "· video"}</summary>
              {l.videoAssetId && (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video src={`/api/media/${l.videoAssetId}`} controls className="mt-2 w-full max-w-[560px] rounded-control bg-black" />
              )}
              {l.writeUp && <div className="prose-lesson mt-2 text-ink-2" dangerouslySetInnerHTML={{ __html: l.writeUp }} />}
            </details>
          ))}
        </section>
      ))}
      {c.quiz && (
        <section className="flex flex-col gap-2 rounded-card border border-line p-4 text-[13px]">
          <strong className="text-sm">Final Quiz: {c.quiz.title}</strong>
          {c.quiz.questions.map((q, i) => (
            <div key={q.id}>
              {i + 1}. {q.prompt} <span className="text-ink-3">({q.type})</span>
              <ul className="m-0 pl-5">{(q.options as { text: string; correct: boolean }[]).map((o, oi) => <li key={oi} className={o.correct ? "font-semibold text-success" : ""}>{o.text}</li>)}</ul>
            </div>
          ))}
        </section>
      )}
      {c.decisions.length > 0 && (
        <section className="flex flex-col gap-1 text-[13px]"><strong>Previous decisions</strong>{c.decisions.map((d) => <span key={d.id}>{d.decidedAt.toLocaleDateString("en-GB")}: {d.decision}{d.reason ? ` — ${d.reason}` : ""}</span>)}</section>
      )}
      {c.status === "UNDER_REVIEW" && <ReviewActions courseId={c.id} />}
    </>
  );
}
