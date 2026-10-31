import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { CATEGORIES } from "@/lib/course/constants";
import { INTERESTS, JURISDICTIONS, PRACTICE_AREAS, PROFESSIONAL_TITLES } from "@/lib/taxonomy";

// Lists staff manage without a code release (ADM-11). Until staff edit a list it keeps
// the built-in defaults; the first edit copies the defaults into the database.

export const TAXONOMY_KINDS = {
  category: { label: "Course categories", defaults: CATEGORIES as readonly string[] },
  practice_area: { label: "Practice areas", defaults: PRACTICE_AREAS as readonly string[] },
  jurisdiction: { label: "Jurisdictions", defaults: JURISDICTIONS as readonly string[] },
  professional_title: { label: "Professional titles", defaults: PROFESSIONAL_TITLES as readonly string[] },
  interest: { label: "Areas of interest", defaults: INTERESTS as readonly string[] },
  report_reason: {
    label: "Report reasons",
    defaults: ["It’s spam or misleading", "Offensive or abusive content", "Off-topic or irrelevant", "Duplicate content", "Other"] as readonly string[],
  },
} as const;
export type TaxonomyKind = keyof typeof TAXONOMY_KINDS;
export type Taxonomy = Record<TaxonomyKind, string[]>;

/** Active values per list, in staff order (cached per request). */
export const getTaxonomy = cache(async (): Promise<Taxonomy> => {
  const rows = await db.taxonomyItem.findMany({ orderBy: [{ kind: "asc" }, { position: "asc" }] });
  const out = {} as Taxonomy;
  for (const kind of Object.keys(TAXONOMY_KINDS) as TaxonomyKind[]) {
    const mine = rows.filter((r) => r.kind === kind);
    out[kind] = mine.length ? mine.filter((r) => r.active).map((r) => r.value) : [...TAXONOMY_KINDS[kind].defaults];
  }
  return out;
});

/** Copies the defaults in before the first staff edit of a list. */
export async function materialise(kind: TaxonomyKind) {
  if (await db.taxonomyItem.count({ where: { kind } })) return;
  await db.taxonomyItem.createMany({ data: TAXONOMY_KINDS[kind].defaults.map((value, position) => ({ kind, value, position })) });
}

/**
 * Server-side check for submitted values: anything staff have ever listed (active or
 * hidden) or a built-in default is accepted, so hidden values stay valid where used.
 */
export async function isKnown(kind: TaxonomyKind, values: string[]) {
  const rows = await db.taxonomyItem.findMany({ where: { kind }, select: { value: true } });
  const known = new Set<string>([...TAXONOMY_KINDS[kind].defaults, ...rows.map((r) => r.value)]);
  return values.every((v) => known.has(v));
}
