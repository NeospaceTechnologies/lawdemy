"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { api, ApiClientError } from "@/lib/api-client";

type Item = {
  id: string;
  n: number;
  type: "MC" | "TF" | "SHORT" | "UPLOAD";
  prompt: string;
  answer: string | { assetId: string } | null;
  modelAnswer: string | null;
  outcome: "correct" | "incorrect" | "pending";
  mark: { correct: boolean; comment?: string | null } | null;
};

const TYPE = { MC: "Multiple choice", TF: "True or False", SHORT: "Short answer", UPLOAD: "Upload" };

/** Marks written answers; the projected score updates as you go. */
export function GradeAttempt({ attemptId, items, readOnly, total, passPct }: { attemptId: string; items: Item[]; readOnly: boolean; total: number; passPct: number }) {
  const router = useRouter();
  const toast = useToast();
  const [marks, setMarks] = useState<Record<string, { correct: boolean | null; comment: string }>>(
    Object.fromEntries(items.filter((i) => i.outcome === "pending" || i.mark).map((i) => [i.id, { correct: i.mark?.correct ?? null, comment: i.mark?.comment ?? "" }])),
  );
  const [busy, setBusy] = useState(false);
  const pending = items.filter((i) => i.outcome === "pending");
  const ready = pending.every((i) => marks[i.id]?.correct !== null && marks[i.id]?.correct !== undefined);
  const correct = items.filter((i) => i.outcome === "correct").length + pending.filter((i) => marks[i.id]?.correct).length;
  const projected = total ? Math.round((correct / total) * 100) : 0;

  async function save() {
    setBusy(true);
    try {
      const body = Object.fromEntries(pending.map((i) => [i.id, { correct: !!marks[i.id].correct, comment: marks[i.id].comment || null }]));
      const r = await api<{ scorePct: number; passed: boolean }>(`/api/instructor/attempts/${attemptId}/grade`, { body: { marks: body } });
      toast.show({ title: "Marks saved", body: `The learner scored ${r.scorePct}% and ${r.passed ? "passed" : "didn’t pass"}. They’ve been notified.` });
      router.push("/instructor/grading");
      router.refresh();
    } catch (err) {
      toast.show({ tone: "error", title: "Couldn’t save the marks", body: err instanceof ApiClientError ? err.message : undefined });
      setBusy(false);
    }
  }

  return (
    <>
      <ol className="m-0 flex list-none flex-col gap-4 p-0">
        {items.map((i) => {
          const m = marks[i.id];
          const manual = i.type === "SHORT" || i.type === "UPLOAD";
          return (
            <li key={i.id} className={clsx("flex flex-col gap-2.5 rounded-card border p-4", i.outcome === "pending" ? "border-warning" : "border-line")}>
              <span className="text-xs text-ink-3">Question {i.n} · {TYPE[i.type]}</span>
              <strong className="text-[15px]">{i.prompt}</strong>
              <div className="rounded-control bg-surface px-3 py-2.5 text-[13px] whitespace-pre-line">
                <span className="block text-xs text-ink-3">Learner’s answer</span>
                {i.answer === null ? <em className="text-ink-3">No answer</em> : typeof i.answer === "string" ? i.answer : <a href={`/api/media/${i.answer.assetId}`} target="_blank" rel="noreferrer">Open uploaded file</a>}
              </div>
              {i.modelAnswer && <span className="text-xs text-ink-3">{manual ? "Model answer" : "Correct answer"}: <span className="text-ink-2">{i.modelAnswer}</span></span>}
              {!manual || i.outcome !== "pending" && !m ? (
                <span className={clsx("text-xs font-semibold", i.outcome === "correct" ? "text-success" : "text-danger-text")}>{i.outcome === "correct" ? "Correct" : "Incorrect"}{manual ? "" : " (marked automatically)"}</span>
              ) : (
                <fieldset disabled={readOnly} className="m-0 flex flex-col gap-2 border-0 p-0">
                  <legend className="sr-only">Mark question {i.n}</legend>
                  <div className="flex gap-2">
                    {([true, false] as const).map((v) => (
                      <label key={String(v)} className={clsx("flex h-9 cursor-pointer items-center gap-2 rounded-control border px-3 text-[13px]", m?.correct === v ? (v ? "border-success bg-success-tint" : "border-danger bg-[#FEF3F2]") : "border-line")}>
                        <input type="radio" name={`mark-${i.id}`} className="accent-primary" checked={m?.correct === v} onChange={() => setMarks((s) => ({ ...s, [i.id]: { ...s[i.id], correct: v } }))} />
                        {v ? "Correct" : "Incorrect"}
                      </label>
                    ))}
                  </div>
                  <TextArea rows={2} maxLength={1000} placeholder="Comment for the learner (optional)" value={m?.comment ?? ""} onChange={(e) => setMarks((s) => ({ ...s, [i.id]: { ...s[i.id], comment: e.target.value } }))} className="text-[13px]" aria-label={`Comment on question ${i.n}`} />
                </fieldset>
              )}
            </li>
          );
        })}
      </ol>
      {!readOnly && (
        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-white py-3">
          <span className="text-sm">Score with these marks: <strong>{projected}%</strong> · {projected >= passPct ? <span className="font-semibold text-success">passes</span> : <span className="font-semibold text-danger-text">below the {passPct}% pass mark</span>}</span>
          <Button disabled={!ready} busy={busy} busyLabel="Saving…" onClick={save}>Save marks</Button>
        </div>
      )}
    </>
  );
}
