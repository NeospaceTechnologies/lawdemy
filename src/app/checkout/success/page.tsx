import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaymentResult } from "@/features/buy/CheckoutScreens";
import { db } from "@/lib/db";
import { requireLearnerPage } from "@/lib/auth/pages";

export const metadata: Metadata = { title: "Payment" };

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ reference?: string }> }) {
  const { user } = await requireLearnerPage();
  const reference = (await searchParams).reference ?? "";
  const order = await db.order.findFirst({ where: { reference, learnerId: user.id }, select: { status: true } });
  if (!order) notFound();
  return <PaymentResult reference={reference} initialStatus={order.status} />;
}
