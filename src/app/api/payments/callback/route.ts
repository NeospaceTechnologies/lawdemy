import { NextResponse } from "next/server";
import { payments } from "@/lib/payments";
import { failOrder, fulfilOrder } from "@/lib/payments/fulfil";

// The provider redirects the learner here after paying. Verify server-side, then show the result.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const reference = url.searchParams.get("reference") ?? "";
  const result = await payments().verify(reference);
  if (result.status === "paid") {
    await fulfilOrder(reference, result.amountKobo);
    return NextResponse.redirect(new URL(`/checkout/success?reference=${encodeURIComponent(reference)}`, url));
  }
  if (result.status === "failed") await failOrder(reference);
  return NextResponse.redirect(new URL(`/checkout/failed?reference=${encodeURIComponent(reference)}`, url));
}
