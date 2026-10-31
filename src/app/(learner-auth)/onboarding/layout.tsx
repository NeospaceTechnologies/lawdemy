import { WithTaxonomy } from "@/components/WithTaxonomy";

// Onboarding asks for jurisdictions, practice areas, titles and interests from the managed lists.
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <WithTaxonomy>{children}</WithTaxonomy>;
}
