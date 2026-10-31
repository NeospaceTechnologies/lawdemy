"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, ButtonLink, buttonClass } from "@/components/ui/Button";
import { FieldMessage, Label, TextInput } from "@/components/ui/Field";
import { BulbIcon, ContinueIcon, MailIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/Logo";
import { PasswordInput, StepBars, SuccessBadge } from "@/components/ui/Onboarding";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { useToast } from "@/components/ui/Toast";
import { api, ApiClientError } from "@/lib/api-client";
import { checkPassword } from "@/lib/auth/password-rules";
import { FormBanner } from "./FormBanner";
import { SIGNUP_KEY } from "./hero";

type Role = "learner" | "instructor";
type Draft = { email: string; firstName?: string; lastName?: string };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readDraft(): Draft | null {
  try {
    return JSON.parse(sessionStorage.getItem(SIGNUP_KEY) ?? "null");
  } catch {
    return null;
  }
}
function writeDraft(d: Draft) {
  try {
    sessionStorage.setItem(SIGNUP_KEY, JSON.stringify(d));
  } catch {}
}
export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  return domain ? `${local.slice(0, 6)}****@${domain}` : email;
}

function Header({ step, total = 4 }: { step?: number; total?: number }) {
  return (
    <div className="flex items-center justify-between">
      <Logo />
      {step && <StepBars step={step} total={total} />}
    </div>
  );
}

