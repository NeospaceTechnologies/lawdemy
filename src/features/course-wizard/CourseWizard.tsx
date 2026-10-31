"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, IconButton } from "@/components/ui/Button";
import { ConfirmDialog, type ConfirmDialogProps } from "@/components/ui/Dialog";
import { ChevronLeftIcon, SaveIcon } from "@/components/ui/icons";
import { Stepper } from "@/components/ui/Stepper";
import { useToast } from "@/components/ui/Toast";
import { useUnsavedChanges } from "@/components/ui/useUnsavedChanges";
import { api, ApiClientError } from "@/lib/api-client";
import { AUTOSAVE_MS, IMAGE_MIME, LIMITS } from "@/lib/course/constants";
import { infoIssues, publishIssues } from "@/lib/course/rules";
import type { CourseDraft, LessonDraft, ModuleDraft, QuizDraft } from "@/lib/course/schema";
import { useUpload, type FileRule } from "@/lib/upload-client";
import { BuilderStep } from "./BuilderStep";
import { InfoStep } from "./InfoStep";
import { LessonPanel } from "./LessonPanel";
import { buildDraft, infoFormFrom, newId, priceFormFrom, priceFormIssues, TOASTS, type InfoForm, type PriceForm, type ToastKey } from "./model";
import { PriceStep } from "./PriceStep";
import { QuizPanel } from "./QuizPanel";

const THUMB_RULE: FileRule = { accept: [...IMAGE_MIME], maxBytes: LIMITS.imageMaxBytes, message: "Upload a JPEG or PNG image up to 5MB." };
const STEP_NAMES = ["Course Information", "Price Information", "Course Builder"];
const DASHBOARD = "/instructor/dashboard";

type Confirm =
  | { kind: "deleteModule"; moduleId: string }
  | { kind: "deleteLesson"; moduleId: string; lessonId: string }
  | { kind: "deleteQuiz" }
  | { kind: "draft" }
  | { kind: "publish" };

type SaveStatus = { state: "idle" | "saving" | "saved" | "error"; at?: Date };

