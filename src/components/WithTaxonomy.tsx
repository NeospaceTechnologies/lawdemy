import type { ReactNode } from "react";
import { TaxonomyProvider } from "@/components/TaxonomyProvider";
import { getTaxonomy } from "@/lib/taxonomy-store";

/**
 * Loads the staff-managed lists (ADM-11) for the signed-in areas that use them. Kept out of
 * the root layout so static pages (sign-in, reset password) never touch the database.
 */
export async function WithTaxonomy({ children }: { children: ReactNode }) {
  return <TaxonomyProvider value={await getTaxonomy()}>{children}</TaxonomyProvider>;
}
