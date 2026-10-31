"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Label, TextInput } from "@/components/ui/Field";
import { Logo } from "@/components/ui/Logo";
import { api, ApiClientError } from "@/lib/api-client";
import { FormBanner } from "./FormBanner";

export const RESET_EMAIL_KEY = "lawdemy:reset-email";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Reset-Request: always continues to "Check your email" on success (no enumeration). */
export function ResetRequestForm({ role, basePath, signInHref }: { role: "learner" | "instructor"; basePath: string; signInHref: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = EMAIL_RE.test(email.trim());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api("/api/auth/password-reset/request", { body: { email, role } });
      try {
        sessionStorage.setItem(RESET_EMAIL_KEY, email.trim());
      } catch {}
      router.push(`${basePath}/check-email`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-[22px]">
      <Logo />
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 text-[26px] font-bold tracking-[-0.01em]">Reset Your Password</h1>
        <p className="m-0 text-sm leading-normal text-ink-3">
          Enter the email address linked to your account and we’ll send you a link to reset your password.
        </p>
      </div>
      {error && <FormBanner>{error}</FormBanner>}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email" className="font-medium">Email address</Label>
        <TextInput id="email" type="email" autoComplete="email" className="px-3.5" placeholder="Enter your email address" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ButtonLink href={signInHref} variant="outline">Back</ButtonLink>
        <Button type="submit" disabled={!valid} busy={busy} busyLabel="Sending…">
          Send Link
        </Button>
      </div>
    </form>
  );
}
