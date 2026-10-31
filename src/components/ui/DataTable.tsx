"use client";
import { useMemo, useState, type ReactNode } from "react";
import clsx from "clsx";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, CloseIcon, SearchIcon } from "./icons";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Value used for sorting; omit to make the column unsortable. */
  sortValue?: (row: T) => string | number;
  align?: "left" | "right";
};

export type Filter<T> = {
  key: string;
  label: string;
  options: string[];
  /** Option shown when no filter is applied. */
  allLabel?: string;
  match: (row: T, value: string) => boolean;
};

type Sort = { key: string; dir: "asc" | "desc" } | null;

/**
 * Table with search, sortable headers, select filters with removable chips,
 * pagination and a no-results state (Inst-MyCourses course library pattern).
 */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  search,
  filters = [],
  pageSize = 10,
  initialSort = null,
  minWidth = 820,
  caption,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  search?: { placeholder: string; text: (row: T) => string };
  filters?: Filter<T>[];
  pageSize?: number;
  initialSort?: Sort;
  minWidth?: number;
  caption: string;
}) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<Sort>(initialSort);
  const [page, setPage] = useState(1);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = rows.filter((r) => (!needle || (search?.text(r) ?? "").toLowerCase().includes(needle)));
    for (const f of filters) {
      const v = active[f.key];
      if (v) out = out.filter((r) => f.match(r, v));
    }
    const col = sort && columns.find((c) => c.key === sort.key);
    if (sort && col?.sortValue) {
      const get = col.sortValue;
      out = [...out].sort((a, b) => {
        const x = get(a);
        const y = get(b);
        const cmp = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
        return sort.dir === "asc" ? cmp : -cmp;
      });
    }
    return out;
  }, [rows, q, active, sort, filters, columns, search]);

  const pages = Math.max(1, Math.ceil(visible.length / pageSize));
  const current = Math.min(page, pages);
  const pageRows = visible.slice((current - 1) * pageSize, current * pageSize);
  const chips = filters.filter((f) => active[f.key]);
  const anyFilter = q.trim() !== "" || chips.length > 0;

  function clearAll() {
    setQ("");
    setActive({});
    setPage(1);
  }

  function toggleSort(key: string) {
    setSort((s) => (s?.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {search && (
          <label className="flex h-[38px] w-[280px] max-w-full items-center gap-2 rounded-control border border-line-input px-3">
            <SearchIcon className="text-muted" />
            <input
              type="search"
              aria-label={search.placeholder}
              placeholder={search.placeholder}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              className="min-w-0 flex-1 border-0 bg-transparent text-[13px] outline-none"
            />
          </label>
        )}
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <label key={f.key} className="flex items-center gap-1.5 text-xs text-ink-3">
              {f.label}
              <select
                value={active[f.key] ?? ""}
                onChange={(e) => {
                  setActive((a) => ({ ...a, [f.key]: e.target.value }));
                  setPage(1);
                }}
                className="h-9 rounded-control border border-line-input bg-white px-2 text-[13px]"
              >
                <option value="">{f.allLabel ?? "All"}</option>
                {f.options.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>

      {chips.length > 0 && (
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Active filters">
          {chips.map((f) => (
            <li key={f.key} className="flex h-7 items-center gap-1 rounded-full bg-info-tint-2 pr-1 pl-3 text-xs font-medium text-info-text">
              {f.label}: {active[f.key]}
              <button
                type="button"
                aria-label={`Remove ${f.label} filter`}
                onClick={() => setActive((a) => ({ ...a, [f.key]: "" }))}
                className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-info-tint"
              >
                <CloseIcon size={9} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="overflow-x-auto rounded-card border border-line">
        <table className="w-full border-collapse text-[13px]" style={{ minWidth }}>
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="bg-surface text-left text-xs text-ink-3">
              {columns.map((c) => {
                const dir = sort?.key === c.key ? sort.dir : null;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={dir === "asc" ? "ascending" : dir === "desc" ? "descending" : undefined}
                    className={clsx("px-4 py-3 font-medium", c.align === "right" && "text-right")}
                  >
                    {c.sortValue ? (
                      <button type="button" onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 border-0 bg-transparent p-0 font-medium text-ink-3">
                        {c.header}
                        {dir === "asc" ? <ChevronUpIcon size={12} /> : dir === "desc" ? <ChevronDownIcon size={12} /> : null}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={rowKey(r)} className="border-t border-line">
                {columns.map((c) => (
                  <td key={c.key} className={clsx("px-4 py-3", c.align === "right" && "text-right tabular-nums")}>
                    {c.cell(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (
          <EmptyState
            title="No Results Found"
            body="We couldn’t find anything matching your search or filters."
            action={anyFilter ? <Button variant="outline" size="sm" onClick={clearAll}>Clear search &amp; filters</Button> : undefined}
            className="py-10"
          />
        )}
      </div>

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between text-[13px] text-ink-3">
          <span>
            Page {current} of {pages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={current === 1} onClick={() => setPage(current - 1)} aria-label="Previous page">
              <ChevronLeftIcon size={14} /> Previous
            </Button>
            <Button variant="outline" size="sm" disabled={current === pages} onClick={() => setPage(current + 1)} aria-label="Next page">
              Next <ChevronRightIcon size={14} />
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}
