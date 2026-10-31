"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/Button";
import { FieldMessage, Label, Select, TextArea, TextInput } from "@/components/ui/Field";
import { ImageIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/Logo";
import { MultiSelect, PasswordInput, StepBars, SuccessBadge } from "@/components/ui/Onboarding";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { api, ApiClientError } from "@/lib/api-client";
import { checkPassword } from "@/lib/auth/password-rules";
import { uploadFile } from "@/lib/upload-client";
import { useTaxonomy } from "@/components/TaxonomyProvider";
import { FormBanner } from "./FormBanner";
import { SIGNUP_KEY } from "./hero";

function Header({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-between">
      <Logo />
      <StepBars step={step} />
    </div>
  );
}

/** Inst-Onboarding step 0: account information on one screen. */
export function InstructorSignUpForm() {
  const router = useRouter();
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", pw: "", pw2: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const valid = checkPassword(f.pw, "instructor").valid;
  const mismatch = f.pw2 !== "" && f.pw2 !== f.pw;
  const ready = !!f.firstName.trim() && !!f.lastName.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()) && valid && !!f.pw2 && !mismatch;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api("/api/auth/sign-up", { body: { email: f.email, firstName: f.firstName, lastName: f.lastName, password: f.pw, confirm: f.pw2, role: "instructor" } });
      try {
        sessionStorage.setItem(SIGNUP_KEY, JSON.stringify({ email: f.email.trim().toLowerCase() }));
      } catch {}
      router.push("/instructor/sign-up/verify");
    } catch (err) {
      setError(err instanceof ApiClientError ? { code: err.code, message: err.message } : { code: "", message: "Something went wrong." });
      setBusy(false);
    }
  }

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <Header step={1} />
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 text-[26px] font-bold">Account Information</h1>
        <p className="m-0 text-sm text-ink-3">Let’s set up your instructor account.</p>
      </div>
      {error && (
        <FormBanner>
          {error.message}
          {error.code === "EMAIL_TAKEN" && <> . <a href="/instructor/sign-in" className="font-semibold text-danger-text underline">Sign in</a></>}
        </FormBanner>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5"><Label htmlFor="fn" className="font-medium">First Name</Label><TextInput id="fn" autoComplete="given-name" value={f.firstName} onChange={set("firstName")} /></div>
        <div className="flex flex-col gap-1.5"><Label htmlFor="ln" className="font-medium">Last Name</Label><TextInput id="ln" autoComplete="family-name" value={f.lastName} onChange={set("lastName")} /></div>
      </div>
      <div className="flex flex-col gap-1.5"><Label htmlFor="em" className="font-medium">Email Address</Label><TextInput id="em" type="email" autoComplete="email" placeholder="Enter your email address" value={f.email} onChange={set("email")} /></div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pw" className="font-medium">Password</Label>
        <PasswordInput id="pw" autoComplete="new-password" placeholder="Enter your password" value={f.pw} onChange={set("pw")} />
        {f.pw && <PasswordStrength password={f.pw} role="instructor" showErrors />}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cpw" className="font-medium">Confirm Password</Label>
        <TextInput id="cpw" type="password" autoComplete="new-password" placeholder="Retype your password" value={f.pw2} onChange={set("pw2")} invalid={mismatch} />
        {mismatch && <FieldMessage tone="error">Passwords do not match.</FieldMessage>}
      </div>
      <Button type="submit" disabled={!ready} busy={busy} busyLabel="Creating account…">Continue</Button>
      <p className="m-0 text-center text-xs text-ink-3">By continuing, you agree to Lawdemy’s <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.</p>
    </form>
  );
}

