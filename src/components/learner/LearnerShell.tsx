"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { Logo } from "@/components/ui/Logo";
import { ToastViewport } from "@/components/ui/Toast";
import { ChevronDownIcon, LogoutIcon, MenuIcon, NavCertificates, NavCommunity, NavCourses, NavDashboard, NavSettings, NavSupport } from "@/components/ui/icons";
import { LearnerProvider } from "./LearnerContext";

const MAIN = [
  { href: "/dashboard", label: "Dashboard", Icon: NavDashboard },
  { href: "/my-courses", label: "My Courses", Icon: NavCourses },
  { href: "/certifications", label: "Certifications", Icon: NavCertificates },
  { href: "/community", label: "Community", Icon: NavCommunity },
];
const FOOT = [
  { href: "/support", label: "Support", Icon: NavSupport },
  { href: "/settings", label: "Settings", Icon: NavSettings },
];

// Catalogue, search, cart, wishlist, course pages and the player belong to "My Courses"
// (as drawn); the dashboard and its "Recommended" list belong to "Dashboard".
const MY_COURSES = ["/my-courses", "/learn", "/courses", "/search", "/cart", "/wishlist"];
function activeHref(path: string) {
  if (MY_COURSES.some((p) => path === p || path.startsWith(p + "/"))) return "/my-courses";
  const hit = [...MAIN, ...FOOT].find((i) => path === i.href || path.startsWith(i.href + "/"));
  return hit?.href ?? "/dashboard";
}

type User = { firstName: string; lastName: string; email: string; photoUrl: string | null };

export function LearnerShell({ user, counts, children }: { user: User; counts: { cart: number; unread: number }; children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const active = activeHref(path);
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  useEffect(() => {
    setMenuOpen(false);
    setUserMenu(false);
  }, [path]);

  async function signOut() {
    await fetch("/api/auth/sign-out", { method: "POST" });
    router.replace("/sign-in");
    router.refresh();
  }

  const link = (i: (typeof MAIN)[number]) => (
    <Link
      key={i.href}
      href={i.href}
      aria-current={active === i.href ? "page" : undefined}
      className={clsx(
        "flex h-10 items-center gap-2.5 rounded-control px-3 text-sm no-underline",
        active === i.href ? "bg-nav-active font-semibold text-ink hover:text-ink" : "text-ink-2 hover:bg-nav-active/60 hover:text-ink",
      )}
    >
      <i.Icon />
      {i.label}
    </Link>
  );

  return (
    <LearnerProvider initial={counts}>
      <div className="flex min-h-screen flex-col bg-white md:flex-row">
        <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 md:hidden">
          <Logo />
          <button type="button" aria-label="Open menu" aria-expanded={menuOpen} aria-controls="lrn-sidebar" onClick={() => setMenuOpen((o) => !o)} className="flex h-10 w-10 items-center justify-center rounded-control text-ink-2">
            <MenuIcon />
          </button>
        </div>
        <aside
          id="lrn-sidebar"
          className={clsx("flex-col gap-6 border-r border-line bg-surface px-3.5 py-5 md:sticky md:top-0 md:flex md:h-screen md:w-60 md:flex-none", menuOpen ? "flex" : "hidden")}
        >
          <div className="hidden px-2 md:block">
            <Link href="/dashboard" aria-label="Lawdemy home" className="no-underline"><Logo /></Link>
          </div>
          <nav aria-label="Main" className="flex flex-col gap-0.5">{MAIN.map(link)}</nav>
          <div className="mt-auto flex flex-col gap-0.5">
            {FOOT.map(link)}
            <div className="relative mt-3">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={userMenu}
                onClick={() => setUserMenu((o) => !o)}
                className="flex w-full items-center gap-2.5 rounded-[10px] border border-line bg-white p-2.5 text-left"
              >
                {user.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photoUrl} alt="" className="h-[34px] w-[34px] flex-none rounded-full object-cover" />
                ) : (
                  <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full border-[1.5px] border-accent text-xs font-bold text-price">{initials}</span>
                )}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[13px] font-semibold">{user.firstName} {user.lastName}</span>
                  <span className="truncate text-[11px] text-muted">{user.email}</span>
                </span>
                <ChevronDownIcon size={14} className={clsx("text-muted transition-transform", userMenu && "rotate-180")} />
              </button>
              {userMenu && (
                <div role="menu" className="absolute right-0 bottom-full left-0 mb-1 rounded-[10px] border border-line bg-white p-1 shadow-lg">
                  <Link role="menuitem" href="/settings" className="flex h-9 items-center rounded-md px-3 text-[13px] text-ink-2 no-underline hover:bg-surface">Settings</Link>
                  <button role="menuitem" type="button" onClick={signOut} className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-[13px] text-danger-text hover:bg-danger-bg">
                    <LogoutIcon size={14} /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>
        <main className="flex min-w-0 flex-1 flex-col px-4 pt-5 pb-14 md:px-8">
          <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-7">
            <ToastViewport />
            {children}
          </div>
        </main>
      </div>
    </LearnerProvider>
  );
}
