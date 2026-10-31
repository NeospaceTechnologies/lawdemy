"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Label, TextInput } from "@/components/ui/Field";
import { ContinueIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/Logo";
import { PasswordInput } from "@/components/ui/Onboarding";
import { api, ApiClientError } from "@/lib/api-client";
import { FormBanner } from "./FormBanner";

type Role = "learner" | "instructor" | "admin";

const RESET_HREF: Record<Role, string> = { learner: "/reset-password", instructor: "/instructor/reset-password", admin: "/admin/sign-in" };

/** Inst-SignIn: Sign In stays disabled until both fields are filled (LRN-AUTH-01). */
export function SignInForm({ role }: { role: Role }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const ready = email.trim() !== "" && password !== "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { redirectTo } = await api<{ redirectTo: string }>("/api/auth/sign-in", { body: { email, password, role } });
      router.replace(redirectTo);
      router.refresh();
    } catch (err) {
      const e2 = err instanceof ApiClientError ? err : new ApiClientError(0, "UNKNOWN", "Something went wrong. Please try again.");
      setError({ code: e2.code, message: e2.code === "VALIDATION_FAILED" ? Object.values(e2.fields)[0] ?? e2.message : e2.message });
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <Logo />
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 text-[26px] font-bold">Welcome Back!</h1>
        <p className="m-0 text-sm text-ink-3">Continue from where you left off.</p>
      </div>

      {error && (
        <FormBanner>
          {error.message}
          {error.code === "EMAIL_UNVERIFIED" && (
            <>
              {" "}
              <button
                type="button"
                onClick={async () => {
                  await api("/api/auth/verify/resend", { body: { email, role: role === "admin" ? "instructor" : role } }).catch(() => {});
                  setError({ code: "SENT", message: "We’ve sent a new verification link. Check your inbox." });
                }}
                className="border-0 bg-transparent p-0 font-semibold text-danger-text underline"
              >
                Resend verification link
              </button>
            </>
          )}
          {error.code === "LOCKED" && (
            <>
              {" "}
              <Link href={RESET_HREF[role]} className="font-semibold text-danger-text underline">
                Reset your password
              </Link>
            </>
          )}
        </FormBanner>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="em" className="font-medium">{role === "learner" ? "Email address" : "Email Address"}</Label>
        <TextInput
          id="em"
          type="email"
          autoComplete="email"
          className="px-3.5"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pw" className="font-medium">Password</Label>
        <PasswordInput
          id="pw"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Link href={RESET_HREF[role]} className="self-end text-[13px] font-semibold underline">
          Forgot Password?
        </Link>
      </div>
      <Button type="submit" disabled={!ready} busy={busy} busyLabel="Signing In…">
        Sign In {role === "learner" && <ContinueIcon />}
      </Button>
    </form>
  );
}