/** "Tell Us About Your Legal Background" (INS-ONB-02). All fields required. */
export function BackgroundForm({ initial, onSaved, submitLabel = "Continue", headerStep = 3 }: {
  initial: { professionalTitle: string | null; yearsExperience: number | null; jurisdictions: string[]; practiceAreas: string[] };
  onSaved?: () => void;
  submitLabel?: string;
  headerStep?: number | null;
}) {
  const taxonomy = useTaxonomy();
  const router = useRouter();
  const [title, setTitle] = useState(initial.professionalTitle ?? "");
  const [yrs, setYrs] = useState(initial.yearsExperience === null ? "" : String(initial.yearsExperience));
  const [jur, setJur] = useState(initial.jurisdictions);
  const [pa, setPa] = useState(initial.practiceAreas);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = !!title && yrs !== "" && Number(yrs) >= 0 && jur.length > 0 && pa.length > 0;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api("/api/instructor/onboarding", { method: "PUT", body: { step: "background", professionalTitle: title, yearsExperience: Number(yrs), jurisdictions: jur, practiceAreas: pa } });
      if (onSaved) onSaved();
      else router.push("/instructor/onboarding/profile");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn’t save. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-5">
      {headerStep && <Header step={headerStep} />}
      {headerStep && (
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-[26px] font-bold">Tell Us About Your Legal Background</h1>
          <p className="m-0 text-sm text-ink-3">This helps learners understand your expertise and builds trust.</p>
        </div>
      )}
      {error && <FormBanner>{error}</FormBanner>}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="role" className="font-medium">Professional Title</Label>
        <Select id="role" value={title} onChange={(e) => setTitle(e.target.value)}>
          <option value="">Select your current professional title</option>
          {taxonomy.professional_title.map((t) => <option key={t}>{t}</option>)}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="yrs" className="font-medium">Years of Experience</Label>
        <TextInput id="yrs" type="number" min={0} max={70} inputMode="numeric" placeholder="e.g. 8" value={yrs} onChange={(e) => setYrs(e.target.value)} />
      </div>
      <MultiSelect label="Jurisdiction" options={taxonomy.jurisdiction} value={jur} onChange={setJur} placeholder="Select where you’re authorised to practise law" searchLabel="Search jurisdiction" />
      <MultiSelect label="Practice Area" options={taxonomy.practice_area} value={pa} onChange={setPa} placeholder="Select your areas of specialisation" searchLabel="Search practice area" />
      <Button type="submit" disabled={!ready} busy={busy} busyLabel="Saving…" className={headerStep ? "" : "self-start"}>{submitLabel}</Button>
    </form>
  );
}

