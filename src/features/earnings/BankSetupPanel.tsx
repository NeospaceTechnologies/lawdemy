"use client";
import { useState } from "react";
import { BankAccountForm, isBankAccountComplete, type Bank, type BankAccountValue } from "@/components/ui/BankAccountForm";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { FieldMessage } from "@/components/ui/Field";
import { PasswordInput, SuccessBadge } from "@/components/ui/Onboarding";
import { PinInput } from "@/components/ui/PinInput";
import { SlideOver } from "@/components/ui/SlideOver";
import { Dialog } from "@/components/ui/Dialog";
import { api, ApiClientError } from "@/lib/api-client";
import { bankResolver } from "./bankResolver";

type Mode = "add" | "edit";
const EMPTY: BankAccountValue = { accountNumber: "", bankCode: "", accountName: null };

/**
 * Add Bank Account → Create Transaction Pin → saved (INS-PAY-02/03), or
 * Edit Bank Details: password → form → update (INS-PAY-10).
 */
export function BankSetupPanel({ mode, banks, hasPin, email, onClose, onSaved }: { mode: Mode; banks: Bank[]; hasPin: boolean; email: string; onClose: () => void; onSaved: (message: { title: string; body: string } | null) => void }) {
  const [step, setStep] = useState<"auth" | "email" | "form" | "pin">(mode === "edit" ? "auth" : "form");
  const [pw, setPw] = useState("");
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [acct, setAcct] = useState<BankAccountValue>(EMPTY);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leave, setLeave] = useState(false);
  const [saved, setSaved] = useState(false);
  const dirty = !!pw || !!acct.accountNumber || !!pin;

  const heading = step === "email" ? "Check Your Email" : step === "pin" ? "Create Transaction Pin" : mode === "edit" ? "Edit Bank Details" : "Add Bank Account";
  const sub =
    step === "email" ? "Reset your password to continue."
    : step === "pin" ? "To protect your withdrawals, please create a secure 4-digit PIN. You’ll need it whenever you withdraw or update your payout info."
    : step === "auth" ? "For security reasons, you’ll need to confirm your account password before making changes to your bank information."
    : mode === "edit" ? "Update your bank account information below. Please ensure the details match your account name to avoid payment issues."
    : "Before you can receive your earnings, please add a verified bank account. Ensure your bank details match the information registered with your BVN.";

  function requestClose() {
    if (busy) return;
    if (dirty && !saved) setLeave(true);
    else onClose();
  }

  async function next() {
    setError(null);
    setBusy(true);
    try {
      if (step === "auth") {
        await api("/api/instructor/verify-password", { body: { password: pw } });
        setStep("form");
      } else if (step === "email") {
        onSaved({ title: "Reset link sent", body: "Check your inbox for the password reset email." });
        onClose();
      } else if (step === "form" && mode === "edit") {
        await api("/api/instructor/bank-accounts/replace", { body: { password: pw, accountNumber: acct.accountNumber, bankCode: acct.bankCode } });
        onSaved({ title: "Bank Details Updated", body: "Your payout information has been successfully updated." });
        onClose();
      } else if (step === "form" && !hasPin) {
        setStep("pin");
      } else {
        await api("/api/instructor/bank-accounts", { body: { accountNumber: acct.accountNumber, bankCode: acct.bankCode, ...(hasPin ? {} : { pin }) } });
        setSaved(true);
      }
    } catch (err) {
      if (err instanceof ApiClientError && err.code === "WRONG_PASSWORD") setPwErr(err.message);
      else setError(err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function forgot() {
    await api("/api/auth/password-reset/request", { body: { email, role: "instructor" } }).catch(() => {});
    setStep("email");
  }

  const canNext = step === "auth" ? !!pw : step === "email" ? true : step === "form" ? isBankAccountComplete(acct) : /^\d{4}$/.test(pin);
  const label = busy ? "Saving…" : step === "auth" ? "Continue" : step === "email" ? "Done" : step === "pin" ? "Save Bank Details" : mode === "edit" ? "Update Bank Details" : hasPin ? "Save Bank Details" : "Continue";

  if (saved) {
    return (
      <Dialog open title="" onRequestClose={() => { onSaved(null); onClose(); }} width={380}>
        <div className="-mt-6 flex flex-col items-center gap-3 text-center">
          <SuccessBadge size={56} />
          <h2 className="m-0 text-[17px] font-semibold">Bank Information saved successfully</h2>
          <p className="m-0 text-[13px] leading-normal text-ink-3">Your bank information and withdrawal PIN have been saved. You’re now ready to receive your earnings. For your security, withdrawals to a new account open after 24 hours.</p>
          <Button className="mt-2 w-full" onClick={() => { onSaved(null); onClose(); }}>Done</Button>
        </div>
      </Dialog>
    );
  }

  return (
    <>
      <SlideOver
        open
        title={heading}
        description={sub}
        onRequestClose={requestClose}
        footer={
          <>
            {step === "pin" ? <Button variant="outline" onClick={() => setStep("form")}>Back</Button> : <Button variant="outline" onClick={requestClose}>Cancel</Button>}
            <Button disabled={!canNext} busy={busy} busyLabel="Saving…" onClick={next}>{label}</Button>
          </>
        }
      >
        {error && <p role="alert" className="m-0 rounded-control bg-danger-bg px-3 py-2 text-xs text-danger-text">{error}</p>}
        {step === "auth" && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="bk-pw" className="text-xs font-semibold">Password</label>
            <PasswordInput id="bk-pw" data-autofocus placeholder="Enter your password" value={pw} onChange={(e) => { setPw(e.target.value); setPwErr(null); }} invalid={!!pwErr} />
            {pwErr && <FieldMessage tone="error">{pwErr}</FieldMessage>}
            <button type="button" onClick={forgot} className="self-end border-0 bg-transparent p-0 text-xs font-semibold text-primary">Forgot Password?</button>
          </div>
        )}
        {step === "email" && <p className="m-0 text-[13px] leading-normal text-ink-2">We’ve sent a password reset link to <strong>{email}</strong>. Follow the link to create a new password, then come back to update your bank details.</p>}
        {step === "form" && (
          <>
            {mode === "edit" && <div role="note" className="rounded-control border border-warning-bg bg-[#FFFAEB] px-3 py-2.5 text-xs text-warning-text"><strong>Please note</strong><br />Changes to your bank information may take up to 24 hours to be reflected and verified.</div>}
            <BankAccountForm banks={banks} value={acct} onChange={setAcct} resolver={bankResolver} />
          </>
        )}
        {step === "pin" && (
          <div className="flex flex-col items-center gap-2 pt-4">
            <PinInput label="Enter a 4-digit PIN" value={pin} onChange={setPin} message={`${pin.length}/4 digits`} />
          </div>
        )}
      </SlideOver>
      <ConfirmDialog
        open={leave}
        title={mode === "add" ? "Discard Setup?" : "Leave without saving?"}
        body={mode === "add" ? "Your bank setup isn’t finished. If you leave now, the details you entered won’t be saved." : "Your changes haven’t been saved. Are you sure you want to exit this process?"}
        confirmLabel="Stay On This Page"
        cancelLabel={mode === "add" ? "Discard Setup" : "Leave Anyway"}
        cancelTone="danger"
        onConfirm={() => setLeave(false)}
        onCancel={() => { setLeave(false); onClose(); }}
      />
    </>
  );
}
