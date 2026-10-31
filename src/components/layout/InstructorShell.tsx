"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { Logo } from "@/components/ui/Logo";
import { ToastViewport } from "@/components/ui/Toast";
import { MenuIcon, NavCommunity, NavCourses, NavDashboard, NavEarnings, NavSettings, NavSupport } from "@/components/ui/icons";

// The Create Course wizard (new, or a draft reopened at /courses/[id]/edit) is opened from the dashboard.
const isWizard = (path: string) => path === "/instructor/courses/new" || /^\/instructor\/courses\/[^/]+\/edit$/.test(path);

const MAIN = [
  { href: "/instructor/dashboard", label: "Dashboard", Icon: NavDashboard, match: ["/instructor/dashboard"] },
  { href: "/instructor/courses", label: "My Courses", Icon: NavCourses, match: [] as string[] },
  { href: "/instructor/earnings", label: "Earnings", Icon: NavEarnings, match: [] },
  { href: "/instructor/community", label: "Community", Icon: NavCommunity, match: [] },
];
const FOOT = [
  { href: "/instructor/support", label: "Support", Icon: NavSupport, match: [] as string[] },
  { href: "/instructor/settings", label: "Settings", Icon: NavSettings, match: [] },
];

function isActive(path: string, item: (typeof MAIN)[number]) {
  if (isWizard(path)) return item.href === "/instructor/dashboard";
  if (item.match.some((m) => path.startsWith(m))) return true;
  return path === item.href || path.startsWith(item.href + "/");
}

function NavLink({ item, path }: { item: (typeof MAIN)[number]; path: string }) {
  const active = isActive(path, item);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "flex h-10 items-center gap-2.5 rounded-control px-3 text-sm no-underline",
        active ? "bg-nav-active font-semibold text-ink hover:text-ink" : "text-ink-2 hover:bg-nav-active/60 hover:text-ink",
      )}
    >
      <item.Icon />
      {item.label}
    </Link>
  );
}

export function InstructorShell({ user, children }: { user: { firstName: string; lastName: string }; children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  useEffect(() => setMenuOpen(false), [path]);

  async function signOut() {
    await fetch("/api/auth/sign-out", { method: "POST" });
    router.replace("/instructor/sign-in");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      {/* Mobile top bar: the sidebar collapses to a menu on small screens (PRD 9). */}
      <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 md:hidden">
        <Logo instructor />
        <button type="button" aria-label="Open menu" aria-expanded={menuOpen} aria-controls="inst-sidebar" onClick={() => setMenuOpen((o) => !o)} className="flex h-10 w-10 items-center justify-center rounded-control text-ink-2">
          <MenuIcon />
        </button>
      </div>

      <aside
        id="inst-sidebar"
        className={clsx(
          "flex-col gap-6 border-r border-line bg-surface px-3.5 py-5 md:sticky md:top-0 md:flex md:h-screen md:w-60 md:flex-none",
          menuOpen ? "flex" : "hidden",
        )}
      >
        <div className="hidden px-2 md:block">
          <Logo instructor />
        </div>
        <nav aria-label="Main" className="flex flex-col gap-0.5">
          {MAIN.map((item) => (
            <NavLink key={item.href} item={item} path={path} />
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-0.5">
          {FOOT.map((item) => (
            <NavLink key={item.href} item={item} path={path} />
          ))}
          <div className="relative mt-3">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={userMenu}
              onClick={() => setUserMenu((o) => !o)}
              className="flex w-full items-center gap-2.5 rounded-[10px] border border-line bg-white p-2.5 text-left"
            >
              <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-[#7A4E3A] text-xs font-bold text-[#F5E6D3]">{initials}</span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13px] font-semibold">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-[11px] text-muted">Instructor</span>
              </span>
            </button>
            {userMenu && (
              <div role="menu" className="absolute right-0 bottom-full left-0 mb-1 rounded-[10px] border border-line bg-white p-1 shadow-lg">
                <button role="menuitem" type="button" onClick={signOut} className="flex h-9 w-full items-center rounded-md px-3 text-left text-[13px] text-danger-text hover:bg-danger-bg">
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col gap-[22px] px-4 pt-5 pb-14 md:px-8">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-[22px]">
          <ToastViewport />
          {children}
        </div>
      </main>
    </div>
  );
}
