"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { api, ApiClientError } from "@/lib/api-client";

export function ReviewActions({ courseId }: { courseId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<"" | "approved" | "rejected">("");
  async function decide(decision: "approved" | "rejected") {
    setBusy(decision);
    try {
      await api(`/api/admin/courses/${courseId}/decision`, { body: decision === "approved" ? { decision } : { decision, reason } });
      toast.show({ title: decision === "approved" ? "Course approved" : "Course rejected", body: "The instructor has been notified." });
      router.push("/admin");
      router.refresh();
    } catch (err) {
      toast.show({ tone: "error", title: "Couldn’t save the decision", body: err instanceof ApiClientError ? err.message : undefined });
      setBusy("");
    }
  }
  return (
    <section className="flex flex-col gap-3 rounded-card border border-line p-4">
      <strong className="text-sm">Decision</strong>
      <label className="flex flex-col gap-1.5 text-xs font-semibold">Reason for rejection (shown to the instructor, at least 20 characters)
        <TextArea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="text-[13px] font-normal" />
      </label>
      <div className="flex gap-2">
        <Button variant="danger" size="md" disabled={reason.trim().length < 20} busy={busy === "rejected"} busyLabel="Rejecting…" onClick={() => decide("rejected")}>Reject</Button>
        <Button size="md" busy={busy === "approved"} busyLabel="Approving…" onClick={() => decide("approved")}>Approve</Button>
      </div>
    </section>
  );
}
