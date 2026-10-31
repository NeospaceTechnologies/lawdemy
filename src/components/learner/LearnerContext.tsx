"use client";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { api } from "@/lib/api-client";

type Counts = { cart: number; unread: number };
type Ctx = Counts & { setCounts: (c: Partial<Counts>) => void; refreshCounts: () => Promise<void> };

const LearnerCtx = createContext<Ctx | null>(null);

export function LearnerProvider({ initial, children }: { initial: Counts; children: ReactNode }) {
  const [counts, set] = useState(initial);
  const setCounts = useCallback((c: Partial<Counts>) => set((s) => ({ ...s, ...c })), []);
  const refreshCounts = useCallback(async () => {
    const c = await api<Counts>("/api/learner/counts").catch(() => null);
    if (c) set(c);
  }, []);
  return <LearnerCtx.Provider value={{ ...counts, setCounts, refreshCounts }}>{children}</LearnerCtx.Provider>;
}

export function useLearner() {
  const c = useContext(LearnerCtx);
  if (!c) throw new Error("useLearner must be used inside <LearnerProvider>");
  return c;
}
