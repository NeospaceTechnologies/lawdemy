"use client";
import { createContext, useContext, type ReactNode } from "react";
import { CATEGORIES } from "@/lib/course/constants";
import { INTERESTS, JURISDICTIONS, PRACTICE_AREAS, PROFESSIONAL_TITLES } from "@/lib/taxonomy";

// Staff-managed lists (ADM-11), loaded once per request in the root layout. Components
// outside the provider (tests, storybook-like previews) fall back to the built-in lists.

export type ClientTaxonomy = {
  category: string[];
  practice_area: string[];
  jurisdiction: string[];
  professional_title: string[];
  interest: string[];
  report_reason: string[];
};

const DEFAULTS: ClientTaxonomy = {
  category: [...CATEGORIES],
  practice_area: [...PRACTICE_AREAS],
  jurisdiction: [...JURISDICTIONS],
  professional_title: [...PROFESSIONAL_TITLES],
  interest: [...INTERESTS],
  report_reason: ["It’s spam or misleading", "Offensive or abusive content", "Off-topic or irrelevant", "Duplicate content", "Other"],
};

const Ctx = createContext<ClientTaxonomy>(DEFAULTS);

export function TaxonomyProvider({ value, children }: { value: ClientTaxonomy; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTaxonomy() {
  return useContext(Ctx);
}
