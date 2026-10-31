import "server-only";
import { redirect } from "next/navigation";
import { fail } from "@/lib/http";
import { getCurrentSession } from "./session";

// Staff console access (PRD 9 and 11): an ADMIN session that has passed TOTP 2FA.

/** For admin pages: redirects to sign-in, or to /admin/2fa until the second factor is done. */
export async function requireStaffPage() {
  const session = await getCurrentSession("ADMIN");
  if (!session) redirect("/admin/sign-in");
  if (!session.mfaAt || !session.user.totpEnabledAt) redirect("/admin/2fa");
  return session.user;
}

/** For admin route handlers: the staff user, or a 401/403 response. */
export async function requireStaff() {
  const session = await getCurrentSession("ADMIN");
  if (!session) return { error: fail(401, "UNAUTHENTICATED", "Please sign in again.") } as const;
  if (!session.mfaAt || !session.user.totpEnabledAt) return { error: fail(403, "MFA_REQUIRED", "Confirm your authenticator code first.") } as const;
  return { user: session.user } as const;
}
