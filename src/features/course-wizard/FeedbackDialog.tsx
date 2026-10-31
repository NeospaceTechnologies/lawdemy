"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { TextArea } from "@/components/ui/Field";
import { LIMITS } from "@/lib/course/constants";
import type { QuestionDraft } from "@/lib/course/schema";

/** Add/Edit Feedback for one quiz question. Shown to learners after they submit. */
export function FeedbackDialog({
  question,
  onSave,
  onClose,
}: {
  question: QuestionDraft;
  onSave: (text: string) => void;
  onClose: () => void;
}) {
  const editing = question.feedback !== "";
  const [text, setText] = useState(question.feedback);
  const ok = text.trim() !== "";
  return (
    <Dialog
      open
      title={editing ? "Edit Feedback" : "Add Feedback"}
      description="Feedback for each question helps learners understand their mistakes. It’s shown after they submit the quiz."
      onRequestClose={onClose}
    >
      <p className="m-0 text-[13px] font-semibold">{question.prompt.trim() || "Untitled question"}</p>
      {question.options.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {question.options.map((o, i) => (
            <li key={i} className="flex items-center justify-between gap-2 rounded-control border border-line px-2.5 py-2 text-xs">
              {o.text || "(empty option)"}
              {o.correct && <span className="text-[11px] font-semibold text-success">Correct answer</span>}
            </li>
          ))}
        </ul>
      )}
      <label className="flex flex-col gap-1.5 text-xs font-semibold">
        Enter Feedback
        <TextArea
          rows={4}
          data-autofocus
          maxLength={LIMITS.feedback}
          className="text-[13px] font-normal"
          placeholder="Explain why the correct answer is right"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      <div className="grid grid-cols-2 gap-2.5">
        <Button variant="outline" className="h-[42px]" onClick={onClose}>Cancel</Button>
        <Button className="h-[42px]" disabled={!ok} onClick={() => onSave(text.trim())}>Save</Button>
      </div>
    </Dialog>
  );
}