/** Main.dc.html: step 1, email only. Tells the person if the email is taken (PRD 4.1). */
export function SignUpEmailForm({ role, next, signInHref }: { role: Role; next: string; signInHref: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const valid = EMAIL_RE.test(email.trim());

  useEffect(() => {
    const d = readDraft();
    if (d?.email) setEmail(d.email);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api("/api/auth/check-email", { body: { email, role } });
      writeDraft({ ...readDraft(), email: email.trim().toLowerCase() });
      router.push(next);
    } catch (err) {
      setError(err instanceof ApiClientError ? { code: err.code, message: err.message } : { code: "", message: "Something went wrong." });
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-[22px]">
      <Header step={1} />
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 text-[26px] font-bold tracking-[-0.01em]">Create Your Account</h1>
        <p className="m-0 text-sm text-ink-3">Join Lawdemy and start building your legal knowledge.</p>
      </div>
      {error && (
        <FormBanner>
          {error.message}
          {error.code === "EMAIL_TAKEN" && (
            <>
              . <Link href={signInHref} className="font-semibold text-danger-text underline">Sign in</Link>
            </>
          )}
        </FormBanner>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email" className="font-medium">Email address</Label>
        <TextInput id="email" type="email" autoComplete="email" className="px-3.5" placeholder="Enter your email address" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <Button type="submit" disabled={!valid} busy={busy} busyLabel="Checking…">
        Continue <ContinueIcon />
      </Button>
      <p className="m-0 text-center text-xs text-ink-3">
        By continuing, you agree to Lawdemy’s <a href="/terms" className="underline">Terms of Use</a> and <a href="/privacy" className="underline">Privacy Policy</a>.
      </p>
    </form>
  );
}

/** SignUp-AccountInfo: names + password with the live checklist; creates the account. */
export function AccountInfoForm({ role, back, next }: { role: Role; back: string; next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const d = readDraft();
    if (!d?.email) router.replace(back);
    else {
      setEmail(d.email);
      setFirstName(d.firstName ?? "");
      setLastName(d.lastName ?? "");
    }
  }, [back, router]);

  const { valid } = checkPassword(pw, role);
  const mismatch = pw2 !== "" && pw2 !== pw;
  const ready = !!firstName.trim() && !!lastName.trim() && valid && pw2 !== "" && !mismatch;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || busy || !email) return;
    setBusy(true);
    setError(null);
    try {
      await api("/api/auth/sign-up", { body: { email, firstName, lastName, password: pw, confirm: pw2, role } });
      writeDraft({ email, firstName, lastName });
      router.push(next);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "We couldn’t create your account. Please try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <Header step={2} />
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 text-[26px] font-bold tracking-[-0.01em]">Account Information</h1>
        <p className="m-0 text-sm text-ink-3">Tell us a little about yourself to set up your profile.</p>
      </div>
      {error && <FormBanner>{error}</FormBanner>}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fn" className="font-medium">First name</Label>
          <TextInput id="fn" autoComplete="given-name" className="px-3.5" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ln" className="font-medium">Last name</Label>
          <TextInput id="ln" autoComplete="family-name" className="px-3.5" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pw" className="font-medium">Password</Label>
        <PasswordInput id="pw" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} aria-describedby="pw-rules" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pw2" className="font-medium">Confirm password</Label>
        <TextInput id="pw2" type="password" autoComplete="new-password" className="px-3.5" placeholder="Re-enter your password" value={pw2} onChange={(e) => setPw2(e.target.value)} invalid={mismatch} />
        {mismatch && <FieldMessage tone="error">Passwords do not match.</FieldMessage>}
      </div>
      <PasswordStrength id="pw-rules" password={pw} role={role} showErrors={pw.length > 0} />
      <div className="grid grid-cols-2 gap-3">
        <ButtonLink href={back} variant="outline">Back</ButtonLink>
        <Button type="submit" disabled={!ready} busy={busy} busyLabel="Creating account…">
          Continue <ContinueIcon />
        </Button>
      </div>
    </form>
  );
}

const RESEND_S = 60;

/**
 * SignUp-EmailSent. The design's timer reads "This link will expire in 09:58",
 * but links last 24 h (PRD 4.1), so the timer counts down to the next allowed resend.
 */
export function VerifySent({ role, back }: { role: Role; back: string }) {
  const toast = useToast();
  const [email, setEmail] = useState<string | null>(null);
  const [left, setLeft] = useState(RESEND_S);
  const [busy, setBusy] = useState(false);

  useEffect(() => setEmail(readDraft()?.email ?? null), []);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  async function resend() {
    if (!email || left > 0 || busy) return;
    setBusy(true);
    try {
      await api("/api/auth/verify/resend", { body: { email, role } });
      toast.show({ title: "Verification email resent", body: "Check your inbox and spam folder." });
      setLeft(RESEND_S);
    } catch (err) {
      toast.show({ tone: "error", title: "Couldn’t resend the link", body: err instanceof ApiClientError ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return (
    <div className="flex flex-col gap-[22px]">
      <Header step={2} />
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 text-[26px] font-bold tracking-[-0.01em]">Verification Link Sent</h1>
        <p className="m-0 text-sm leading-normal text-ink-3">
          We’ve sent a verification link to your email address{email && <> <strong className="text-ink">{maskEmail(email)}</strong></>}. Please check your inbox and click the link to verify your account.
        </p>
      </div>
      {left > 0 && (
        <div className="flex items-center justify-center gap-2 text-[13px] text-ink-3" aria-live="polite">
          You can resend the link in <span className="rounded-md bg-[#6D28D9] px-2 py-[3px] font-semibold text-white tabular-nums">{mm}:{ss}</span>
        </div>
      )}
      <p className="m-0 text-[13px] text-ink-3">
        Didn’t receive the link?{" "}
        <button type="button" onClick={resend} disabled={!email || left > 0 || busy} className="border-0 bg-transparent p-0 font-semibold text-primary underline disabled:cursor-not-allowed disabled:text-primary-disabled disabled:no-underline">
          {busy ? "Resending…" : "Resend link"}
        </button>
      </p>
      <div className="flex items-start gap-2.5 rounded-lg border border-[#FEDF89] bg-[#FFFAEB] px-3 py-2.5 text-xs leading-normal text-[#7A2E0E]">
        <BulbIcon className="mt-px flex-none text-[#B54708]" />
        <span>Can’t find it? Check your spam or promotions folder, or make sure you entered the right email address.</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ButtonLink href={back} variant="outline">Back</ButtonLink>
        <a href="mailto:" className={buttonClass("primary", "lg", "gap-2")}>
          <MailIcon /> Open Email App
        </a>
      </div>
    </div>
  );
}

/** SignUp-EmailVerified, plus the expired-link state (PRD 4.1 acceptance criteria). */
export function VerifyResult({
  status,
  email,
  role,
  next,
  body = "Thanks for verifying your email. Your account is now activated — you’re ready to begin your learning journey.",
  cta = "Login",
}: { status: "verified" | "expired"; email?: string; role: Role; next: string; body?: string; cta?: string }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  if (status === "verified") {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <SuccessBadge />
        <h1 className="m-0 text-2xl font-bold">Email Verified Successfully!</h1>
        <p className="m-0 text-sm leading-[1.55] text-ink-3">{body}</p>
        <ButtonLink href={next} className="w-full">{cta}</ButtonLink>
      </div>
    );
  }

  async function resend() {
    if (!email) return;
    setBusy(true);
    try {
      await api("/api/auth/verify/resend", { body: { email, role } });
      setSent(true);
      toast.show({ title: "Verification email resent", body: "Check your inbox for the new link." });
    } catch (err) {
      toast.show({ tone: "error", title: "Couldn’t send a new link", body: err instanceof ApiClientError ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Logo />
      <h1 className="m-0 text-[26px] font-bold">This Link Has Expired</h1>
      <p className="m-0 text-sm leading-normal text-ink-3">Verification links expire after 24 hours or once used. Send a new link to verify your email.</p>
      {email ? (
        <Button onClick={resend} busy={busy} busyLabel="Sending…" disabled={sent}>
          {sent ? "New link sent" : "Send a New Link"}
        </Button>
      ) : (
        <ButtonLink href={role === "learner" ? "/sign-up" : "/instructor/sign-up"}>Start again</ButtonLink>
      )}
    </div>
  );
}
