"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import { Radio, Switch } from "@/components/ui/Choice";
import { Select } from "@/components/ui/Field";
import { MultiSelect } from "@/components/ui/Onboarding";
import { useToast } from "@/components/ui/Toast";
import { api, ApiClientError } from "@/lib/api-client";
import { useTaxonomy } from "@/components/TaxonomyProvider";
import { callYears } from "@/lib/taxonomy";

type Prefs = { courseUpdates: boolean; qaReplies: boolean; communityReplies: boolean; enrolments: boolean };
export type LearnerPrefsData = {
  marketingOptIn: boolean;
  prefs: Prefs;
  legal: { isLawyer: boolean | null; callYear: number | null; jurisdictions: string[]; practiceAreas: string[] } | null;
  interests: string[] | null;
};

const PREF_LABELS: Record<keyof Prefs, [string, string]> = {
  courseUpdates: ["Course updates", "New modules, announcements and quiz reminders"],
  qaReplies: ["Questions and answers", "Replies to your questions (instructors: new learner questions)"],
  communityReplies: ["Community replies", "When someone replies to your post"],
  enrolments: ["Enrolments", "When a learner enrols in your course (instructors)"],
};

/**
 * Settings → Notifications and Preferences. Not drawn in the designs; built from
 * PRD LRN-ACC-03 (legal credentials, interests, notification preferences).
 */
export function PreferencesSettings({ data, showEnrolments }: { data: LearnerPrefsData; showEnrolments?: boolean }) {
  const taxonomy = useTaxonomy();
  const router = useRouter();
  const toast = useToast();
  const [prefs, setPrefs] = useState(data.prefs);
  const [marketing, setMarketing] = useState(data.marketingOptIn);
  const [legal, setLegal] = useState(data.legal);
  const [interests, setInterests] = useState(data.interests);
  const [busy, setBusy] = useState("");

  async function savePrefs() {
    setBusy("prefs");
    try {
      await api("/api/account/preferences", { method: "PUT", body: { marketingOptIn: marketing, prefs } });
      toast.show({ title: "Changes Saved", body: "Your notification preferences have been updated." });
    } catch (err) {
      toast.show({ tone: "error", title: "Couldn’t save", body: err instanceof ApiClientError ? err.message : undefined });
    } finally {
      setBusy("");
    }
  }

  async function saveLegal() {
    if (!legal) return;
    setBusy("legal");
    try {
      await api("/api/learner/onboarding", {
        method: "PUT",
        body: legal.isLawyer ? { step: "legal", isLawyer: true, callYear: legal.callYear, jurisdictions: legal.jurisdictions, practiceAreas: legal.practiceAreas } : { step: "legal", isLawyer: false },
      });
      toast.show({ title: "Changes Saved", body: "Your legal credentials have been updated." });
      router.refresh();
    } catch (err) {
      toast.show({ tone: "error", title: "Couldn’t save", body: err instanceof ApiClientError ? err.message : undefined });
    } finally {
      setBusy("");
    }
  }

  async function saveInterests() {
    if (!interests?.length) return;
    setBusy("interests");
    try {
      await api("/api/learner/onboarding", { method: "PUT", body: { step: "interests", interests } });
      toast.show({ title: "Changes Saved", body: "Your recommendations will reflect your new interests." });
    } catch (err) {
      toast.show({ tone: "error", title: "Couldn’t save", body: err instanceof ApiClientError ? err.message : undefined });
    } finally {
      setBusy("");
    }
  }

  const legalOk = !legal || legal.isLawyer === false || (legal.isLawyer === true && !!legal.callYear && legal.jurisdictions.length > 0 && legal.practiceAreas.length > 0);
  const card = "flex flex-col gap-4 rounded-card border border-line p-5";

  return (
    <div className="flex max-w-[760px] flex-col gap-6">
      <section className={card}>
        <h2 className="m-0 text-base font-semibold">Notifications</h2>
        {(Object.keys(PREF_LABELS) as (keyof Prefs)[]).filter((k) => showEnrolments || k !== "enrolments").map((k) => (
          <div key={k} className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5"><span className="text-sm font-medium">{PREF_LABELS[k][0]}</span><span className="text-xs text-ink-3">{PREF_LABELS[k][1]}</span></div>
            <Switch checked={prefs[k]} onChange={(v) => setPrefs({ ...prefs, [k]: v })} label={<span className="sr-only">{PREF_LABELS[k][0]}</span>} />
          </div>
        ))}
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5"><span className="text-sm font-medium">News and events</span><span className="text-xs text-ink-3">Updates on new courses and events</span></div>
          <Switch checked={marketing} onChange={setMarketing} label={<span className="sr-only">News and events</span>} />
        </div>
        <p className="m-0 text-xs text-ink-3">Payment receipts, payouts and account security messages are always sent.</p>
        <Button size="md" className="self-start" busy={busy === "prefs"} busyLabel="Saving…" onClick={savePrefs}>Save preferences</Button>
      </section>

      {legal && (
        <section className={card}>
          <h2 className="m-0 text-base font-semibold">Legal credentials</h2>
          <div className="flex gap-5">
            <Radio name="pref-lawyer" label="I’m a lawyer" checked={legal.isLawyer === true} onChange={() => setLegal({ ...legal, isLawyer: true })} />
            <Radio name="pref-lawyer" label="I’m not a lawyer" checked={legal.isLawyer === false} onChange={() => setLegal({ ...legal, isLawyer: false })} />
          </div>
          {legal.isLawyer && (
            <>
              <label className="flex flex-col gap-1.5 text-[13px] font-medium">
                Year of call to bar
                <Select value={legal.callYear ? String(legal.callYear) : ""} onChange={(e) => setLegal({ ...legal, callYear: Number(e.target.value) || null })}>
                  <option value="">Select year</option>
                  {callYears().map((y) => <option key={y}>{y}</option>)}
                </Select>
              </label>
              <MultiSelect label="Jurisdiction" options={taxonomy.jurisdiction} value={legal.jurisdictions} onChange={(v) => setLegal({ ...legal, jurisdictions: v })} placeholder="Select jurisdictions" searchLabel="Search jurisdiction" />
              <MultiSelect label="Practice Area" options={taxonomy.practice_area} value={legal.practiceAreas} onChange={(v) => setLegal({ ...legal, practiceAreas: v })} placeholder="Select practice areas" searchLabel="Search practice area" />
            </>
          )}
          <Button size="md" className="self-start" disabled={!legalOk} busy={busy === "legal"} busyLabel="Saving…" onClick={saveLegal}>Save credentials</Button>
        </section>
      )}

      {interests && (
        <section className={card}>
          <h2 className="m-0 text-base font-semibold">Areas of interest</h2>
          <div role="group" aria-label="Areas of interest" className="flex flex-wrap gap-2.5">
            {taxonomy.interest.map((n) => {
              const on = interests.includes(n);
              return (
                <button key={n} type="button" aria-pressed={on} onClick={() => setInterests(on ? interests.filter((x) => x !== n) : [...interests, n])} className={clsx("h-10 rounded-control px-4 text-[13px] font-medium", on ? "border-[1.5px] border-primary bg-[#EEEEFB] text-primary" : "border border-line-input bg-white text-ink-2")}>
                  {n}
                </button>
              );
            })}
          </div>
          <Button size="md" className="self-start" disabled={!interests.length} busy={busy === "interests"} busyLabel="Saving…" onClick={saveInterests}>Save interests</Button>
        </section>
      )}
    </div>
  );
}
