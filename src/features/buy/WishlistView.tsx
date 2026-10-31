"use client";
import { useState } from "react";
import { CourseCard, CourseGrid } from "@/components/learner/CourseCard";
import { ButtonLink } from "@/components/ui/Button";
import { HeartIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api-client";
import type { CourseCardData } from "@/lib/catalog";

/** Wishlist grid with heart-to-remove, and the empty state (Wishlist*.dc.html). */
export function WishlistView({ initial }: { initial: CourseCardData[] }) {
  const toast = useToast();
  const [cards, setCards] = useState(initial);

  async function remove(id: string) {
    setCards((cs) => cs.filter((c) => c.id !== id));
    await api(`/api/learner/wishlist/${id}`, { method: "DELETE" }).catch(() => {});
    toast.show({ title: "Removed from wishlist", body: "You can add it back from the course page." });
  }

  if (!cards.length) {
    return (
      <>
        <h1 className="m-0 text-[28px] font-bold tracking-[-0.01em]">Your Wishlist</h1>
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex h-[52px] w-[52px] items-center justify-center rounded-card border-[1.5px] border-primary bg-[#F4F4FD] text-primary"><HeartIcon size={22} /></span>
          <h2 className="m-0 text-[17px] font-semibold">Your wishlist is empty</h2>
          <p className="m-0 max-w-[340px] text-[13px] leading-normal text-ink-3">Start saving your favourite courses by clicking the heart icon.</p>
          <ButtonLink href="/courses" size="md" className="h-10 px-5">Start Shopping</ButtonLink>
        </div>
      </>
    );
  }
  return (
    <>
      <h1 className="m-0 text-[28px] font-bold tracking-[-0.01em]">Your Wishlist <span className="text-xl font-medium text-muted">({cards.length})</span></h1>
      <CourseGrid>{cards.map((c) => <CourseCard key={c.id} c={c} onUnwish={() => remove(c.id)} />)}</CourseGrid>
    </>
  );
}
