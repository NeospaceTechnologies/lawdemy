"use client";
import { useState, type ReactNode } from "react";
import { Tabs } from "@/components/ui/Tabs";

/** Tabbed Settings page shell (orange underline tabs). */
export function SettingsTabs({ tabs, initial, subtitle = "Manage and update your Lawdemy account info." }: { tabs: { id: string; label: string; content: ReactNode }[]; initial?: string; subtitle?: string }) {
  const [tab, setTab] = useState(initial ?? tabs[0].id);
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-[30px] font-bold tracking-[-0.01em]">Settings</h1>
        <p className="m-0 text-sm text-ink-3">{subtitle}</p>
      </div>
      <Tabs tabs={tabs.map((t) => ({ id: t.id, label: t.label }))} value={tab} onChange={setTab} label="Settings sections" fill>
        {tabs.find((t) => t.id === tab)?.content}
      </Tabs>
    </>
  );
}
