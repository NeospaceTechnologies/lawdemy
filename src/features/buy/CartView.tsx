"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLearner } from "@/components/learner/LearnerContext";
import { CourseCard, CourseGrid } from "@/components/learner/CourseCard";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { CartIcon, HeartIcon, TrashIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/Toast";
import { api, ApiClientError } from "@/lib/api-client";
import type { CourseCardData } from "@/lib/catalog";
import { formatNaira } from "@/lib/format";

export type CartLine = { courseId: string; title: string; instructor: string; priceKobo: number; fullKobo: number; meta: string; thumbnailUrl: string | null };
export const PAY_KEY = (ref: string) => `lawdemy:pay:${ref}`;

/** Cart with remove (confirm), move to wishlist, summary and Proceed to Pay (Cart*.dc.html). */
export function CartView({ initial, explore }: { initial: CartLine[]; explore: CourseCardData[] }) {
  const router = useRouter();
  const toast = useToast();
  const { setCounts } = useLearner();
  const [items, setItems] = useState(initial);
  const [pending, setPending] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [paying, setPaying] = useState(false);

  const full = items.reduce((a, i) => a + i.fullKobo, 0);
  const total = items.reduce((a, i) => a + i.priceKobo, 0);
  const discount = full - total;

  async function remove() {
    if (!pending) return;
    setBusy(true);
    try {
      const r = await api<{ count: number }>(`/api/learner/cart/${pending}`, { method: "DELETE" });
      setItems((xs) => xs.filter((x) => x.courseId !== pending));
      setCounts({ cart: r.count });
      toast.show({ title: "Course removed from cart", body: "This course is no longer in your cart." });
    } finally {
      setBusy(false);
      setPending(null);
    }
  }

  async function toWishlist(id: string) {
    const r = await api<{ count: number }>(`/api/learner/cart/${id}/move-to-wishlist`, { method: "POST" }).catch(() => null);
    if (!r) return;
    setItems((xs) => xs.filter((x) => x.courseId !== id));
    setCounts({ cart: r.count });
    toast.show({ title: "Moved to wishlist", body: "You can find this course in your wishlist." });
  }

  async function pay() {
    setPaying(true);
    try {
      const r = await api<{ reference: string; authorizationUrl: string }>("/api/learner/checkout", { method: "POST" });
      try {
        sessionStorage.setItem(PAY_KEY(r.reference), r.authorizationUrl);
      } catch {}
      router.push(`/checkout/redirect?reference=${encodeURIComponent(r.reference)}`);
    } catch (err) {
      toast.show({ tone: "error", title: "Couldn’t start checkout", body: err instanceof ApiClientError ? err.message : undefined });
      setPaying(false);
    }
  }

  if (items.length === 0) {
    return (
      <>
        <h1 className="m-0 text-[28px] font-bold tracking-[-0.01em]">Your Cart <span className="text-xl font-medium text-muted">(0)</span></h1>
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="flex h-[52px] w-[52px] items-center justify-center rounded-card border-[1.5px] border-primary bg-[#F4F4FD] text-primary"><CartIcon size={24} /></span>
          <h2 className="m-0 text-[17px] font-semibold">Your cart is empty</h2>
          <p className="m-0 max-w-[340px] text-[13px] leading-normal text-ink-3">It looks like you haven’t added anything to your cart yet. Let’s change that!</p>
          <ButtonLink href="/courses" size="md" className="h-10 px-5">Start Shopping</ButtonLink>
        </div>
        {explore.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="m-0 text-lg font-semibold">Explore Courses</h2>
            <CourseGrid>{explore.map((c) => <CourseCard key={c.id} c={c} />)}</CourseGrid>
          </section>
        )}
      </>
    );
  }

  return (
    <>
      <h1 className="m-0 text-[30px] font-semibold tracking-[-0.01em]">Your Cart <span className="text-lg font-normal text-ink-3">({items.length})</span></h1>
      <div className="flex flex-wrap items-start gap-10">
        <div className="flex min-w-0 flex-[999_1_420px] flex-col">
          {items.map((it) => (
            <article key={it.courseId} className="flex gap-4 border-b border-line py-5">
              <div className="h-[76px] w-[76px] flex-none rounded-control bg-[#2B2F36] bg-cover bg-center" style={it.thumbnailUrl ? { backgroundImage: `url(${it.thumbnailUrl})` } : undefined} aria-hidden="true" />
              <div className="flex min-w-0 flex-col gap-1.5">
                <h2 className="m-0 text-lg leading-[1.35] font-medium"><Link href={`/courses/${it.courseId}`} className="text-ink no-underline hover:underline">{it.title}</Link></h2>
                <span className="text-[13px] text-ink-3">By {it.instructor}</span>
                <span className="flex items-baseline gap-2">
                  <strong className="text-[15px]">{formatNaira(it.priceKobo)}</strong>
                  {it.fullKobo !== it.priceKobo && <s className="text-xs text-muted">{formatNaira(it.fullKobo)}</s>}
                </span>
                <span className="text-xs text-ink-3">{it.meta}</span>
                <div className="mt-1.5 flex flex-wrap gap-2.5">
                  <Button variant="danger" size="md" className="h-10 px-[18px]" onClick={() => setPending(it.courseId)}><TrashIcon />Remove</Button>
                  <Button variant="outline" size="md" className="h-10" onClick={() => toWishlist(it.courseId)}><HeartIcon size={14} />Add to Wishlist</Button>
                </div>
              </div>
            </article>
          ))}
        </div>
        <section aria-labelledby="sum-t" className="flex flex-[1_1_320px] flex-col gap-3">
          <h2 id="sum-t" className="m-0 text-[22px] font-semibold">Summary</h2>
          <div className="flex justify-between text-[13px] text-ink-3"><span>Item(s) total</span><strong className="text-ink">{formatNaira(full)}</strong></div>
          <div className="flex justify-between border-b border-line pb-3 text-[13px] text-ink-3"><span>Discount</span><span>{discount ? `−${formatNaira(discount)}` : "N/A"}</span></div>
          <div className="flex justify-between text-sm"><span><strong>Total</strong> ({items.length} Course{items.length === 1 ? "" : "s"})</span><strong>{formatNaira(total)}</strong></div>
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <ButtonLink href="/courses" variant="outline" className="h-12">Continue Shopping</ButtonLink>
            <Button className="h-12" onClick={pay} busy={paying} busyLabel="Starting…">Proceed to Pay</Button>
          </div>
        </section>
      </div>
      <ConfirmDialog
        open={pending !== null}
        title="Remove Course?"
        body="Are you sure you want to remove this course? This action cannot be undone."
        confirmLabel="Remove Course"
        tone="danger"
        busy={busy}
        busyLabel="Removing…"
        onCancel={() => setPending(null)}
        onConfirm={remove}
      />
    </>
  );
}
