"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import { MultiSelect } from "@/components/ui/Onboarding";
import { CheckIcon, FilterIcon, SortIcon } from "@/components/ui/icons";
import { useTaxonomy } from "@/components/TaxonomyProvider";
import { LEVELS } from "@/lib/course/constants";

const SORTS: [string, string][] = [
  ["newest", "Newest"], ["trending", "Trending"], ["popular", "Most Popular"], ["az", "A–Z"], ["za", "Z–A"], ["shortest", "Shortest Duration"], ["longest", "Longest Duration"],
];

function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return { open, setOpen, ref };
}

const trigger = "inline-flex h-9 items-center gap-1.5 rounded-control border border-primary bg-white px-3 text-[13px] font-semibold text-primary";

/**
 * Sort dropdown + Filter panel (SortFilter.dc.html). State lives in the URL so
 * results are shareable; `target` is where Apply navigates (e.g. /courses).
 */
export function SortFilter({ target }: { target?: string }) {
  const taxonomy = useTaxonomy();
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const sort = usePopover();
  const filter = usePopover();
  const base = target ?? path;

  const [cats, setCats] = useState<string[]>([]);
  const [level, setLevel] = useState("");
  const [price, setPrice] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [cert, setCert] = useState(false);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    if (!filter.open) return;
    setCats((sp.get("category") ?? "").split("|").filter(Boolean));
    setLevel(sp.get("level") ?? "");
    setPrice(sp.get("price") ?? "");
    setMin(sp.get("min") ?? "");
    setMax(sp.get("max") ?? "");
    setCert(sp.get("cert") === "1");
    setIsNew(sp.get("new") === "1");
  }, [filter.open, sp]);

  function navigate(params: URLSearchParams) {
    params.set("filtered", "1");
    router.push(`${base}?${params.toString()}`);
  }

  function pickSort(key: string) {
    const params = new URLSearchParams(sp.toString());
    params.set("sort", key);
    sort.setOpen(false);
    router.push(`${target && target !== path ? target : path}?${params.toString()}`);
  }

  function apply() {
    const params = new URLSearchParams();
    const q = sp.get("q");
    if (q) params.set("q", q);
    if (sp.get("sort")) params.set("sort", sp.get("sort")!);
    if (cats.length) params.set("category", cats.join("|"));
    if (level) params.set("level", level);
    if (price) params.set("price", price);
    if (price !== "free" && min) params.set("min", min);
    if (price !== "free" && max) params.set("max", max);
    if (cert) params.set("cert", "1");
    if (isNew) params.set("new", "1");
    filter.setOpen(false);
    navigate(params);
  }

  const current = sp.get("sort") ?? "newest";
  const radio = "flex h-[38px] cursor-pointer items-center gap-2.5 rounded-control bg-surface px-2.5 text-[13px]";

  return (
    <div className="flex gap-2">
      <div ref={filter.ref} className="relative">
        <button type="button" aria-expanded={filter.open} onClick={() => filter.setOpen((o) => !o)} className={trigger}>
          <FilterIcon /> Filter
        </button>
        {filter.open && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              apply();
            }}
            className="absolute right-0 z-30 mt-1 flex w-[380px] max-w-[calc(100vw-32px)] flex-col gap-4 rounded-[10px] border border-line bg-white p-4 shadow-[0_12px_24px_-6px_rgba(16,24,40,0.14)]"
          >
            <MultiSelect label="Category" options={taxonomy.category} value={cats} onChange={setCats} placeholder="Any category" searchLabel="Search category" />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="flt-lvl" className="text-[13px] font-semibold">Skill Level</label>
              <select id="flt-lvl" value={level} onChange={(e) => setLevel(e.target.value)} className="h-10 rounded-control border border-line-input bg-surface px-2.5 text-[13px]">
                <option value="">Any level</option>
                {LEVELS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
            <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
              <legend className="mb-1.5 text-[13px] font-semibold">Price</legend>
              {[["discount", "Discounted sale"], ["free", "Free"], ["paid", "Paid"]].map(([v, l]) => (
                <label key={v} className={radio}>
                  <input type="radio" name="price" checked={price === v} onChange={() => setPrice(v)} className="m-0 accent-primary" />
                  {l}
                </label>
              ))}
              {price !== "free" && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <label className="flex flex-col gap-1 text-xs text-ink-3">
                    Min (₦)
                    <input type="number" min={0} inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} placeholder="5,000" className="h-9 rounded-control border border-line-input bg-surface px-2 text-[13px] text-ink" />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-ink-3">
                    Max (₦)
                    <input type="number" min={0} inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} placeholder="35,000" className="h-9 rounded-control border border-line-input bg-surface px-2 text-[13px] text-ink" />
                  </label>
                </div>
              )}
            </fieldset>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} className="accent-primary" />New arrivals</label>
              <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={cert} onChange={(e) => setCert(e.target.checked)} className="accent-primary" />Offers a certificate</label>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Button variant="outline" size="md" className="h-10" onClick={() => filter.setOpen(false)}>Cancel</Button>
              <Button type="submit" size="md" className="h-10">Apply</Button>
            </div>
          </form>
        )}
      </div>
      <div ref={sort.ref} className="relative">
        <button type="button" aria-expanded={sort.open} aria-haspopup="listbox" onClick={() => sort.setOpen((o) => !o)} className={trigger}>
          <SortIcon /> Sort
        </button>
        {sort.open && (
          <div role="listbox" aria-label="Sort by" className="absolute right-0 z-30 mt-1 flex w-60 flex-col rounded-[10px] border border-line bg-white p-1.5 shadow-[0_12px_24px_-6px_rgba(16,24,40,0.14)]">
            {SORTS.map(([k, label]) => (
              <button
                key={k}
                type="button"
                role="option"
                aria-selected={current === k}
                onClick={() => pickSort(k)}
                className={clsx("flex h-[38px] items-center justify-between rounded-md border-0 px-2.5 text-left text-[13px]", current === k ? "bg-surface-2 font-semibold text-ink" : "bg-transparent text-ink-2 hover:bg-surface")}
              >
                {label}
                {current === k && <CheckIcon className="text-primary" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
