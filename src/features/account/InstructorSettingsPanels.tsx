"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Bank } from "@/components/ui/BankAccountForm";
import { Button } from "@/components/ui/Button";
import { SlideOver } from "@/components/ui/SlideOver";
import { FieldMessage } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/Onboarding";
import { PinInput } from "@/components/ui/PinInput";
import { useToast } from "@/components/ui/Toast";
import { BackgroundForm, ProfileForm } from "@/features/auth/InstructorOnboarding";
import { BankSetupPanel } from "@/features/earnings/BankSetupPanel";
import { api, ApiClientError } from "@/lib/api-client";
import type { BankAccountView } from "@/lib/banking";

type Background = Parameters<typeof BackgroundForm>[0]["initial"];
type Profile = Parameters<typeof ProfileForm>[0]["initial"];
const LINK_LABELS: Record<string, string> = { linkedin: "LinkedIn", x: "X", website: "Website", other: "Other" };

/**
 * Instructor-only sections of Settings → Account (Inst-Settings.dc.html): Legal Background,
 * Profile and Payout Preference, each edited in a slide-over.
 */
export function InstructorAccountSections({ background, profile, accounts, banks, hasPin, email }: { background: Background; profile: Profile; accounts: BankAccountView[]; banks: Bank[]; hasPin: boolean; email: string }) {
  const toast = useToast();
  const router = useRouter();
  const [panel, setPanel] = useState<null | "legal" | "profile" | "pin" | "addBank" | "editBank">(null);
  const def = accounts.find((a) => a.isDefault) ?? accounts[0];
  const head = "flex flex-wrap items-center justify-between gap-3";
  const edit = "h-9 rounded-control border-0 bg-primary px-3.5 text-[13px] font-semibold text-white hover:bg-primary-hover";
  const action = "inline-flex h-[42px] min-w-[120px] items-center justify-center rounded-control border-0 bg-primary px-4 text-[13px] font-semibold text-white hover:bg-primary-hover disabled:bg-primary-disabled";
  const field = "flex h-[42px] items-center rounded-control border border-line bg-surface px-3 text-sm";
  const saved = (body: string) => {
    setPanel(null);
    toast.show({ title: "Changes Saved", body });
    router.refresh();
  };
  const links = Object.entries(profile.links).filter(([, v]) => v);
  return (
    <>
      <section className="flex flex-col gap-3 border-t border-line pt-6">
        <div className={head}>
          <h2 className="m-0 text-xl font-semibold">Legal Background</h2>
          <button type="button" className={edit} onClick={() => setPanel("legal")}>Edit</button>
        </div>
        <dl className="m-0 grid grid-cols-[minmax(140px,auto)_1fr] gap-x-4 gap-y-2.5 text-[13px]">
          <dt className="text-ink-3">Professional Title</dt><dd className="m-0 font-medium">{background.professionalTitle || "—"}</dd>
          <dt className="text-ink-3">Years of Experience</dt><dd className="m-0 font-medium">{background.yearsExperience === null ? "—" : `${background.yearsExperience} years`}</dd>
          <dt className="text-ink-3">Jurisdiction</dt><dd className="m-0 font-medium">{background.jurisdictions.join(", ") || "—"}</dd>
          <dt className="text-ink-3">Practice Areas</dt><dd className="m-0 font-medium">{background.practiceAreas.join(", ") || "—"}</dd>
        </dl>
      </section>

      <section className="flex flex-col gap-3 border-t border-line pt-6">
        <div className={head}>
          <h2 className="m-0 text-xl font-semibold">Profile</h2>
          <button type="button" className={edit} onClick={() => setPanel("profile")}>Edit</button>
        </div>
        <p className="m-0 text-[13px] leading-[1.6] text-ink-2">{profile.bio || "Add a short bio so learners know who’s teaching them."}</p>
        {links.length > 0 && (
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {links.map(([k, v]) => <li key={k} className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-ink-2">{LINK_LABELS[k] ?? k}: {String(v).replace(/^https?:\/\//, "")}</li>)}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4 border-t border-line pt-6">
        <h2 className="m-0 text-xl font-semibold">Payout Preference</h2>
        {def ? (
          <>
            <div className="flex items-end gap-3">
              <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-xs font-semibold">Bank Account
                <span className={field + " font-normal"}>{def.bankName} (******{def.last4})</span>
              </label>
              <button type="button" className={action} onClick={() => setPanel("editBank")}>Edit</button>
            </div>
            {def.usableFrom && <span className="-mt-2 text-xs text-warning-text">Available for withdrawals after 24 hours.</span>}
            <div className="flex items-end gap-3">
              <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-xs font-semibold">Transaction PIN
                <span className={field + " font-normal tracking-[0.2em]"}>{hasPin ? "••••" : "Not set"}</span>
              </label>
              <button type="button" className={action} disabled={!hasPin} onClick={() => setPanel("pin")}>Change</button>
            </div>
          </>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-dashed border-line-input p-4">
            <span className="text-[13px] text-ink-3">Add a verified bank account to receive your earnings.</span>
            <Button size="md" onClick={() => setPanel("addBank")}>Add Bank Info</Button>
          </div>
        )}
      </section>

      <SlideOver open={panel === "legal"} title="Legal Background" description="This helps learners understand your qualifications and professional standing." onRequestClose={() => setPanel(null)}>
        <BackgroundForm headerStep={null} initial={background} submitLabel="Save Changes" onSaved={() => saved("Your legal background has been updated.")} />
      </SlideOver>
      <SlideOver open={panel === "profile"} title="Profile" description="Update your public-facing info as an instructor." onRequestClose={() => setPanel(null)}>
        <ProfileForm embedded initial={profile} submitLabel="Save Changes" onSaved={() => saved("Your public profile has been updated.")} />
      </SlideOver>
      <SlideOver open={panel === "pin"} title="Update Transaction Pin" description="For your security, confirm your account password before choosing a new PIN." onRequestClose={() => setPanel(null)}>
        <PinSettings hasPin={hasPin} onDone={() => setPanel(null)} />
      </SlideOver>
      {(panel === "addBank" || panel === "editBank") && (
        <BankSetupPanel
          mode={panel === "addBank" ? "add" : "edit"}
          banks={banks}
          hasPin={hasPin}
          email={email}
          onClose={() => setPanel(null)}
          onSaved={(m) => { if (m) toast.show(m); router.refresh(); }}
        />
      )}
    </>
  );
}

/** Transaction PIN: confirm the account password, then set a new PIN (INS-SET, INS-PAY-08). */
export function PinSettings({ hasPin, onDone }: { hasPin: boolean; onDone?: () => void }) {
  const toast = useToast();
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const mismatch = p2 !== "" && p1 !== p2;
  if (!hasPin) return <p className="m-0 max-w-[640px] text-[13px] text-ink-3">You’ll create your transaction PIN when you add your bank account under Payout Preference.</p>;
  async function save() {
    setBusy(true);
    setErr(null);
    try {
      await api("/api/instructor/pin", { method: "PUT", body: { password: pw, pin: p1, confirm: p2 } });
      toast.show({ title: "Transaction PIN Updated", body: "Use your new PIN for future withdrawals." });
      setPw(""); setP1(""); setP2("");
      onDone?.();
      router.refresh();
    } catch (e) {
      setErr(e instanceof ApiClientError ? e.message : "Couldn’t update your PIN.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex max-w-[480px] flex-col gap-5">
      <div role="note" className="rounded-control border border-info-border bg-info-tint-2 px-3 py-2.5 text-xs leading-normal text-info-text"><strong>Tip</strong><br />For security reasons, we recommend choosing a PIN different from your account or device password.</div>
      <label className="flex flex-col gap-1.5 text-xs font-semibold">Enter your account password
        <PasswordInput value={pw} onChange={(e) => setPw(e.target.value)} />
      </label>
      <div className="flex flex-wrap gap-6">
        <PinInput label="New 4-digit PIN" value={p1} onChange={setP1} size="md" />
        <PinInput label="Confirm New PIN" value={p2} onChange={setP2} size="md" error={mismatch} message={mismatch ? "PINs do not match." : undefined} />
      </div>
      {err && <FieldMessage tone="error">{err}</FieldMessage>}
      <Button className="self-start" disabled={!pw || !/^\d{4}$/.test(p1) || p1 !== p2} busy={busy} busyLabel="Updating…" onClick={save}>Update Transaction PIN</Button>
    </div>
  );
}
