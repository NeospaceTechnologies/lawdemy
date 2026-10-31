"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NotificationsBell } from "@/components/shared/NotificationsPanel";
import { SearchIcon } from "@/components/ui/icons";

/** Instructor top bar: search across own courses + notifications (INS-DASH-03/04). */
export function InstructorTopbar({ unread, query = "" }: { unread: number; query?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(query);
  const [focus, setFocus] = useState(false);
  const go = () => q.trim() && router.push(`/instructor/search?q=${encodeURIComponent(q.trim())}`);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="relative w-[320px] max-w-full">
        <form role="search" onSubmit={(e) => { e.preventDefault(); go(); }}>
          <label className="flex h-10 items-center gap-2 rounded-control border border-line bg-surface px-3">
            <SearchIcon size={16} className="text-muted" />
            <input
              type="search"
              aria-label="Search your courses"
              placeholder="Search your courses"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setFocus(true)}
              onBlur={() => setTimeout(() => setFocus(false), 150)}
              className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
            />
          </label>
        </form>
        {focus && q.trim() && (
          <Link href={`/instructor/search?q=${encodeURIComponent(q.trim())}`} className="absolute top-[46px] right-0 left-0 z-20 rounded-control border border-line bg-white p-3 text-[13px] font-medium no-underline shadow-[0_8px_20px_rgba(16,24,40,0.1)]">
            See all results for “{q.trim()}”
          </Link>
        )}
      </div>
      <NotificationsBell unread={unread} settingsHref="/instructor/settings?tab=notifications" />
    </div>
  );
}
