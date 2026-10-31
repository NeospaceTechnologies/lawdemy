"use client";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { MoreIcon, UpvoteIcon } from "@/components/ui/icons";
import { api } from "@/lib/api-client";

// Building blocks shared by lesson Q&A and community threads.

export function Avatar({ initials, own, instructor }: { initials: string; own?: boolean; instructor?: boolean }) {
  return (
    <span
      className={clsx(
        "flex h-8 w-8 flex-none items-center justify-center rounded-full text-[11px] font-bold",
        own ? "border-[1.5px] border-accent bg-white text-price" : instructor ? "bg-info-tint text-info-text" : "bg-[#E0E7FF] text-[#3730A3]",
      )}
    >
      {initials}
    </span>
  );
}

export function UpvoteButton({ type, id, count, voted }: { type: string; id: string; count: number; voted: boolean }) {
  const [state, setState] = useState({ count, voted });
  async function toggle() {
    const prev = state;
    setState({ count: state.count + (state.voted ? -1 : 1), voted: !state.voted });
    const r = await api<{ voted: boolean; count: number }>("/api/upvotes", { body: { targetType: type, targetId: id } }).catch(() => null);
    setState(r ?? prev);
  }
  return (
    <button type="button" aria-pressed={state.voted} aria-label={`Upvote (${state.count})`} onClick={toggle} className={clsx("inline-flex h-7 items-center gap-1 rounded-md border px-2 text-xs", state.voted ? "border-primary bg-info-tint-2 text-primary" : "border-line bg-white text-ink-3")}>
      <UpvoteIcon size={12} />
      {state.count}
    </button>
  );
}

export function Menu({ items }: { items: { label: string; onClick: () => void; danger?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-label="More options" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex h-8 w-8 items-center justify-center rounded-control text-ink-3 hover:bg-surface">
        <MoreIcon />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-20 mt-1 flex min-w-40 flex-col rounded-[10px] border border-line bg-white p-1 shadow-lg">
          {items.map((i) => (
            <button key={i.label} type="button" role="menuitem" onClick={() => { setOpen(false); i.onClick(); }} className={clsx("flex h-9 items-center rounded-md px-3 text-left text-[13px] hover:bg-surface", i.danger ? "text-danger-text" : "text-ink-2")}>
              {i.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
