"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { BellIcon, BookIcon, ChatIcon, NavSettings, QuizIcon } from "@/components/ui/icons";
import { api } from "@/lib/api-client";

type Item = { id: string; type: string; title: string; body: string; link: string | null; readAt: string | null; createdAt: string };

function ago(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

function TypeIcon({ type }: { type: string }) {
  if (type === "quiz_pending") return <QuizIcon size={16} />;
  if (type.includes("reply") || type === "new_question" || type === "announcement") return <ChatIcon />;
  return <BookIcon size={16} />;
}

/** Bell button + notifications dropdown (Notifications.dc.html), shared by both apps. */
export function NotificationsBell({
  unread,
  onChange,
  settingsHref,
  badge = "dot",
}: {
  unread: number;
  onChange?: (unread: number) => void;
  settingsHref: string;
  /** Learner topbar shows the unread count; the instructor topbar shows a dot. */
  badge?: "count" | "dot";
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[] | null>(null);
  const [count, setCount] = useState(unread);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => setCount(unread), [unread]);

  const load = useCallback(async () => {
    const r = await api<{ unread: number; items: Item[] }>("/api/notifications").catch(() => null);
    if (r) {
      setItems(r.items);
      setCount(r.unread);
      onChange?.(r.unread);
    }
  }, [onChange]);

  useEffect(() => {
    if (!open) return;
    void load();
    const onDown = (e: MouseEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, load]);

  async function markAll() {
    await api("/api/notifications", { method: "POST" }).catch(() => {});
    setItems((it) => it?.map((i) => ({ ...i, readAt: i.readAt ?? new Date().toISOString() })) ?? null);
    setCount(0);
    onChange?.(0);
  }

  async function openItem(i: Item) {
    if (!i.readAt) {
      void api(`/api/notifications/${i.id}`, { method: "PATCH" }).catch(() => {});
      setCount((c) => Math.max(0, c - 1));
      onChange?.(Math.max(0, count - 1));
    }
    setOpen(false);
  }

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        aria-label={count ? `Notifications, ${count} unread` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-11 w-11 items-center justify-center rounded-control text-ink-2 hover:bg-surface"
      >
        <BellIcon />
        {count > 0 &&
          (badge === "count" ? (
            <span className="absolute top-2 right-2 flex h-4 min-w-4 items-center justify-center rounded-lg bg-primary px-1 text-[10px] font-bold text-white" aria-hidden="true">
              {count > 9 ? "9+" : count}
            </span>
          ) : (
            <span className="absolute top-2.5 right-[11px] box-content h-2 w-2 rounded-full border-2 border-white bg-danger" aria-hidden="true" />
          ))}
      </button>
      {open && (
        <div role="dialog" aria-label="Notifications" className="absolute right-0 z-40 mt-1 flex max-h-[420px] w-[400px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-card border border-line bg-white shadow-[0_12px_24px_-6px_rgba(16,24,40,0.14)]">
          <div className="flex items-center justify-between border-b border-line px-4 pt-4 pb-3">
            <h2 className="m-0 text-base font-bold">
              Notifications <span className="font-medium text-muted">({count})</span>
            </h2>
            <div className="flex items-center gap-1">
              <button type="button" onClick={markAll} disabled={!count} className="border-0 bg-transparent text-xs font-semibold text-primary disabled:text-primary-disabled">
                Mark all as read
              </button>
              <Link href={settingsHref} aria-label="Notification settings" onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center text-ink-3">
                <NavSettings />
              </Link>
            </div>
          </div>
          <ul className="m-0 flex list-none flex-col overflow-y-auto p-0">
            {items === null && <li className="px-4 py-6 text-center text-[13px] text-muted">Loading…</li>}
            {items?.length === 0 && <li className="px-4 py-8 text-center text-[13px] text-muted">You’re all caught up.</li>}
            {items?.map((i) => {
              const inner = (
                <>
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-control border border-primary text-primary">
                    <TypeIcon type={i.type} />
                  </span>
                  <span className="flex flex-col gap-1.5 text-left">
                    <span className="text-[13px] leading-[1.45] text-ink">
                      <strong>{i.title}</strong> {i.body}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-muted">
                      {!i.readAt && <span className="h-[7px] w-[7px] rounded-full bg-danger" aria-label="Unread" />}
                      {ago(i.createdAt)}
                    </span>
                  </span>
                </>
              );
              const cls = clsx("flex w-full gap-3 border-b border-surface-2 px-4 py-3.5 text-left no-underline", !i.readAt && "bg-surface");
              return (
                <li key={i.id}>
                  {i.link ? (
                    <Link href={i.link} onClick={() => openItem(i)} className={cls}>{inner}</Link>
                  ) : (
                    <button type="button" onClick={() => openItem(i)} className={clsx(cls, "border-x-0 border-t-0 bg-transparent")}>{inner}</button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
