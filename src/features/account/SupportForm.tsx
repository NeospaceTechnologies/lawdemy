"use client";
import { useState } from "react";
import { AttachmentPicker } from "@/components/shared/Attachments";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Select, TextArea } from "@/components/ui/Field";
import { ContinueIcon, GlobeIcon, MailIcon, NavSupport, PinIcon } from "@/components/ui/icons";
import { SuccessBadge } from "@/components/ui/Onboarding";
import { useToast } from "@/components/ui/Toast";
import { api, ApiClientError } from "@/lib/api-client";
import type { AssetRef } from "@/lib/course/schema";
import { SUPPORT_CONTACT } from "@/lib/support";

/** "Take a Seat" support form + contact details (Support.dc.html, Inst-Support.dc.html). */
export function SupportForm({
  categories,
  title = "Take a Seat",
  subtitle = "Our friendly team would love to hear from you.",
  variant = "learner",
}: {
  categories: string[];
  title?: string;
  subtitle?: string;
  /** Instructor support lists contacts as plain label/value rows (Inst-Support.dc.html). */
  variant?: "learner" | "instructor";
}) {
  const toast = useToast();
  const [cat, setCat] = useState("");
  const [msg, setMsg] = useState("");
  const [attachment, setAttachment] = useState<AssetRef | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [formKey, setFormKey] = useState(0);

  async function submit() {
    if (!cat || !msg.trim()) return;
    setBusy(true);
    try {
      await api("/api/support", { body: { category: cat, message: msg, attachmentId: attachment?.id ?? null } });
      setSent(true);
    } catch (err) {
      toast.show({ tone: "error", title: "Couldn’t send your message", body: err instanceof ApiClientError ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  function done() {
    setSent(false);
    setCat("");
    setMsg("");
    setAttachment(null);
    setFormKey((k) => k + 1);
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-[30px] font-bold tracking-[-0.01em]">{title}</h1>
        <p className="m-0 text-sm text-ink-3">{subtitle}</p>
      </div>
      <div className="flex flex-wrap items-start gap-10">
        <form
          key={formKey}
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="flex min-w-0 flex-[999_1_420px] flex-col gap-4"
        >
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
            Category
            <Select value={cat} onChange={(e) => setCat(e.target.value)} className="font-normal">
              <option value="">Select option</option>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
            {variant === "instructor" ? "Tell Us More About Your Issue" : "Tell us more about your issue"}
            <TextArea rows={5} maxLength={5000} placeholder="Enter a description…" value={msg} onChange={(e) => setMsg(e.target.value)} className="font-normal" />
          </label>
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold">Attach screenshot (Optional)</span>
            <AttachmentPicker inline value={attachment} onChange={setAttachment} />
          </div>
          <Button type="submit" className="self-start" disabled={!cat || !msg.trim()} busy={busy} busyLabel="Submitting…">
            Submit Request {variant === "learner" && <ContinueIcon />}
          </Button>
        </form>
        {variant === "instructor" ? (
          <dl className="m-0 grid flex-[1_1_280px] grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-[13px]">
            <dt className="text-ink-3">Send us a mail</dt><dd className="m-0"><a href={`mailto:${SUPPORT_CONTACT.email}`} className="underline">{SUPPORT_CONTACT.email}</a></dd>
            <dt className="text-ink-3">Call us</dt><dd className="m-0">{SUPPORT_CONTACT.phone}</dd>
            <dt className="text-ink-3">Address</dt><dd className="m-0">{SUPPORT_CONTACT.address}</dd>
            <dt className="text-ink-3">Follow us</dt><dd className="m-0 flex flex-wrap gap-2">{SUPPORT_CONTACT.socials.map((s) => <span key={s} className="underline">{s}</span>)}</dd>
          </dl>
        ) : (
        <ul className="m-0 flex flex-[1_1_280px] list-none flex-col gap-5 p-0">
          {[
            [MailIcon, "Send a mail", SUPPORT_CONTACT.email],
            [NavSupport, "Call us", SUPPORT_CONTACT.phone],
            [PinIcon, "Address", SUPPORT_CONTACT.address],
          ].map(([Icon, label, value]) => {
            const I = Icon as typeof MailIcon;
            return (
              <li key={label as string} className="flex items-start gap-3">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-control border border-primary text-primary"><I /></span>
                <span className="flex flex-col gap-0.5"><span className="text-xs text-ink-3">{label as string}</span><strong className="text-sm">{value as string}</strong></span>
              </li>
            );
          })}
          <li className="flex items-start gap-3">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-control border border-primary text-primary"><GlobeIcon /></span>
            <span className="flex flex-col gap-1.5"><span className="text-xs text-ink-3">Connect</span><span className="flex flex-wrap gap-2">{SUPPORT_CONTACT.socials.map((s) => <span key={s} className="flex h-7 items-center rounded-md bg-ink px-2.5 text-[11px] text-white">{s}</span>)}</span></span>
          </li>
        </ul>
        )}
      </div>
      <Dialog open={sent} title="" onRequestClose={done} width={380}>
        <div className="-mt-6 flex flex-col items-center gap-3 text-center">
          <SuccessBadge size={56} />
          <h2 className="m-0 text-[17px] font-semibold">Your message has been sent!</h2>
          <p className="m-0 text-[13px] leading-normal text-ink-3">Thanks for reaching out. Our support team will get back to you by email shortly.</p>
          <Button className="mt-2 w-full" onClick={done}>Done</Button>
        </div>
      </Dialog>
    </>
  );
}