type Links = { linkedin: string; x: string; website: string; other: string };
const LINK_FIELDS: [keyof Links, string, string][] = [
  ["linkedin", "LinkedIn", "linkedin.com/in/your-name"],
  ["x", "X (Twitter)", "x.com/your-handle"],
  ["website", "Website", "your-website.com"],
  ["other", "Other link", "portfolio or publication"],
];
const strip = (v: string) => v.replace(/^https?:\/\//i, "");
export const linkOk = (v: string) => v === "" || /^[^\s/$.?#].[^\s]*\.[^\s]+/.test(v);

/** "Set Up Your Instructor Profile": photo (optional), bio ≤500 with counter, https:// links (INS-ONB-03). */
export function ProfileForm({ initial, onSaved, submitLabel = "Finish", embedded = false }: {
  initial: { bio: string | null; photoUrl: string | null; links: Partial<Links> };
  onSaved?: () => void;
  submitLabel?: string;
  embedded?: boolean;
}) {
  const router = useRouter();
  const file = useRef<HTMLInputElement>(null);
  const [bio, setBio] = useState(initial.bio ?? "");
  const [photoUrl, setPhotoUrl] = useState(initial.photoUrl);
  const [photoId, setPhotoId] = useState<string | null | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [links, setLinks] = useState<Links>({ linkedin: strip(initial.links.linkedin ?? ""), x: strip(initial.links.x ?? ""), website: strip(initial.links.website ?? ""), other: strip(initial.links.other ?? "") });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const badLinks = (Object.keys(links) as (keyof Links)[]).filter((k) => !linkOk(links[k]));
  const ready = bio.trim().length > 0 && bio.length <= 500 && badLinks.length === 0 && !uploading;

  async function pickPhoto(f: File) {
    if (!["image/jpeg", "image/png"].includes(f.type) || f.size > 5 * 1024 * 1024) {
      setError("Upload a JPEG or PNG photo up to 5MB.");
      return;
    }
    setUploading(true);
    try {
      const a = await uploadFile(f, "IMAGE", () => {}, new AbortController().signal);
      setPhotoId(a.id);
      setPhotoUrl(`/api/media/${a.id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    const withScheme = Object.fromEntries((Object.keys(links) as (keyof Links)[]).map((k) => [k, links[k] ? `https://${strip(links[k])}` : ""]));
    try {
      await api("/api/instructor/onboarding", { method: "PUT", body: { step: "profile", bio, links: withScheme, ...(photoId !== undefined ? { photoAssetId: photoId } : {}) } });
      if (onSaved) onSaved();
      else router.push("/instructor/onboarding/done");
    } catch (err) {
      setError(err instanceof ApiClientError ? Object.values(err.fields)[0] ?? err.message : "Couldn’t save. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-5">
      {!embedded && <Header step={4} />}
      {!embedded && (
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-[26px] font-bold">Set Up Your Instructor Profile</h1>
          <p className="m-0 text-sm text-ink-3">Add a photo and short bio so learners know who’s teaching them.</p>
        </div>
      )}
      {error && <FormBanner>{error}</FormBanner>}
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => file.current?.click()} aria-label="Upload profile photo" className="flex h-20 w-20 flex-none items-center justify-center overflow-hidden rounded-full border-[1.5px] border-dashed border-primary bg-[#F4F4FD] text-primary">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {photoUrl ? <img src={photoUrl} alt="" className="h-full w-full object-cover" /> : <ImageIcon size={24} />}
        </button>
        <div className="flex flex-col gap-1 text-xs text-ink-3">
          <span className="text-[13px] font-medium text-ink">{uploading ? "Uploading…" : photoUrl ? "Change photo" : "Upload a profile photo (Optional)"}</span>
          JPEG or PNG, up to 5MB
        </div>
        <input ref={file} type="file" accept="image/jpeg,image/png" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void pickPhoto(f); e.target.value = ""; }} />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between"><Label htmlFor="bio" className="font-medium">Professional Bio</Label><span className={bio.length > 500 ? "text-xs text-danger-text" : "text-xs text-muted"} aria-live="polite">{bio.length}/500</span></div>
        <TextArea id="bio" rows={4} maxLength={500} placeholder="Tell learners about your experience, specialisation and teaching style." value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>
      <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
        <legend className="mb-1 text-[13px] font-medium">Add your website, portfolio or LinkedIn so learners can learn more about you (Optional)</legend>
        {LINK_FIELDS.map(([k, label, ph]) => (
          <div key={k} className="flex flex-col gap-1">
            <label htmlFor={`lk-${k}`} className="text-xs text-ink-3">{label}</label>
            <div className={`flex h-11 overflow-hidden rounded-control border ${badLinks.includes(k) ? "border-danger" : "border-line-input"}`}>
              <span className="flex items-center border-r border-line-input bg-surface px-3 text-sm text-ink-3">https://</span>
              <input id={`lk-${k}`} type="text" inputMode="url" placeholder={ph} value={links[k]} onChange={(e) => setLinks({ ...links, [k]: strip(e.target.value) })} className="min-w-0 flex-1 border-0 bg-white px-3 text-sm outline-none" aria-invalid={badLinks.includes(k) || undefined} />
            </div>
            {badLinks.includes(k) && <FieldMessage tone="error">Enter a valid link.</FieldMessage>}
          </div>
        ))}
      </fieldset>
      <div className={embedded ? "flex" : "grid grid-cols-2 gap-3"}>
        {!embedded && <ButtonLink href="/instructor/onboarding" variant="outline">Back</ButtonLink>}
        <Button type="submit" disabled={!ready} busy={busy} busyLabel="Saving…">{submitLabel}</Button>
      </div>
    </form>
  );
}

/** "You’re all set!" → first-time dashboard (INS-ONB-04). */
export function InstructorAllSet() {
  const router = useRouter();
  const [optIn, setOptIn] = useState(true);
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <Logo />
      <SuccessBadge />
      <h1 className="m-0 text-2xl font-bold">You’re all set!</h1>
      <p className="m-0 text-sm leading-[1.55] text-ink-3">Your instructor account is ready. Head to your dashboard to create your first course.</p>
      <label className="flex cursor-pointer items-start gap-2 text-left text-[13px] text-ink-2">
        <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} className="mt-0.5 accent-primary" />
        I’d like to receive tips and updates for instructors. (Optional)
      </label>
      <Button
        className="w-full"
        busy={busy}
        busyLabel="Loading…"
        onClick={async () => {
          setBusy(true);
          await api("/api/instructor/onboarding", { method: "PUT", body: { step: "done", marketingOptIn: optIn } }).catch(() => {});
          router.push("/instructor/dashboard");
          router.refresh();
        }}
      >
        Proceed to Dashboard
      </Button>
    </div>
  );
}
