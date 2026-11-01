import type { Metadata } from "next";
import { LandingPage } from "@/features/landing/LandingPage";
import { landingData } from "@/lib/landing";

export const metadata: Metadata = {
  title: { absolute: "Lawdemy: learn law and teach it" },
  description:
    "Practical law courses by African legal professionals, for lawyers and non-lawyers. Learn at your own pace, earn verifiable certificates, or teach and get paid.",
};

// Public landing page; course numbers and the featured list refresh every 10 minutes.
export const revalidate = 600;

export default async function Home() {
  return <LandingPage data={await landingData()} />;
}
