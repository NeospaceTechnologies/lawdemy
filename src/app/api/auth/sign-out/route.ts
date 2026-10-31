import { NextResponse } from "next/server";
import { ok } from "@/lib/http";
import { destroySession } from "@/lib/auth/session";

// JSON for fetch callers; a plain form post with ?to=/path gets a redirect (staff console).
export async function POST(req: Request) {
  await destroySession();
  const to = new URL(req.url).searchParams.get("to");
  if (to && to.startsWith("/") && !to.startsWith("//")) return NextResponse.redirect(new URL(to, req.url), 303);
  return ok({ ok: true });
}
