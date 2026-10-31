"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { CategoryTabs } from "@/components/learner/CategoryTabs";

export function CategoryNav({ value }: { value: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  return (
    <CategoryTabs
      value={value}
      onChange={(c) => {
        const p = new URLSearchParams(sp.toString());
        p.set("category", c);
        router.push(`/courses?${p.toString()}`);
      }}
    />
  );
}
