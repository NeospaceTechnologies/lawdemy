"use client";
import { useTaxonomy } from "@/components/TaxonomyProvider";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Select, TextArea } from "@/components/ui/Field";
import { SuccessBadge } from "@/components/ui/Onboarding";
import { api, ApiClientError } from "@/lib/api-client";


/** "Report this post" → "Thanks for reporting!" (QA-ManageFlow, Community). */
export function ReportDialog({ target, onClose }: { target: { type: string; id: string } | null; onClose: () => void }) {
  const taxonomy = useTaxonomy();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thanks, setThanks] = useState(false);

  function close() {
    setReason("");
    setDetails("");
    setThanks(false);
    setError(null);
    onClose();
  }

  async function submit() {
    if (!target || !reason) return;
    setBusy(true);
    setError(null);
    try {
      await api("/api/reports", { body: { targetType: target.type, targetId: target.id, reason, details: details || undefined } });
      setThanks(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn’t send your report.");
    } finally {
      setBusy(false);
    }
  }

  if (thanks) {
    return (
      <Dialog open={!!target} title="" onRequestClose={close} width={380}>
        <div className="-mt-6 flex flex-col items-center gap-3 text-center">
          <SuccessBadge size={56} />
          <h2 className="m-0 text-[17px] font-semibold">Thanks for reporting!</h2>
          <p className="m-0 text-[13px] leading-normal text-ink-3">We’ll review this post shortly. You won’t see updates, but action will be taken if necessary.</p>
          <Button className="mt-2 w-full" onClick={close}>Done</Button>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog open={!!target} title="Report this post" description="Help us keep Lawdemy’s community clean. Why are you reporting this post?" onRequestClose={close}>
      <label className="flex flex-col gap-1.5 text-xs font-semibold">
        Reason for reporting
        <Select data-autofocus value={reason} onChange={(e) => setReason(e.target.value)} className="h-10 text-[13px] font-normal">
          <option value="">Select option</option>
          {taxonomy.report_reason.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </Select>
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-semibold">
        Details (Optional)
        <TextArea rows={3} maxLength={1000} placeholder="Tell us more about your issue" value={details} onChange={(e) => setDetails(e.target.value)} className="text-[13px] font-normal" />
      </label>
      {error && <p role="alert" className="m-0 text-xs text-danger-text">{error}</p>}
      <div className="grid grid-cols-2 gap-2.5">
        <Button variant="outline" size="md" className="h-10" onClick={close}>Cancel</Button>
        <Button size="md" className="h-10" disabled={!reason} busy={busy} busyLabel="Submitting…" onClick={submit}>Submit</Button>
      </div>
    </Dialog>
  );
}
