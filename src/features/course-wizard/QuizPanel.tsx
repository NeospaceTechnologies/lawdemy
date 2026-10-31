"use client";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { Button, IconButton } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { Select, TextArea, TextInput } from "@/components/ui/Field";
import { CloseIcon, EditIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import { SlideOver } from "@/components/ui/SlideOver";
import { LIMITS, QUESTION_TYPES, type QuestionType } from "@/lib/course/constants";
import { questionIssues, quizIssues } from "@/lib/course/rules";
import type { QuestionDraft, QuizDraft } from "@/lib/course/schema";
import { FeedbackDialog } from "./FeedbackDialog";
import { newId } from "./model";

function blankQuestion(): QuestionDraft {
  return { id: newId(), type: "MC", prompt: "", options: [{ text: "", correct: false }, { text: "", correct: false }], modelAnswer: "", feedback: "" };
}

function optionsFor(type: QuestionType) {
  if (type === "TF") return [{ text: "True", correct: false }, { text: "False", correct: false }];
  if (type === "MC") return [{ text: "", correct: false }, { text: "", correct: false }];
  return [];
}

type Props = {
  quiz: QuizDraft | null;
  onSave: (quiz: QuizDraft) => Promise<boolean>;
  onClose: () => void;
};

/** Add/Edit Quiz slide-over: one final quiz per course (PRD INS-CRS-07/08). */
export function QuizPanel({ quiz, onSave, onClose }: Props) {
  const editing = quiz !== null;
  const initial = useMemo<QuizDraft>(() => quiz ?? { title: "", instructions: "", questions: [blankQuestion()] }, [quiz]);
  const snapshot = useMemo(() => JSON.stringify(initial), [initial]);
  const [title, setTitle] = useState(initial.title);
  const [instructions, setInstructions] = useState(initial.instructions);
  const [questions, setQuestions] = useState<QuestionDraft[]>(initial.questions);
  const [touched, setTouched] = useState<Set<string>>(() => new Set(editing ? initial.questions.map((q) => q.id) : []));
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<{ kind: "discard" } | { kind: "deleteQuestion"; id: string } | null>(null);
  const [feedbackFor, setFeedbackFor] = useState<string | null>(null);

  const current: QuizDraft = { title, instructions, questions };
  const dirty = JSON.stringify(current) !== snapshot;
  const ok = quizIssues(current).length === 0;

  function update(id: string, fn: (q: QuestionDraft) => QuestionDraft) {
    setQuestions((qs) => qs.map((q) => (q.id === id ? fn({ ...q, options: q.options.map((o) => ({ ...o })) }) : q)));
    setTouched((t) => (t.has(id) ? t : new Set(t).add(id)));
  }

  function requestClose() {
    if (busy) return;
    if (dirty) setConfirm({ kind: "discard" });
    else onClose();
  }

  async function save() {
    if (!ok || busy) {
      // Flag every incomplete question so the instructor can see what's missing.
      setTouched(new Set(questions.map((q) => q.id)));
      return;
    }
    setBusy(true);
    const saved = await onSave({ title: title.trim(), instructions: instructions.trim(), questions });
    if (!saved) setBusy(false);
  }

  const fbQuestion = questions.find((q) => q.id === feedbackFor) ?? null;

  return (
    <>
      <SlideOver
        open
        width={520}
        title={editing ? "Edit Quiz" : "Add Quiz"}
        description="Create a quiz to assess learners’ understanding of the course."
        onRequestClose={requestClose}
        onSubmit={save}
        headerAction={
          <Button
            size="sm"
            className="h-[34px] flex-none"
            onClick={() => {
              const q = blankQuestion();
              setQuestions((qs) => [...qs, q]);
            }}
          >
            <PlusIcon size={12} /> Add Question
          </Button>
        }
        footer={
          <>
            <Button variant="outline" onClick={requestClose} disabled={busy}>Cancel</Button>
            <Button type="submit" disabled={!ok} busy={busy} busyLabel="Saving…">Save Quiz</Button>
          </>
        }
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="qzt" className="text-xs font-semibold">Quiz Title</label>
          <TextInput id="qzt" data-autofocus className="h-10 text-[13px]" maxLength={LIMITS.quizTitle} placeholder="e.g. Understanding Legal Foundations" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="qzi" className="text-xs font-semibold">Instruction (Optional)</label>
          <TextArea id="qzi" rows={2} className="text-[13px]" placeholder="Enter a description e.g. “Complete this quiz to receive your CLE certificate”" value={instructions} onChange={(e) => setInstructions(e.target.value)} />
        </div>

        {questions.map((q, qi) => {
          const issues = touched.has(q.id) ? questionIssues(q) : [];
          const flagged = issues.length > 0;
          return (
            <section
              key={q.id}
              aria-label={`Question ${qi + 1}`}
              aria-invalid={flagged || undefined}
              className={clsx("flex flex-col gap-3 rounded-[10px] border p-3.5", flagged ? "border-danger" : "border-line")}
            >
              <div className="flex items-center justify-between gap-2">
                <strong className="text-[13px]">Question {qi + 1}</strong>
                {questions.length > 1 && (
                  <IconButton tone="danger" size={30} aria-label={`Delete question ${qi + 1}`} onClick={() => setConfirm({ kind: "deleteQuestion", id: q.id })}>
                    <TrashIcon size={13} />
                  </IconButton>
                )}
              </div>
              <label className="flex flex-col gap-1.5 text-xs font-semibold">
                Quiz Type
                <Select
                  className="h-10 text-[13px] font-normal"
                  value={q.type}
                  onChange={(e) => {
                    const type = e.target.value as QuestionType;
                    update(q.id, (x) => ({ ...x, type, options: optionsFor(type) }));
                  }}
                >
                  {(Object.keys(QUESTION_TYPES) as QuestionType[]).map((t) => (
                    <option key={t} value={t}>{QUESTION_TYPES[t]}</option>
                  ))}
                </Select>
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-semibold">
                Question
                <TextArea
                  rows={2}
                  maxLength={LIMITS.question}
                  className="text-[13px] font-normal"
                  placeholder="Type your question"
                  value={q.prompt}
                  onChange={(e) => update(q.id, (x) => ({ ...x, prompt: e.target.value }))}
                />
              </label>

              {(q.type === "MC" || q.type === "TF") && (
                <div role="radiogroup" aria-label={`Options for question ${qi + 1}`} className="flex flex-col gap-2">
                  <span className="text-xs text-ink-3">Options — select the correct answer</span>
                  {q.options.map((o, oi) => (
                    <div key={oi} className={clsx("flex min-h-10 items-center gap-2 rounded-control border border-line px-2", o.correct ? "bg-success-tint" : "bg-white")}>
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        checked={o.correct}
                        onChange={() => update(q.id, (x) => ({ ...x, options: x.options.map((y, j) => ({ ...y, correct: j === oi })) }))}
                        aria-label={`Mark option ${oi + 1} as correct`}
                        className="m-0 accent-success"
                      />
                      {q.type === "TF" ? (
                        <span className="flex-1 text-[13px]">{o.text}</span>
                      ) : (
                        <input
                          type="text"
                          value={o.text}
                          maxLength={LIMITS.option}
                          placeholder={`Option ${oi + 1}`}
                          aria-label={`Option ${oi + 1}`}
                          onChange={(e) => {
                            const v = e.target.value;
                            update(q.id, (x) => ({ ...x, options: x.options.map((y, j) => (j === oi ? { ...y, text: v } : y)) }));
                          }}
                          className="h-9 min-w-0 flex-1 border-0 bg-transparent text-[13px] outline-none"
                        />
                      )}
                      {o.correct && <span className="text-[11px] font-semibold text-success">Correct</span>}
                      {q.type === "MC" && q.options.length > 2 && (
                        <IconButton
                          size={28}
                          aria-label={`Remove option ${oi + 1}`}
                          className="text-muted"
                          onClick={() => update(q.id, (x) => ({ ...x, options: x.options.filter((_, j) => j !== oi) }))}
                        >
                          <CloseIcon size={11} />
                        </IconButton>
                      )}
                    </div>
                  ))}
                  {q.type === "MC" && q.options.length < 10 && (
                    <button
                      type="button"
                      onClick={() => update(q.id, (x) => ({ ...x, options: [...x.options, { text: "", correct: false }] }))}
                      className="h-[30px] self-start border-0 bg-transparent p-0 text-xs font-semibold text-primary"
                    >
                      + Add option
                    </button>
                  )}
                </div>
              )}

              {q.type === "SHORT" && (
                <label className="flex flex-col gap-1.5 text-xs font-semibold">
                  Expected answer (optional)
                  <TextInput
                    className="h-10 text-[13px] font-normal"
                    placeholder="A model answer to guide your review"
                    value={q.modelAnswer}
                    onChange={(e) => update(q.id, (x) => ({ ...x, modelAnswer: e.target.value }))}
                  />
                </label>
              )}

              {q.type === "UPLOAD" && (
                <p className="m-0 rounded-control bg-surface-2 px-3 py-2.5 text-xs leading-normal text-ink-2">
                  Learners will answer by uploading an essay or attachment (PDF, DOCX, max 10MB). You’ll review and grade it yourself.
                </p>
              )}

              {q.feedback ? (
                <div className="flex gap-2 rounded-control border border-line bg-surface px-3 py-2.5">
                  <div className="flex flex-1 flex-col gap-1">
                    <strong className="text-xs">Feedback/Explanation</strong>
                    <span className="text-xs leading-normal text-ink-3">{q.feedback}</span>
                  </div>
                  <IconButton size={28} aria-label={`Edit feedback for question ${qi + 1}`} onClick={() => setFeedbackFor(q.id)}>
                    <EditIcon size={13} />
                  </IconButton>
                  <IconButton size={28} aria-label={`Delete feedback for question ${qi + 1}`} className="text-danger" onClick={() => update(q.id, (x) => ({ ...x, feedback: "" }))}>
                    <TrashIcon size={13} />
                  </IconButton>
                </div>
              ) : (
                <button type="button" onClick={() => setFeedbackFor(q.id)} className="h-[30px] self-start border-0 bg-transparent p-0 text-xs font-semibold text-primary underline">
                  Add Feedback
                </button>
              )}

              {flagged && (
                <ul role="alert" className="m-0 list-disc pl-4 text-xs text-danger-text">
                  {issues.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </SlideOver>

      {fbQuestion && (
        <FeedbackDialog
          question={fbQuestion}
          onClose={() => setFeedbackFor(null)}
          onSave={(text) => {
            update(fbQuestion.id, (x) => ({ ...x, feedback: text }));
            setFeedbackFor(null);
          }}
        />
      )}

      <ConfirmDialog
        open={confirm?.kind === "deleteQuestion"}
        title="Delete Question?"
        body="This question and its options will be permanently removed from the quiz."
        confirmLabel="Delete"
        tone="danger"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm?.kind === "deleteQuestion") setQuestions((qs) => qs.filter((q) => q.id !== confirm.id));
          setConfirm(null);
        }}
      />
      <ConfirmDialog
        open={confirm?.kind === "discard"}
        title="Discard Quiz?"
        body="You have unsaved changes. If you leave now, this quiz won’t be saved."
        confirmLabel="Stay on this page"
        cancelLabel="Discard Quiz"
        cancelTone="danger"
        onConfirm={() => setConfirm(null)}
        onCancel={() => {
          setConfirm(null);
          onClose();
        }}
      />
    </>
  );
}