export function CourseWizard({ courseId: initialId, initial, today }: { courseId: string | null; initial: CourseDraft; today: string }) {
  const router = useRouter();
  const toast = useToast();

  const [courseId, setCourseId] = useState(initialId);
  const [step, setStep] = useState(initialId ? initial.wizardStep : 1);
  const [maxStep, setMaxStep] = useState(initial.wizardStep);
  const [info, setInfo] = useState<InfoForm>(() => infoFormFrom(initial));
  const [price, setPrice] = useState<PriceForm>(() => priceFormFrom(initial));
  const [modules, setModules] = useState<ModuleDraft[]>(initial.modules);
  const [quiz, setQuiz] = useState<QuizDraft | null>(initial.quiz);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const thumb = useUpload("IMAGE", THUMB_RULE, initial.info.thumbnail);

  const [lessonPanel, setLessonPanel] = useState<{ moduleId: string; lessonId: string | null; key: number } | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [proceedBusy, setProceedBusy] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ state: "idle" });

  const draftFor = useCallback(
    (over: Partial<{ modules: ModuleDraft[]; quiz: QuizDraft | null; maxStep: number }> = {}) =>
      buildDraft({
        info,
        thumbnail: thumb.asset,
        price,
        modules: over.modules ?? modules,
        quiz: over.quiz !== undefined ? over.quiz : quiz,
        maxStep: over.maxStep ?? maxStep,
        today,
      }),
    [info, thumb.asset, price, modules, quiz, maxStep, today],
  );
  const draft = useMemo(() => draftFor(), [draftFor]);
  const draftJson = JSON.stringify(draft);
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(buildDraft({ ...initialForms(initial), today })));
  const dirty = draftJson !== savedJson;
  useUnsavedChanges(dirty);

  // ---- Saving: one request at a time, in order -------------------------------------------------
  const idRef = useRef(courseId);
  const chain = useRef<Promise<unknown>>(Promise.resolve());

  const persist = useCallback(
    (next: CourseDraft, { silent = false } = {}): Promise<boolean> => {
      const run = async () => {
        setSaveStatus({ state: "saving" });
        try {
          if (idRef.current) {
            await api(`/api/instructor/courses/${idRef.current}`, { method: "PUT", body: next });
          } else {
            const { id } = await api<{ id: string }>("/api/instructor/courses", { body: next });
            idRef.current = id;
            setCourseId(id);
            window.history.replaceState(null, "", `/instructor/courses/${id}/edit`);
          }
          setSavedJson(JSON.stringify(next));
          setSaveStatus({ state: "saved", at: new Date() });
          return true;
        } catch (err) {
          setSaveStatus({ state: "error" });
          if (!silent) {
            toast.show({
              tone: "error",
              title: "Couldn’t save your changes",
              body: err instanceof ApiClientError ? err.message : "Please try again.",
            });
          }
          if (err instanceof ApiClientError && err.status === 401) router.replace("/instructor/sign-in");
          return false;
        }
      };
      const p = chain.current.then(run, run);
      chain.current = p;
      return p;
    },
    [router, toast],
  );

  // Auto-save drafts every 30 s (PRD INS-CRS-09).
  const latest = useRef({ draft, dirty, uploading: false });
  latest.current = { draft, dirty, uploading: thumb.state.status === "uploading" };
  useEffect(() => {
    const t = setInterval(() => {
      const { draft: d, dirty: isDirty, uploading } = latest.current;
      if (isDirty && !uploading && saveStatus.state !== "saving") void persist(d, { silent: true });
    }, AUTOSAVE_MS);
    return () => clearInterval(t);
  }, [persist, saveStatus.state]);

  /** Save a structural change and only apply it locally once the server has it. */
  async function commit(over: { modules?: ModuleDraft[]; quiz?: QuizDraft | null }, toastKey: ToastKey) {
    const ok = await persist(draftFor(over));
    if (!ok) return false;
    if (over.modules) setModules(over.modules);
    if (over.quiz !== undefined) setQuiz(over.quiz);
    toast.show(TOASTS[toastKey]);
    return true;
  }

  // ---- Step rules ------------------------------------------------------------------------------
  const infoValid = infoIssues(draft.info).length === 0;
  const priceIssues = priceFormIssues(price, today);
  const priceValid = Object.keys(priceIssues).length === 0;
  const reachable = [true, maxStep >= 2 && infoValid, maxStep >= 3 && infoValid && priceValid];
  const uploadingThumb = thumb.state.status === "uploading";
  const issues = publishIssues(draft, today);
  const canPublish = issues.length === 0 && priceValid && !uploadingThumb;
  const hasLesson = modules.some((m) => m.lessons.length > 0);

  async function leave() {
    // Cancel returns to the dashboard with the draft saved (PRD 6.3).
    if (dirty) {
      const ok = await persist(draft);
      if (!ok) return;
      toast.show(TOASTS.draft);
    }
    router.push(DASHBOARD);
  }

  async function proceedToBuilder() {
    if (!priceValid) return;
    setProceedBusy(true);
    const ok = await persist(draftFor({ maxStep: 3 }));
    setProceedBusy(false);
    if (!ok) return;
    setMaxStep(3);
    setStep(3);
    toast.show(TOASTS.price);
  }

  // ---- Lessons and quiz --------------------------------------------------------------------------
  async function saveLesson(moduleId: string, lesson: LessonDraft, isNew: boolean) {
    const next = modules.map((m) =>
      m.id !== moduleId ? m : { ...m, lessons: isNew ? [...m.lessons, lesson] : m.lessons.map((l) => (l.id === lesson.id ? lesson : l)) },
    );
    const ok = await commit({ modules: next }, isNew ? "lesson" : "lessonUpdated");
    if (ok) {
      setLessonPanel(null);
      setCollapsed((c) => {
        const n = new Set(c);
        n.delete(moduleId);
        return n;
      });
    }
    return ok;
  }

  async function saveQuiz(q: QuizDraft) {
    const ok = await commit({ quiz: q }, quiz ? "quizUpdated" : "quizAdded");
    if (ok) setQuizOpen(false);
    return ok;
  }

  // ---- Confirm dialogs -----------------------------------------------------------------------------
  async function runConfirm() {
    if (!confirm) return;
    setConfirmBusy(true);
    let close = true;
    if (confirm.kind === "deleteModule") {
      await commit({ modules: modules.filter((m) => m.id !== confirm.moduleId) }, "module");
    } else if (confirm.kind === "deleteLesson") {
      const next = modules.map((m) => (m.id === confirm.moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== confirm.lessonId) } : m));
      await commit({ modules: next }, "lessonDeleted");
    } else if (confirm.kind === "deleteQuiz") {
      await commit({ quiz: null }, "quizDeleted");
    } else if (confirm.kind === "draft") {
      if (await persist(draft)) toast.show(TOASTS.draft);
    } else if (confirm.kind === "publish") {
      close = await publish();
    }
    setConfirmBusy(false);
    if (close) setConfirm(null);
  }

  async function publish() {
    if (!(await persist(draft))) return true;
    try {
      await api(`/api/instructor/courses/${idRef.current}/submit`, { method: "POST" });
      toast.show(TOASTS.published);
      setSavedJson(draftJson); // nothing left to warn about on leave
      router.push(DASHBOARD);
      router.refresh();
    } catch (err) {
      toast.show({ tone: "error", title: "Couldn’t submit your course", body: err instanceof ApiClientError ? err.message : "Please try again." });
    }
    return true;
  }

  const confirmProps: Record<Confirm["kind"], Omit<ConfirmDialogProps, "open" | "onConfirm" | "onCancel">> = {
    deleteModule: { title: "Delete Module and its Content?", body: "This will permanently remove the module and every lesson in it. This action cannot be undone.", confirmLabel: "Delete", cancelLabel: "Stay on Page", tone: "danger", busyLabel: "Deleting…" },
    deleteLesson: { title: "Delete Lesson?", body: "This lesson will be permanently removed from the module. All content added to it will be lost. Are you sure you want to proceed?", confirmLabel: "Delete", tone: "danger", busyLabel: "Deleting…" },
    deleteQuiz: { title: "Delete this Quiz?", body: "The quiz and all its questions will be permanently removed. Learners won’t be able to take it.", confirmLabel: "Delete", tone: "danger", busyLabel: "Deleting…" },
    draft: { title: "Save changes to Drafts?", body: "Your course will be saved as a draft. You can pick up where you left off anytime.", confirmLabel: "Save to Drafts", busyLabel: "Saving…" },
    publish: { title: "Ready to Publish Your course?", body: "Make sure everything is in place. Your course will be reviewed by the Lawdemy team before it goes live to learners.", note: "Estimated review time: 24–48 hours", confirmLabel: "Publish Course", busyLabel: "Publishing…" },
  };

  const panelModule = lessonPanel && modules.find((m) => m.id === lessonPanel.moduleId);
  const panelLesson = panelModule && lessonPanel?.lessonId ? (panelModule.lessons.find((l) => l.id === lessonPanel.lessonId) ?? null) : null;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <IconButton aria-label="Back to dashboard" size={36} className="rounded-full border border-line" onClick={leave}>
          <ChevronLeftIcon />
        </IconButton>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs text-muted" aria-live="polite">
            {saveStatus.state === "saving" ? "Saving…" : saveStatus.state === "error" ? "Couldn’t auto-save" : saveStatus.state === "saved" && !dirty ? "All changes saved" : ""}
          </span>
          {step === 3 && (
            <Button variant="outline" size="md" onClick={leave}>Cancel</Button>
          )}
          <Button variant="outline" size="md" onClick={() => setConfirm({ kind: "draft" })}>
            <SaveIcon /> Save Draft
          </Button>
          {step === 3 && (
            <Button size="md" disabled={!canPublish} title={canPublish ? undefined : issues[0]} onClick={() => setConfirm({ kind: "publish" })}>
              Publish Course
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-[28px] font-bold tracking-[-0.01em]">Create Course</h1>
        <p className="m-0 text-sm text-ink-3">
          Craft your course by sharing what you know best. Start with a strong foundation, then build engaging modules your learners will love.
        </p>
      </div>

      <Stepper steps={STEP_NAMES.map((label, i) => ({ label, reachable: reachable[i] || i + 1 === step }))} current={step} onSelect={setStep} />

      {step === 1 && (
        <InfoStep
          value={info}
          onChange={(p) => setInfo((v) => ({ ...v, ...p }))}
          thumbnail={thumb.state}
          onThumbnail={(f) => void thumb.start(f)}
          canProceed={infoValid && !uploadingThumb}
          onProceed={() => {
            setMaxStep((m) => Math.max(m, 2));
            setStep(2);
          }}
          onCancel={leave}
        />
      )}

      {step === 2 && (
        <PriceStep
          value={price}
          onChange={(p) => setPrice((v) => ({ ...v, ...p }))}
          issues={priceIssues}
          today={today}
          busy={proceedBusy}
          onBack={() => setStep(1)}
          onProceed={proceedToBuilder}
        />
      )}

      {step === 3 && (
        <BuilderStep
          modules={modules}
          collapsed={collapsed}
          quiz={quiz}
          publishHints={hasLesson && !canPublish ? issues : []}
          onAddModule={() => setModules((ms) => [...ms, { id: newId(), title: "", lessons: [] }])}
          onRenameModule={(id, title) => setModules((ms) => ms.map((m) => (m.id === id ? { ...m, title } : m)))}
          onMoveModule={(from, to) =>
            setModules((ms) => {
              const next = ms.slice();
              const [moved] = next.splice(from, 1);
              next.splice(to, 0, moved);
              return next;
            })
          }
          onToggleModule={(id) =>
            setCollapsed((c) => {
              const n = new Set(c);
              if (n.has(id)) n.delete(id);
              else n.add(id);
              return n;
            })
          }
          onDeleteModule={(moduleId) => setConfirm({ kind: "deleteModule", moduleId })}
          onAddLesson={(moduleId) => setLessonPanel({ moduleId, lessonId: null, key: Date.now() })}
          onEditLesson={(moduleId, lessonId) => setLessonPanel({ moduleId, lessonId, key: Date.now() })}
          onDeleteLesson={(moduleId, lessonId) => setConfirm({ kind: "deleteLesson", moduleId, lessonId })}
          onAddQuiz={() => setQuizOpen(true)}
          onEditQuiz={() => setQuizOpen(true)}
          onDeleteQuiz={() => setConfirm({ kind: "deleteQuiz" })}
        />
      )}

      {lessonPanel && panelModule && (
        <LessonPanel
          key={lessonPanel.key}
          lesson={panelLesson}
          onClose={() => setLessonPanel(null)}
          onFileRemoved={() => toast.show(TOASTS.file)}
          onSave={(l) => saveLesson(lessonPanel.moduleId, l, panelLesson === null)}
        />
      )}

      {quizOpen && <QuizPanel quiz={quiz} onClose={() => setQuizOpen(false)} onSave={saveQuiz} />}

      {confirm && (
        <ConfirmDialog
          open
          {...confirmProps[confirm.kind]}
          busy={confirmBusy}
          onConfirm={runConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}

function initialForms(d: CourseDraft) {
  return {
    info: infoFormFrom(d),
    price: priceFormFrom(d),
    thumbnail: d.info.thumbnail,
    modules: d.modules,
    quiz: d.quiz,
    maxStep: d.wizardStep,
  };
}
