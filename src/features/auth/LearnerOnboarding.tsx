"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Radio } from "@/components/ui/Choice";
import { Select } from "@/components/ui/Field";
import { ContinueIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/Logo";
import { MultiSelect, StepBars, SuccessBadge } from "@/components/ui/Onboarding";
import { api, ApiClientError } from "@/lib/api-client";
import { useTaxonomy } from "@/components/TaxonomyProvider";
import { callYears } from "@/lib/taxonomy";
import { FormBanner } from "./FormBanner";

function Header({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-between">
      <Logo />
      <StepBars step={step} />
    </div>
  );
}

type LegalInitial = { isLawyer: boolean | null; callYear: number | null; jurisdictions: string[]; practiceAreas: string[] };

/**
 * SignUp-LegalCredentials. PRD LRN-ONB-04 adds "Are you a lawyer?": Yes expands
 * call-to-bar year, jurisdiction and practice areas; No lets the step be skipped.
 */
export function LegalCredentialsForm({ initial }: { initial: LegalInitial }) {
  const taxonomy = useTaxonomy();
  const router = useRouter();
  const [isLawyer, setIsLawyer] = useState<boolean | null>(initial.isLawyer);
  const [callYear, setCallYear] = useState(initial.callYear ? String(initial.callYear) : "");
  const [jurisdictions, setJurisdictions] = useState(initial.jurisdictions);
  const [practiceAreas, setPracticeAreas] = useState(initial.practiceAreas);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = isLawyer === false || (isLawyer === true && !!callYear && jurisdictions.length > 0 && practiceAreas.length > 0);

  async function save(lawyer: boolean) {
    setBusy(true);
    setError(null);
    try {
      await api("/api/learner/onboarding", {
        method: "PUT",
        body: lawyer ? { step: "legal", isLawyer: true, callYear: Number(callYear), jurisdictions, practiceAreas } : { step: "legal", isLawyer: false },
      });
      router.push("/onboarding/interests");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn’t save. Please try again.");
      setBusy(false);
    }
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready && !busy) void save(isLawyer === true);
      }}
    >
      <Header step={3} />
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 text-[26px] font-bold tracking-[-0.01em]">Legal Credentials</h1>
        <p className="m-0 text-sm text-ink-3">We’d love to know a bit about your legal background to tailor your experience.</p>
      </div>
      {error && <FormBanner>{error}</FormBanner>}
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-1 text-[13px] font-medium">Are you a lawyer?</legend>
        <div className="flex gap-5">
          <Radio name="lawyer" label="Yes, I’m a lawyer" checked={isLawyer === true} onChange={() => setIsLawyer(true)} />
          <Radio name="lawyer" label="No" checked={isLawyer === false} onChange={() => setIsLawyer(false)} />
        </div>
      </fieldset>
      {isLawyer && (
        <>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cy" className="text-[13px] font-medium">Year of call to bar</label>
            <Select id="cy" value={callYear} onChange={(e) => setCallYear(e.target.value)}>
              <option value="">Select year</option>
              {callYears().map((y) => (
                <option key={y}>{y}</option>
              ))}
            </Select>
          </div>
          <MultiSelect
            label="Jurisdiction"
            options={taxonomy.jurisdiction}
            value={jurisdictions}
            onChange={setJurisdictions}
            placeholder="Select where you’re authorised to practise law"
            searchLabel="Search jurisdiction"
          />
          <MultiSelect
            label="Practice Area"
            options={taxonomy.practice_area}
            value={practiceAreas}
            onChange={setPracticeAreas}
            placeholder="Select your practice areas"
            searchLabel="Search practice area"
          />
        </>
      )}
      <Button type="submit" disabled={!ready} busy={busy} busyLabel="Saving…">
        Continue <ContinueIcon />
      </Button>
      {isLawyer !== true && (
        <button type="button" disabled={busy} onClick={() => save(false)} className="self-center border-0 bg-transparent text-[13px] font-semibold text-primary underline">
          Skip for now
        </button>
      )}
    </form>
  );
}

/** SignUp-AreasOfInterest: at least one chip (LRN-ONB-05). */
export function InterestsForm({ initial }: { initial: string[] }) {
  const taxonomy = useTaxonomy();
  const router = useRouter();
  const [picked, setPicked] = useState<string[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finish() {
    if (!picked.length || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api("/api/learner/onboarding", { method: "PUT", body: { step: "interests", interests: picked } });
      router.push("/onboarding/done");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn’t save. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Header step={4} />
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 text-[26px] font-bold tracking-[-0.01em]">Areas of Interest</h1>
        <p className="m-0 text-sm text-ink-3">Choose the topics you’re most interested in. This helps us recommend the right courses for you.</p>
      </div>
      {error && <FormBanner>{error}</FormBanner>}
      <div role="group" aria-label="Areas of interest" className="flex flex-wrap gap-2.5">
        {taxonomy.interest.map((n) => {
          const on = picked.includes(n);
          return (
            <button
              key={n}
              type="button"
              aria-pressed={on}
              onClick={() => setPicked(on ? picked.filter((p) => p !== n) : [...picked, n])}
              className={clsx(
                "h-10 rounded-control px-4 text-[13px] font-medium",
                on ? "border-[1.5px] border-primary bg-[#EEEEFB] text-primary" : "border border-line-input bg-white text-ink-2",
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ButtonLink href="/onboarding/legal-credentials" variant="outline">Back</ButtonLink>
        <Button onClick={finish} disabled={!picked.length} busy={busy} busyLabel="Saving…">Finish</Button>
      </div>
    </div>
  );
}

/** SignUp-AllSet: optional marketing opt-in, then the first-time dashboard (LRN-ONB-06). */
export function AllSetForm() {
  const router = useRouter();
  const [optIn, setOptIn] = useState(true);
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    await api("/api/learner/onboarding", { method: "PUT", body: { step: "done", marketingOptIn: optIn } }).catch(() => {});
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <Logo />
      <SuccessBadge />
      <h1 className="m-0 text-2xl font-bold">You’re all set!</h1>
      <p className="m-0 text-sm leading-[1.55] text-ink-3">
        Your account has been created successfully. You can now explore courses, connect with others, and begin your learning journey.
      </p>
      <label className="flex cursor-pointer items-start gap-2 text-left text-[13px] text-ink-2">
        <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} className="mt-0.5 accent-primary" />
        I would like to receive updates on new courses and events. (Optional)
      </label>
      <Button className="w-full" onClick={go} busy={busy} busyLabel="Loading…">Proceed to Dashboard</Button>
    </div>
  );
}
