import type { Metadata } from "next";
import { AdminAction } from "@/features/admin/AdminAction";
import { AdminHeader, Pill } from "@/features/admin/Table";
import { db } from "@/lib/db";
import { TAXONOMY_KINDS, type TaxonomyKind } from "@/lib/taxonomy-store";

export const metadata: Metadata = { title: "Content settings" };

// ADM-11: lists used across both apps. Hidden values stay valid where already used.
export default async function ContentSettingsPage() {
  const rows = await db.taxonomyItem.findMany({ orderBy: [{ kind: "asc" }, { position: "asc" }] });
  const kinds = Object.keys(TAXONOMY_KINDS) as TaxonomyKind[];
  return (
    <>
      <AdminHeader title="Content settings" subtitle="Changes apply straight away in onboarding, profiles, course setup, filters and the report dialog." />
      {kinds.map((kind) => {
        const mine = rows.filter((r) => r.kind === kind);
        const items = mine.length ? mine : TAXONOMY_KINDS[kind].defaults.map((value, i) => ({ id: "", value, active: true, position: i }));
        return (
          <section key={kind} className="flex flex-col gap-3 rounded-card border border-line p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="m-0 text-base font-semibold">{TAXONOMY_KINDS[kind].label} {!mine.length && <span className="text-xs font-normal text-ink-3">(built-in defaults)</span>}</h2>
              <AdminAction endpoint="/api/admin/taxonomy" body={{ action: "add", kind }} label="Add value" variant="outline" fields={[{ name: "value", label: "Value", type: "text", minLength: 2 }]} confirmLabel="Add" success="Value added" />
            </div>
            <ul className="m-0 flex list-none flex-col p-0">
              {items.map((it, i) => (
                <li key={it.id || it.value} className="flex flex-wrap items-center justify-between gap-2 border-t border-line py-2 text-[13px] first:border-t-0">
                  <span className={it.active ? "" : "text-ink-3 line-through"}>{it.value} {!it.active && <Pill>Hidden</Pill>}</span>
                  {it.id ? (
                    <span className="flex gap-1.5">
                      {i > 0 && <AdminAction endpoint="/api/admin/taxonomy" body={{ action: "move", kind, id: it.id, dir: "up" }} label="↑" variant="ghost" success="Moved" />}
                      {i < items.length - 1 && <AdminAction endpoint="/api/admin/taxonomy" body={{ action: "move", kind, id: it.id, dir: "down" }} label="↓" variant="ghost" success="Moved" />}
                      {kind !== "category" && <AdminAction endpoint="/api/admin/taxonomy" body={{ action: "rename", kind, id: it.id }} label="Rename" variant="ghost" fields={[{ name: "value", label: "New value", type: "text", minLength: 2, initial: it.value }]} confirmLabel="Save" success="Renamed" />}
                      <AdminAction endpoint="/api/admin/taxonomy" body={{ action: "toggle", kind, id: it.id }} label={it.active ? "Hide" : "Show"} variant="ghost" success={it.active ? "Hidden" : "Shown"} />
                    </span>
                  ) : (
                    <span className="text-xs text-ink-3">Add or edit a value to manage this list</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
