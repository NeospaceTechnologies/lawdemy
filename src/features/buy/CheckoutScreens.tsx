"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { SuccessBadge } from "@/components/ui/Onboarding";
import { SpinnerIcon } from "@/components/ui/icons";
import { api } from "@/lib/api-client";
import { PAY_KEY } from "./CartView";

/** Redirect.dc.html: hands off to the provider's hosted checkout. */
export function RedirectToPayment({ reference }: { reference: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let target: string | null = null;
    try {
      target = sessionStorage.getItem(PAY_KEY(reference));
    } catch {}
    setUrl(target);
    if (!target) return;
    const t = setTimeout(() => window.location.assign(target!), 1200);
    return () => clearTimeout(t);
  }, [reference]);
  return (
    <div className="flex min-h-screen flex-col items-center bg-[radial-gradient(circle_at_0%_0%,#FBF3DF_0%,#F1EDFB_30%,#ffffff_60%)] px-4 py-8">
      <Logo />
      <div role="status" className="mt-24 flex max-w-[420px] flex-col items-center gap-3.5 text-center">
        <SpinnerIcon className="animate-spin text-ink-2 [animation-duration:2s]" />
        <h1 className="m-0 text-xl font-semibold">Redirecting to Secure Payment…</h1>
        <p className="m-0 text-sm leading-[1.55] text-ink-3">
          You’ll be redirected to our secure payment partner to complete your transaction. <strong className="font-medium text-ink">Do not close this window.</strong>
        </p>
        <p className="m-0 mt-6 text-[13px] text-ink-3">
          If nothing happens, {url ? <a href={url} className="font-medium">Click here</a> : <a href="/cart" className="font-medium">return to your cart</a>}
        </p>
      </div>
    </div>
  );
}

/** PaymentSuccess.dc.html: waits for the order to be confirmed, then goes to My Courses. */
export function PaymentResult({ reference, initialStatus }: { reference: string; initialStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [pct, setPct] = useState(30);

  useEffect(() => {
    if (status !== "PENDING") return;
    const t = setInterval(async () => {
      const r = await api<{ status: string }>(`/api/learner/orders/${encodeURIComponent(reference)}`).catch(() => null);
      if (r && r.status !== "PENDING") setStatus(r.status);
    }, 1500);
    return () => clearInterval(t);
  }, [status, reference]);

  useEffect(() => {
    if (status !== "PAID") return;
    const tick = setInterval(() => setPct((p) => Math.min(100, p + 10)), 250);
    const go = setTimeout(() => {
      router.replace(`/my-courses?new=${encodeURIComponent(reference)}`);
      router.refresh();
    }, 2600);
    return () => {
      clearInterval(tick);
      clearTimeout(go);
    };
  }, [status, reference, router]);

  if (status === "FAILED") {
    return (
      <div className="flex min-h-screen flex-col items-center bg-white px-4 py-16">
        <div role="alert" className="mt-14 flex max-w-[420px] flex-col items-center gap-3.5 text-center">
          <h1 className="m-0 text-[22px] font-semibold">Payment wasn’t completed</h1>
          <p className="m-0 text-sm text-ink-3">No money was taken. Your courses are still in your cart, so you can try again.</p>
          <ButtonLink href="/cart" className="mt-2">Back to Cart</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-white px-4 py-16">
      <div role="progressbar" aria-label="Redirecting" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="h-1 w-full max-w-[880px] overflow-hidden rounded-sm bg-[#E4E4F5]">
        <div className="h-1 bg-primary transition-[width]" style={{ width: `${pct}%` }} />
      </div>
      <div role="status" className="mt-14 flex max-w-[420px] flex-col items-center gap-3.5 text-center">
        {status === "PAID" ? (
          <>
            <SuccessBadge size={96} />
            <h1 className="m-0 mt-2 text-[22px] font-semibold">Payment Successful</h1>
            <p className="m-0 text-sm text-ink-3">You’re now being redirected to your course dashboard.</p>
            <p className="m-0 mt-3 text-[13px] text-ink-3">If nothing happens, click <a href={`/my-courses?new=${encodeURIComponent(reference)}`}>here</a> to continue.</p>
          </>
        ) : (
          <>
            <SpinnerIcon className="animate-spin text-ink-2 [animation-duration:2s]" />
            <h1 className="m-0 text-xl font-semibold">Confirming your payment…</h1>
            <p className="m-0 text-sm text-ink-3">This usually takes a few seconds.</p>
          </>
        )}
      </div>
    </div>
  );
}
