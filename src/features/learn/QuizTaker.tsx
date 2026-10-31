"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Button, ButtonLink } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/Field";
import { SuccessBadge } from "@/components/ui/Onboarding";
import { UploadDropzone, UploadProgress } from "@/components/ui/Upload";
import { useToast } from "@/components/ui/Toast";
import { api, ApiClientError } from "@/lib/api-client";
import { useUpload } from "@/lib/upload-client";

type Q = { id: string; type: "MC" | "TF" | "SHORT" | "UPLOAD"; prompt: string; options: string[] };
type Outcome = "correct" | "incorrect" | "pending";
type Result = { scorePct: number; passed: boolean; awaitingReview: boolean; certificateId: string | null; feedback: { questionId: string; correct: boolean; outcome: Outcome; feedback: string | null; correctIndex: number }[] };
type Review = { status: "awaiting_review" | "graded"; scorePct: number; passed: boolean; comments: { prompt: string; correct: boolean; comment: string | null }[] };

const FILE_RULE = { accept: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"], maxBytes: 10 * 1024 * 1024, message: "Upload a PDF or DOCX file up to 10MB." };

function UploadAnswer({ onChange }: { onChange: (assetId: string | null) => void }) {
  const up = useUpload("FILE", FILE_RULE, null);
  return (
    <div className="flex flex-col gap-2">
      <UploadDropzone accept=".pdf,.docx" hint="PDF, DOCX (Max file 10MB)" disabled={up.state.status === "uploading"} onFile={async (f) => { await up.start(f); }} />
      <UploadProgress state={up.state} onRemove={() => { up.remove(); onChange(null); }} />
      {up.asset && <AssetSync id={up.asset.id} onChange={onChange} />}
    </div>
  );
}
function AssetSync({ id, onChange }: { id: string; onChange: (v: string) => void }) {
  const cb = useRef(onChange);
  cb.current = onChange;
  useEffect(() => cb.current(`asset:${id}`), [id]);
  return null;
}

/** Final quiz: one page of questions, server-side grading, feedback after submit. Not shown in the designs. */
export function QuizTaker(props: { courseId: string; courseTitle: string; title: string; instructions: string | null; passPct: number; best: { scorePct: number; passed: boolean } | null; review: Review | null; questions: Q[] }) {
  const router = useRouter();
  const toast = useToast();
  const [answers, setAnswers] = useState<Record<string, number | string | null>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const setAnswer = useCallback((id: string, v: string | null) => setAnswers((a) => ({ ...a, [id]: v })), []);
  const answered = props.questions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== "").length;

  async function submit() {
    setBusy(true);
    try {
      const r = await api<Result>(`/api/learner/quiz/${props.courseId}`, { body: { answers } });
      setResult(r);
      window.scrollTo({ top: 0, behavior: "smooth" });
      router.refresh();
    } catch (err) {
      toast.show({ tone: "error", title: "Couldn’t submit your quiz", body: err instanceof ApiClientError ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  const fb = (id: string) => result?.feedback.find((f) => f.questionId === id);

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] text-ink-3">{props.courseTitle}</span>
        <h1 className="m-0 text-[26px] font-semibold">{props.title}</h1>
        {props.instructions && <p className="m-0 text-sm text-ink-3">{props.instructions}</p>}
        <span className="text-xs text-muted">Pass mark: {props.passPct}% · Unlimited retakes{props.best ? ` · Best score: ${props.best.scorePct}%` : ""}</span>
      </div>

      {!result && props.review && <ReviewBanner review={props.review} passPct={props.passPct} />}
      {result?.awaitingReview && (
        <div role="status" className="flex flex-col gap-1 rounded-card border border-[#FEDF89] bg-[#FFFAEB] p-5">
          <strong className="text-lg">Submitted for marking</strong>
          <span className="text-sm text-ink-2">Your multiple-choice answers scored {result.scorePct}% so far. Your instructor will mark your written answers, and we’ll notify you with your final result.</span>
        </div>
      )}
      {result && !result.awaitingReview && (
        <div role="status" className={clsx("flex items-center gap-4 rounded-card border p-5", result.passed ? "border-success-bg bg-success-tint" : "border-danger-bg bg-[#FEF3F2]")}>
          {result.passed && <SuccessBadge size={56} />}
          <div className="flex flex-1 flex-col gap-1">
            <strong className="text-lg">{result.passed ? "You passed!" : "Not quite there yet"}</strong>
            <span className="text-sm text-ink-2">You scored {result.scorePct}%. {result.passed ? (result.certificateId ? "Your certificate is ready." : "Finish any remaining lessons to complete the course.") : `You need ${props.passPct}% to pass. Review the feedback below and try again.`}</span>
          </div>
          {result.certificateId ? (
            <ButtonLink href={`/certifications/${result.certificateId}`} size="md">View certificate</ButtonLink>
          ) : (
            !result.passed && <Button size="md" variant="outline" onClick={() => { setResult(null); setAnswers({}); }}>Retake quiz</Button>
          )}
        </div>
      )}

      {props.questions.map((q, i) => {
        const f = fb(q.id);
        return (
          <fieldset key={q.id} disabled={!!result} className={clsx("m-0 flex flex-col gap-3 rounded-card border p-4", f ? (f.outcome === "pending" ? "border-warning" : f.correct ? "border-success-light" : "border-danger") : "border-line")}>
            <legend className="sr-only">Question {i + 1}</legend>
            <span className="text-xs font-semibold text-muted">Question {i + 1} of {props.questions.length}</span>
            <p className="m-0 text-[15px] font-medium">{q.prompt}</p>
            {(q.type === "MC" || q.type === "TF") && (
              <div className="flex flex-col gap-2">
                {q.options.map((o, oi) => (
                  <label key={oi} className={clsx("flex min-h-10 cursor-pointer items-center gap-2.5 rounded-control border px-3 text-[13px]", answers[q.id] === oi ? "border-primary bg-info-tint-2" : "border-line", f && oi === f.correctIndex && "border-success-light bg-success-tint")}>
                    <input type="radio" name={q.id} checked={answers[q.id] === oi} onChange={() => setAnswers((a) => ({ ...a, [q.id]: oi }))} className="accent-primary" />
                    {o}
                    {f && oi === f.correctIndex && <span className="ml-auto text-[11px] font-semibold text-success">Correct answer</span>}
                  </label>
                ))}
              </div>
            )}
            {q.type === "SHORT" && (
              <TextArea rows={3} placeholder="Type your answer" value={(answers[q.id] as string) ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} />
            )}
            {q.type === "UPLOAD" && !result && <UploadAnswer onChange={(v) => setAnswer(q.id, v)} />}
            {f?.feedback && (
              <div className="rounded-control bg-surface px-3 py-2.5 text-xs leading-normal text-ink-2">
                <strong className="block">Feedback/Explanation</strong>
                {f.feedback}
              </div>
            )}
          </fieldset>
        );
      })}

      {!result && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-ink-3">{answered} of {props.questions.length} answered</span>
          <div className="flex gap-2.5">
            <Link href={`/learn/${props.courseId}`} className="flex h-11 items-center px-3 text-sm font-semibold">Back to lessons</Link>
            <Button onClick={submit} disabled={answered < props.questions.length} busy={busy} busyLabel="Submitting…">Submit Quiz</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewBanner({ review, passPct }: { review: Review; passPct: number }) {
  if (review.status === "awaiting_review") {
    return (
      <div role="status" className="flex flex-col gap-1 rounded-card border border-[#FEDF89] bg-[#FFFAEB] p-4 text-sm text-ink-2">
        <strong className="text-ink">Your last attempt is being marked</strong>
        Your instructor is reviewing your written answers. You can retake the quiz meanwhile; your best marked score counts.
      </div>
    );
  }
  return (
    <div role="status" className={clsx("flex flex-col gap-2 rounded-card border p-4 text-sm", review.passed ? "border-success-bg bg-success-tint" : "border-danger-bg bg-[#FEF3F2]")}>
      <strong>Your last attempt was marked: {review.scorePct}% ({review.passed ? "passed" : `pass mark ${passPct}%`})</strong>
      {review.comments.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-[13px] text-ink-2">
          {review.comments.map((c, i) => (
            <li key={i}><span className={c.correct ? "font-semibold text-success" : "font-semibold text-danger-text"}>{c.correct ? "Correct" : "Not quite"}</span> · {c.prompt}{c.comment ? <span className="block text-ink-3">Instructor: {c.comment}</span> : null}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
