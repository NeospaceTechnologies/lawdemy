"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CartIcon, ChevronLeftIcon, ClockIcon, CloseIcon, HeartIcon, SearchIcon } from "@/components/ui/icons";
import { NotificationsBell } from "@/components/shared/NotificationsPanel";
import { api } from "@/lib/api-client";
import type { CourseCardData } from "@/lib/catalog";
import { useLearner } from "./LearnerContext";

type Dropdown = { recent: { id: string; query: string }[]; popular: string[]; top: CourseCardData[] };

/** Search box with the recent/popular/top dropdown (Search-Dropdown.dc.html). */
function SearchBox({ initial = "", wide }: { initial?: string; wide?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Dropdown | null>(null);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    if (!data) void api<Dropdown>("/api/learner/searches").then(setData).catch(() => {});
    const onDown = (e: MouseEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, data]);

  function go(term: string) {
    const t = term.trim();
    if (!t) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(t)}`);
  }

  async function removeRecent(id: string) {
    await api(`/api/learner/searches/${id}`, { method: "DELETE" }).catch(() => {});
    setData((d) => (d ? { ...d, recent: d.recent.filter((r) => r.id !== id) } : d));
  }

  async function clearAll() {
    await api("/api/learner/searches", { method: "DELETE" }).catch(() => {});
    setData((d) => (d ? { ...d, recent: [] } : d));
  }

  const chip = "inline-flex h-8 items-center gap-1.5 rounded-control border border-line px-2.5 text-xs text-ink-2 no-underline";
  return (
    <div ref={wrap} className={wide ? "relative w-full max-w-[300px]" : "relative w-[280px] max-w-full"}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
      >
        <label className={`flex h-10 items-center gap-2 rounded-control border px-3 ${open ? "border-[1.5px] border-primary bg-white" : "border-line bg-surface"}`}>
          <SearchIcon size={16} className="text-muted" />
          <input type="search" aria-label="Search courses" placeholder="Search courses" value={q} onFocus={() => setOpen(true)} onChange={(e) => setQ(e.target.value)} className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none" />
        </label>
      </form>
      {open && (
        <div className="absolute top-full left-0 z-40 mt-2 flex w-[min(960px,calc(100vw-32px))] flex-col gap-[18px] rounded-card border border-line bg-white p-5 shadow-[0_12px_24px_-6px_rgba(16,24,40,0.14)] md:w-[640px] lg:w-[860px]">
          {data && data.recent.length > 0 && (
            <section className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <h2 className="m-0 text-sm font-semibold">Recent Searches</h2>
                <button type="button" onClick={clearAll} className="border-0 bg-transparent p-1 text-xs font-semibold text-primary">Clear all</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.recent.map((r) => (
                  <span key={r.id} className={`${chip} pr-1.5`}>
                    <button type="button" onClick={() => go(r.query)} className="inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-xs text-ink-2">
                      <ClockIcon size={12} className="text-muted" />
                      {r.query}
                    </button>
                    <button type="button" aria-label={`Remove ${r.query}`} onClick={() => removeRecent(r.id)} className="flex h-[22px] w-[22px] items-center justify-center border-0 bg-transparent text-ink-3">
                      <CloseIcon size={10} strokeWidth={3} />
                    </button>
                  </span>
                ))}
              </div>
            </section>
          )}
          <section className="flex flex-col gap-2.5">
            <h2 className="m-0 text-sm font-semibold">Popular Searches</h2>
            <div className="flex flex-wrap gap-2">
              {(data?.popular ?? []).map((p) => (
                <button key={p} type="button" onClick={() => go(p)} className={`${chip} bg-white`}>
                  <SearchIcon size={12} className="text-muted" />
                  {p}
                </button>
              ))}
            </div>
          </section>
          {data && data.top.length > 0 && (
            <section className="flex flex-col gap-2.5">
              <h2 className="m-0 text-sm font-semibold">Top Courses</h2>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                {data.top.map((c) => (
                  <Link key={c.id} href={`/courses/${c.id}`} onClick={() => setOpen(false)} className="flex flex-col overflow-hidden rounded-[10px] border border-line text-ink no-underline hover:text-ink">
                    <div className="flex h-[100px] items-end bg-[#2B2F36] bg-cover bg-center p-2" style={c.thumbnailUrl ? { backgroundImage: `url(${c.thumbnailUrl})` } : undefined}>
                      {!c.thumbnailUrl && <span className="text-[10px] text-line-input">[Course image]</span>}
                    </div>
                    <div className="flex flex-col gap-1.5 p-2.5">
                      <h3 className="m-0 line-clamp-2 text-[13px] leading-[1.35] font-semibold">{c.title}</h3>
                      <span className="text-[11px] text-ink-3">{c.instructor}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

/** Learner top bar: optional back button, search, wishlist, cart (count) and notifications. */
export function Topbar({ back, query }: { back?: string; query?: string }) {
  const { cart, unread, setCounts } = useLearner();
  const path = usePathname();
  const onWishlist = path === "/wishlist";
  const onCart = path === "/cart";
  const icon = (on: boolean) =>
    on
      ? "relative flex h-11 w-11 items-center justify-center rounded-control bg-[#EEEEFB] text-primary"
      : "relative flex h-11 w-11 items-center justify-center rounded-control text-ink-2 hover:bg-surface";
  const actions = (
    <div className="flex items-center gap-1">
      <Link href="/wishlist" aria-label="Wishlist" aria-current={onWishlist ? "page" : undefined} className={icon(onWishlist)}><HeartIcon filled={onWishlist} /></Link>
      <Link href="/cart" aria-label={cart ? `Cart, ${cart} item${cart === 1 ? "" : "s"}` : "Cart"} aria-current={onCart ? "page" : undefined} className={icon(onCart)}>
        <CartIcon />
        {cart > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">{cart}</span>
        )}
      </Link>
      <NotificationsBell unread={unread} onChange={(n) => setCounts({ unread: n })} settingsHref="/settings" badge="count" />
    </div>
  );
  if (back) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={back} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-2">
          <ChevronLeftIcon />
        </Link>
        <div className="flex flex-wrap items-center gap-1">
          <SearchBox initial={query} />
          {actions}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <SearchBox initial={query} wide />
      {actions}
    </div>
  );
}
