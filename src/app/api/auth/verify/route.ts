import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { createSession } from "@/lib/auth/session";
import { consumeVerification } from "@/lib/auth/verify";

// Opened from the verification email: verify, sign in, then show the result page.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const result = await consumeVerification(url.searchParams.get("token") ?? "");
  const base = result.status !== "invalid" && result.user.role === "INSTRUCTOR" ? "/instructor/verify-email" : "/verify-email";
  if (result.status === "verified" || result.status === "already") {
    await createSession(result.user);
    if (result.status === "verified") await audit({ actorId: result.user.id, action: "email_verified", targetType: "user", targetId: result.user.id });
    return NextResponse.redirect(new URL(`${base}?status=verified`, url));
  }
  const email = result.status === "expired" ? `&email=${encodeURIComponent(result.user.email)}` : "";
  return NextResponse.redirect(new URL(`${base}?status=expired${email}`, url));
}
