import type { Metadata } from "next";
import { PaymentResult } from "@/features/buy/CheckoutScreens";
import { requireLearnerPage } from "@/lib/auth/pages";

export const metadata: Metadata = { title: "Payment not completed" };

export default async function FailedPage({ searchParams }: { searchParams: Promise<{ reference?: string }> }) {
  await requireLearnerPage();
  return <PaymentResult reference={(await searchParams).reference ?? ""} initialStatus="FAILED" />;
}
