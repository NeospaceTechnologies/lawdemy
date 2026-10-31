"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const ITEMS = [
  { href: "/admin", label: "Review queue", count: "queue" },
  { href: "/admin/live", label: "Live courses" },
  { href: "/admin/reports", label: "Reports", count: "reports" },
  { href: "/admin/payouts", label: "Payouts", count: "payouts" },
  { href: "/admin/reconciliation", label: "Reconciliation" },
  { href: "/admin/orders", label: "Orders & refunds" },
  { href: "/admin/support", label: "Support inbox", count: "tickets" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/bonuses", label: "Bonuses" },
  { href: "/admin/settings", label: "Content settings" },
] as const;

type Counts = { queue: number; reports: number; payouts: number; tickets: number };

export function AdminNav({ counts }: { counts: Counts }) {
  const path = usePathname();
  const active = (href: string) => (href === "/admin" ? path === "/admin" || path.startsWith("/admin/courses") : path.startsWith(href));
  return (
    <nav aria-label="Staff console" className="flex flex-col gap-0.5">
      {ITEMS.map((i) => {
        const n = "count" in i ? counts[i.count] : 0;
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active(i.href) ? "page" : undefined}
            className={clsx("flex h-9 items-center justify-between rounded-control px-2.5 text-[13px] no-underline", active(i.href) ? "bg-nav-active font-semibold text-ink" : "text-ink-2 hover:bg-nav-active/60")}
          >
            {i.label}
            {n > 0 && <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">{n}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
