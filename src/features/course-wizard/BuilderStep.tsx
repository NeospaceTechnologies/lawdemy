"use client";
import { useState } from "react";
import clsx from "clsx";
import { Button, IconButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChevronDownIcon, ChevronUpIcon, EditIcon, GripIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import { LIMITS, QUESTION_TYPES } from "@/lib/course/constants";
import { htmlToText } from "@/lib/course/rules";
import type { ModuleDraft, QuizDraft } from "@/lib/course/schema";
import { durationLabel } from "@/lib/format";

type Props = {
  modules: ModuleDraft[];
  collapsed: Set<string>;
  quiz: QuizDraft | null;
  publishHints: string[];
  onAddModule: () => void;
  onRenameModule: (id: string, title: string) => void;
  onMoveModule: (from: number, to: number) => void;
  onToggleModule: (id: string) => void;
  onDeleteModule: (id: string) => void;
  onAddLesson: (moduleId: string) => void;
  onEditLesson: (moduleId: string, lessonId: string) => void;
  onDeleteLesson: (moduleId: string, lessonId: string) => void;
  onAddQuiz: () => void;
  onEditQuiz: () => void;
  onDeleteQuiz: () => void;
};

/** Step 3: Course Builder (PRD INS-CRS-05). */
export function BuilderStep(props: Props) {
  const { modules, collapsed, quiz } = props;
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [announce, setAnnounce] = useState("");

  function move(from: number, to: number) {
    if (to < 0 || to >= modules.length || from === to) return;
    props.onMoveModule(from, to);
    setAnnounce(`Module moved to position ${to + 1} of ${modules.length}.`);
  }

  const quizTypes = quiz ? Array.from(new Set(quiz.questions.map((q) => QUESTION_TYPES[q.type]))).join(", ") : "";

  return (
    <section className="flex flex-col gap-4" aria-labelledby="builder-h">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="builder-h" className="m-0 text-lg font-semibold">Course Builder</h2>
        <div className="flex flex-wrap gap-2">
          {quiz ? (
            <>
              <Button variant="danger" size="md" onClick={props.onDeleteQuiz}>Delete Quiz</Button>
              <Button variant="outline" size="md" onClick={props.onEditQuiz}>Edit Quiz</Button>
            </>
          ) : (
            <Button size="md" onClick={props.onAddQuiz}>
              <PlusIcon size={14} /> Add Quiz
            </Button>
          )}
          <Button size="md" onClick={props.onAddModule}>
            <PlusIcon size={14} /> Add Module
          </Button>
        </div>
      </div>

      {props.publishHints.length > 0 && (
        <div className="rounded-card border border-warning-bg bg-[#FFFAEB] px-4 py-3 text-[13px] text-warning-text">
          <strong className="font-semibold">Before you can publish:</strong>
          <ul className="m-0 mt-1 list-disc pl-5">
            {props.publishHints.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>
      )}

      {quiz && (
        <div className="flex items-center gap-3 rounded-card border border-info-border bg-info-tint-2 px-4 py-3">
          <span aria-hidden="true" className="flex h-8 w-8 flex-none items-center justify-center rounded-control bg-info-text text-[13px] font-bold text-white">Q</span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <strong className="text-sm">Final Quiz: {quiz.title}</strong>
            <span className="text-xs text-ink-3">
              {quiz.questions.length} question{quiz.questions.length === 1 ? "" : "s"} • {quizTypes}
            </span>
          </div>
        </div>
      )}

      {modules.length === 0 && <EmptyState dashed body="No modules yet. Use “Add Module” to start structuring your course." />}

      <p className="sr-only" aria-live="polite">{announce}</p>

      {modules.map((m, i) => {
        const open = !collapsed.has(m.id);
        const previews = m.lessons.filter((l) => l.isPreview).length;
        return (
          <article
            key={m.id}
            onDragOver={(e) => {
              if (dragIndex === null) return;
              e.preventDefault();
              setOverIndex(i);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex !== null) move(dragIndex, i);
              setDragIndex(null);
              setOverIndex(null);
            }}
            className={clsx(
              "rounded-card border shadow-card transition-colors",
              overIndex === i && dragIndex !== i ? "border-primary" : "border-line",
              dragIndex === i && "opacity-60",
            )}
          >
            <div className={clsx("flex items-center gap-2.5 px-4 py-3", open && "border-b border-line")}>
              <span
                draggable
                onDragStart={(e) => {
                  setDragIndex(i);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", m.id);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                title="Drag to reorder"
                aria-hidden="true"
                className="hidden cursor-grab text-placeholder sm:block"
              >
                <GripIcon />
              </span>
              <div className="flex flex-col" role="group" aria-label={`Reorder module ${i + 1}`}>
                <button type="button" aria-label={`Move module ${i + 1} up`} disabled={i === 0} onClick={() => move(i, i - 1)} className="flex h-[18px] w-6 items-center justify-center border-0 bg-transparent text-ink-3 disabled:opacity-30">
                  <ChevronUpIcon size={12} />
                </button>
                <button type="button" aria-label={`Move module ${i + 1} down`} disabled={i === modules.length - 1} onClick={() => move(i, i + 1)} className="flex h-[18px] w-6 items-center justify-center border-0 bg-transparent text-ink-3 disabled:opacity-30">
                  <ChevronDownIcon size={12} />
                </button>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <label className="flex items-center gap-1.5 text-sm font-semibold">
                  <span className="whitespace-nowrap">Module {i + 1}:</span>
                  <input
                    type="text"
                    value={m.title}
                    maxLength={LIMITS.title}
                    onChange={(e) => props.onRenameModule(m.id, e.target.value)}
                    aria-label={`Module ${i + 1} title`}
                    placeholder="(Untitled Module)"
                    className="h-[30px] min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 font-semibold outline-none hover:border-line focus:border-primary focus:bg-white"
                  />
                </label>
                <span className="text-xs text-ink-3">
                  {m.lessons.length} lesson{m.lessons.length === 1 ? "" : "s"} • {previews} marked as preview
                </span>
              </div>
              <IconButton
                size={36}
                aria-label={open ? `Collapse module ${i + 1}` : `Expand module ${i + 1}`}
                aria-expanded={open}
                onClick={() => props.onToggleModule(m.id)}
              >
                <ChevronUpIcon className={clsx("transition-transform", !open && "rotate-180")} strokeWidth={2} />
              </IconButton>
            </div>

            {open && (
              <div className="flex flex-col gap-2.5 px-4 py-3">
                {m.lessons.length === 0 && (
                  <div className="flex flex-col gap-1 p-5 text-center">
                    <strong className="text-sm">No Lessons or quizzes added yet</strong>
                    <span className="text-xs text-ink-3">Start by adding at least one lesson to this module.</span>
                  </div>
                )}
                {m.lessons.map((l, k) => (
                  <div key={l.id} className="flex gap-3 rounded-[10px] border border-line px-3 py-2.5 text-xs text-ink-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <strong className="text-[13px] text-ink">
                        Lesson {k + 1}: {l.title}
                      </strong>
                      <span>
                        Lesson Duration: <strong className="font-medium text-ink">{durationLabel(l.durationSeconds, l.durationFormat)}</strong>
                      </span>
                      <span className="truncate">
                        Video Uploaded: <strong className="font-medium text-ink">{l.video ? l.video.fileName : "N/A"}</strong>
                      </span>
                      <span>
                        Text Content Added: <strong className="font-medium text-ink">{htmlToText(l.writeUp) ? "Yes" : "N/A"}</strong>
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {l.isPreview && <span className="inline-flex h-[22px] items-center rounded-full bg-ink px-2 text-[11px] font-semibold text-white">Preview</span>}
                      <div className="flex gap-1.5">
                        <IconButton tone="danger" aria-label={`Delete lesson ${k + 1}`} onClick={() => props.onDeleteLesson(m.id, l.id)}>
                          <TrashIcon />
                        </IconButton>
                        <IconButton tone="outline" aria-label={`Edit lesson ${k + 1}`} onClick={() => props.onEditLesson(m.id, l.id)}>
                          <EditIcon />
                        </IconButton>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end gap-2">
                  <Button variant="danger" size="sm" onClick={() => props.onDeleteModule(m.id)}>Delete Module</Button>
                  <Button size="sm" onClick={() => props.onAddLesson(m.id)}>Add Lesson</Button>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}
