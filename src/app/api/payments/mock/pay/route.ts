import { NextResponse } from "next/server";
import { appUrl } from "@/lib/email";
import { mockComplete, payments, sign } from "@/lib/payments";

// Stand-in for the provider's hosted checkout page in local development.
// It "pays", fires the signed webhook, then redirects to our callback like a real provider.
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production" || payments().name !== "mock") return new Response("Not found", { status: 404 });
  const url = new URL(req.url);
  const reference = url.searchParams.get("reference") ?? "";
  const status = url.searchParams.get("fail") === "1" ? "failed" : "paid";
  mockComplete(reference, status);
  const body = JSON.stringify({ event: status === "paid" ? "charge.success" : "charge.failed", data: { reference } });
  await fetch(appUrl("/api/payments/webhook"), { method: "POST", headers: { "content-type": "application/json", "x-signature": sign(body) }, body }).catch(() => {});
  return NextResponse.redirect(new URL(`/api/payments/callback?reference=${encodeURIComponent(reference)}`, url));
}
