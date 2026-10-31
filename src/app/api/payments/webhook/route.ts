import { payments } from "@/lib/payments";
import { failOrder, fulfilOrder } from "@/lib/payments/fulfil";
import { settleWithdrawal } from "@/lib/wallet";

// Provider webhooks: signature-checked and idempotent (PRD 9).
export async function POST(req: Request) {
  const raw = await req.text();
  const provider = payments();
  const event = provider.parseWebhook(raw, req.headers.get("x-signature"));
  if (!event) return new Response("invalid signature", { status: 401 });
  if (event.event === "charge.success") {
    const v = await provider.verify(event.reference);
    if (v.status === "paid") await fulfilOrder(event.reference, v.amountKobo);
  } else if (event.event === "charge.failed") {
    await failOrder(event.reference);
  } else if (event.event === "transfer.success" || event.event === "transfer.failed") {
    await settleWithdrawal(event.reference, event.event === "transfer.success" ? "successful" : "failed");
  }
  return new Response("ok");
}
