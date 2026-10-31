import type { Metadata } from "next";
import { RedirectToPayment } from "@/features/buy/CheckoutScreens";
import { requireLearnerPage } from "@/lib/auth/pages";

export const metadata: Metadata = { title: "Redirecting to payment" };

export default async function RedirectPage({ searchParams }: { searchParams: Promise<{ reference?: string }> }) {
  await requireLearnerPage();
  return <RedirectToPayment reference={(await searchParams).reference ?? ""} />;
}
