import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { TwoFactorForm } from "@/features/admin/TwoFactorForm";
import { decrypt, encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { newTotpSecret, otpauthUrl } from "@/lib/auth/totp";
import { qrModules } from "@/lib/qr";

export const metadata: Metadata = { title: "Two-step verification" };

// Staff 2FA (PRD 9). First visit enrols an authenticator app; later visits ask for the code.
export default async function TwoFactorPage() {
  const session = await getCurrentSession("ADMIN");
  if (!session) redirect("/admin/sign-in");
  if (session.mfaAt && session.user.totpEnabledAt) redirect("/admin");
  const user = session.user;

  let setup: { secret: string; qr: boolean[][] } | null = null;
  if (!user.totpEnabledAt) {
    let secret = user.totpSecretEnc ? decrypt(user.totpSecretEnc) : null;
    if (!secret) {
      secret = newTotpSecret();
      await db.user.update({ where: { id: user.id }, data: { totpSecretEnc: encrypt(secret) } });
    }
    setup = { secret, qr: qrModules(otpauthUrl(secret, user.email)) };
  }

  return (
    <div className="mx-auto flex max-w-[420px] flex-col gap-5 px-4 py-12">
      <Logo />
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 text-2xl font-bold">{setup ? "Set up two-step verification" : "Enter your verification code"}</h1>
        <p className="m-0 text-sm text-ink-3">
          {setup
            ? "Staff accounts need an authenticator app. Scan the code with Google Authenticator, 1Password or Authy, then enter the 6-digit code it shows."
            : "Open your authenticator app and enter the 6-digit code for Lawdemy Staff."}
        </p>
      </div>
      {setup && (
        <div className="flex flex-col items-center gap-3 rounded-card border border-line p-4">
          <svg width="180" height="180" viewBox={`-2 -2 ${setup.qr.length + 4} ${setup.qr.length + 4}`} shapeRendering="crispEdges" role="img" aria-label="QR code for your authenticator app">
            <rect x="-2" y="-2" width={setup.qr.length + 4} height={setup.qr.length + 4} fill="#fff" />
            <path d={setup.qr.flatMap((row, y) => row.map((on, x) => (on ? `M${x} ${y}h1v1h-1z` : ""))).join("")} fill="#101828" />
          </svg>
          <span className="text-xs text-ink-3">Can’t scan? Enter this key manually:</span>
          <code className="rounded bg-surface px-2 py-1 text-xs tracking-wider break-all">{setup.secret.match(/.{1,4}/g)?.join(" ")}</code>
        </div>
      )}
      <TwoFactorForm />
    </div>
  );
}
