"use client";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { FieldMessage, Label, TextInput } from "@/components/ui/Field";
import { CheckIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/Logo";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { api, ApiClientError } from "@/lib/api-client";
import { checkPassword } from "@/lib/auth/password-rules";
import { FormBanner } from "./FormBanner";

type Props = { role: "learner" | "instructor"; token: string; expired: boolean; basePath: string; signInHref: string };

/** Reset-NewPassword → Reset-Success, plus the expired-link state (PRD 4.2). */
export function NewPasswordForm({ role, token, expired: initiallyExpired, basePath, signInHref }: Props) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<"form" | "success" | "expired">(initiallyExpired ? "expired" : "form");

  const { valid } = checkPassword(pw, role);
  const mismatch = pw2 !== "" && pw2 !== pw;
  const ready = valid && pw2 !== "" && !mismatch;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api("/api/auth/password-reset/confirm", { body: { token, password: pw, confirm: pw2, role } });
      setState("success");
    } catch (err) {
      if (err instanceof ApiClientError && err.code === "LINK_EXPIRED") setState("expired");
      else setError(err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (state === "success") {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-success-bg">
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-success-light text-white">
            <CheckIcon size={26} strokeWidth={3} />
          </div>
        </div>
        <h1 className="m-0 text-2xl font-bold">Password Reset Successful</h1>
        <p className="m-0 text-sm leading-[1.55] text-ink-3">Your password has been updated. You can now sign in with your new password.</p>
        <ButtonLink href={signInHref} className="w-full">Sign In</ButtonLink>
      </div>
    );
  }

  if (state === "expired") {
    return (
      <div className="flex flex-col gap-5">
        <Logo />
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-[26px] font-bold tracking-[-0.01em]">This Link Has Expired</h1>
          <p className="m-0 text-sm leading-normal text-ink-3">
            Password reset links work once and expire after 1 hour. Request a new link to reset your password.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ButtonLink href={signInHref} variant="outline">Back to Sign In</ButtonLink>
          <ButtonLink href={basePath}>Request New Link</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <Logo />
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 text-[26px] font-bold tracking-[-0.01em]">Set New Password</h1>
        <p className="m-0 text-sm leading-normal text-ink-3">Create a strong password you haven’t used before.</p>
      </div>
      {error && <FormBanner>{error}</FormBanner>}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pw" className="font-medium">New password</Label>
        <TextInput id="pw" type="password" autoComplete="new-password" className="px-3.5" value={pw} onChange={(e) => setPw(e.target.value)} aria-describedby="pw-rules" />
      </div>
      <PasswordStrength id="pw-rules" password={pw} role={role} showErrors={pw.length > 0} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pw2" className="font-medium">Confirm password</Label>
        <TextInput
          id="pw2"
          type="password"
          autoComplete="new-password"
          className="px-3.5"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          invalid={mismatch}
          aria-describedby={mismatch ? "pw2-err" : undefined}
        />
        {mismatch && <FieldMessage id="pw2-err" tone="error">Passwords do not match.</FieldMessage>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ButtonLink href={`${basePath}/check-email`} variant="outline">Back</ButtonLink>
        <Button type="submit" disabled={!ready} busy={busy} busyLabel="Resetting…">
          Reset Password
        </Button>
      </div>
    </form>
  );
}
