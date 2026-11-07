"use client";
import { useEffect, useState } from "react";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { MailIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/Logo";
import { useToast } from "@/components/ui/Toast";
import { api, ApiClientError } from "@/lib/api-client";
import { RESET_EMAIL_KEY } from "./ResetRequestForm";

const RESEND_COOLDOWN_S = 5 * 60;

function mask(email: string) {
  const [local, domain] = email.split("@");
  return domain ? `${local.slice(0, 3)}****@${domain}` : email;
}

/** Reset-CheckEmail with a rate-limited "Resend link". */
export function CheckEmail({ role, basePath }: { role: "learner" | "instructor"; basePath: string }) {
  const toast = useToast();
  const [email, setEmail] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      setEmail(sessionStorage.getItem(RESET_EMAIL_KEY));
    } catch {}
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function resend() {
    if (!email || cooldown > 0 || busy) return;
    setBusy(true);
    try {
      await api("/api/auth/password-reset/request", { body: { email, role } });
      toast.show({ title: "Reset link resent", body: "Check your inbox and spam folder." });
      setCooldown(RESEND_COOLDOWN_S);
    } catch (err) {
      toast.show({ title: "Couldn’t resend the link", body: err instanceof ApiClientError ? err.message : undefined, tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-[22px]">
      <Logo />
      <div className="flex flex-col gap-2">
        <h1 className="m-0 text-[26px] font-bold tracking-[-0.01em]">Check Your Email</h1>
        <p className="m-0 text-sm leading-[1.55] text-ink-3">
          We’ve sent a password reset link to <strong className="text-ink">{email ? mask(email) : "your email address"}</strong>. Click the link in the email to set a new password.
        </p>
      </div>
      <p className="m-0 text-[13px] text-ink-3">
        Didn’t receive the email?{" "}
        {email ? (
          <button type="button" onClick={resend} disabled={cooldown > 0 || busy} className="border-0 bg-transparent p-0 font-semibold text-primary underline disabled:cursor-not-allowed disabled:text-primary-disabled disabled:no-underline">
            {busy ? "Resending…" : cooldown > 0 ? `Resend link in ${Math.floor(cooldown / 60)}:${String(cooldown % 60).padStart(2, "0")}` : "Resend link"}
          </button>
        ) : (
          <a href={basePath} className="font-semibold underline">Resend link</a>
        )}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <ButtonLink href={basePath} variant="outline">Back</ButtonLink>
        <a href="mailto:" className={buttonClass("primary", "lg", "gap-2")}>
          <MailIcon />
          Open Email App
        </a>
      </div>
    </div>
  );
}
