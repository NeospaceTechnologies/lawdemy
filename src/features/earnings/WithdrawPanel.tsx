"use client";
import { useState } from "react";
import clsx from "clsx";
import { BankAccountForm, isBankAccountComplete, type Bank, type BankAccountValue } from "@/components/ui/BankAccountForm";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { FieldMessage } from "@/components/ui/Field";
import { PasswordInput, SuccessBadge } from "@/components/ui/Onboarding";
import { PinInput } from "@/components/ui/PinInput";
import { SlideOver } from "@/components/ui/SlideOver";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { api, ApiClientError } from "@/lib/api-client";
import type { BankAccountView } from "@/lib/banking";
import { formatNaira } from "@/lib/format";
import { bankResolver } from "./bankResolver";

type Step = "form" | "review" | "pin" | "receipt" | "choose" | "add" | "resetAuth" | "resetPin";
const HEADS: Record<Step, [string, string]> = {
  form: ["Withdraw Earnings", "Transfer your available balance securely to your registered bank account."],
  review: ["Confirm Withdrawal Details", "Review your transaction before continuing."],
  pin: ["Enter Transaction PIN", "Enter your 4-digit PIN to authorise this withdrawal."],
  receipt: ["Transaction Receipt", "A copy has been sent to your email."],
  choose: ["Choose Bank Account", "Select an existing account for this withdrawal or add a new one."],
  add: ["Add Bank Account", "Please add a verified bank account. Ensure your bank details match the information registered with your BVN."],
  resetAuth: ["Reset Transaction Pin", "To keep your earnings secure, we’ll need to verify your identity before allowing a PIN reset."],
  resetPin: ["Create New Transaction Pin", "Now set your new secure 4-digit PIN."],
};
const QUICK = [1000, 2000, 5000, 10000, 20000, 40000];
type Result = { id: string; reference: string; status: string; failureReason: string | null; amountKobo: number; feeKobo: number; bank: string; accountName: string };

/** Withdraw Earnings flow (Inst-Withdraw.dc.html, INS-PAY-06..11). */
export function WithdrawPanel({ availableKobo, feeKobo, minKobo, accounts: initialAccounts, banks, initialAmount, initialAccountId, onClose, onDone }: {
  availableKobo: number;
  feeKobo: number;
  minKobo: number;
  accounts: BankAccountView[];
  banks: Bank[];
  initialAmount?: number;
  initialAccountId?: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [step, setStep] = useState<Step>("form");
  const [accountId, setAccountId] = useState(initialAccountId ?? initialAccounts.find((a) => a.isDefault)?.id ?? initialAccounts[0]?.id ?? "");
  const [chooseSel, setChooseSel] = useState(accountId);
  const [amount, setAmount] = useState(initialAmount ? String(initialAmount / 100) : "");
  const [pin, setPin] = useState("");
  const [pinMsg, setPinMsg] = useState<{ text: string; error: boolean } | null>(null);
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [success, setSuccess] = useState(false);
  const [confirm, setConfirm] = useState<null | { kind: "cancel" } | { kind: "remove"; id: string }>(null);
  const [add, setAdd] = useState<BankAccountValue>({ accountNumber: "", bankCode: "", accountName: null });
  const [rsPw, setRsPw] = useState("");
  const [rsErr, setRsErr] = useState<string | null>(null);
  const [np1, setNp1] = useState("");
  const [np2, setNp2] = useState("");
  const [error, setError] = useState<string | null>(null);

  const account = accounts.find((a) => a.id === accountId);
  const amountKobo = Math.round((Number(amount.replace(/,/g, "")) || 0) * 100);
  const amtErr = amountKobo > 0
    ? amountKobo < minKobo ? `Minimum withdrawal is ${formatNaira(minKobo).replace(/\.00$/, "")}`
    : amountKobo > availableKobo ? "Amount exceeds your available balance"
    : amountKobo + feeKobo > availableKobo ? `Amount plus the ${formatNaira(feeKobo).replace(/\.00$/, "")} charge exceeds your available balance`
    : null
    : null;
  const onHold = !!account?.usableFrom;
  const formOk = !!account && amountKobo > 0 && !amtErr && !onHold;

  function requestClose() {
    if (busy) return;
    if (step === "receipt" || success) return onClose();
    if (amount && (step === "form" || step === "review" || step === "pin")) setConfirm({ kind: "cancel" });
    else onClose();
  }

  async function submitPin() {
    setBusy(true);
    setPinMsg(null);
    try {
      const r = await api<Result>("/api/instructor/withdrawals", { body: { bankAccountId: accountId, amountKobo, pin } });
      setResult(r);
      if (r.status === "FAILED") {
        setError(`The transfer failed: ${r.failureReason ?? "the bank rejected it"}. The funds are back in your available balance.`);
        setStep("form");
      } else {
        setSuccess(true);
      }
      onDone();
    } catch (err) {
      if (err instanceof ApiClientError && err.code === "WRONG_PIN") setPinMsg({ text: err.message, error: true });
      else if (err instanceof ApiClientError && err.code === "PIN_LOCKED") {
        setLocked(true);
        setPinMsg({ text: err.message, error: true });
      } else setPinMsg({ text: err instanceof ApiClientError ? err.message : "Couldn’t complete the withdrawal.", error: true });
      setPin("");
    } finally {
      setBusy(false);
    }
  }

  async function primary() {
    setError(null);
    if (step === "form") return setStep("review");
    if (step === "review") return setStep("pin");
    if (step === "pin") return submitPin();
    if (step === "receipt") {
      if (result) window.location.assign(`/api/instructor/transactions/by-ref/${encodeURIComponent(result.reference)}/receipt`);
      return;
    }
    if (step === "choose") {
      setBusy(true);
      await api(`/api/instructor/bank-accounts/${chooseSel}`, { method: "PATCH", body: { isDefault: true } }).catch(() => {});
      setAccounts((as) => as.map((a) => ({ ...a, isDefault: a.id === chooseSel })));
      setAccountId(chooseSel);
      setBusy(false);
      setStep("form");
      toast.show({ title: "Default account updated" });
      return;
    }
    if (step === "add") {
      setBusy(true);
      try {
        const r = await api<{ account: BankAccountView }>("/api/instructor/bank-accounts", { body: { accountNumber: add.accountNumber, bankCode: add.bankCode } });
        setAccounts((as) => [...as, r.account]);
        setChooseSel(r.account.id);
        setStep("choose");
        toast.show({ title: "Bank information saved successfully", body: "Your new bank account has been added. You can select it for withdrawals after 24 hours." });
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : "Couldn’t add the account.");
      } finally {
        setBusy(false);
      }
      return;
    }
    if (step === "resetAuth") {
      setBusy(true);
      try {
        await api("/api/instructor/verify-password", { body: { password: rsPw } });
        setStep("resetPin");
      } catch (err) {
        setRsErr(err instanceof ApiClientError ? err.message : "Incorrect password.");
      } finally {
        setBusy(false);
      }
      return;
    }
    if (step === "resetPin") {
      setBusy(true);
      try {
        await api("/api/instructor/pin", { method: "PUT", body: { password: rsPw, pin: np1, confirm: np2 } });
        setLocked(false);
        setPin("");
        setPinMsg({ text: "Transaction PIN Updated. Use your new PIN to continue.", error: false });
        setStep("pin");
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : "Couldn’t update your PIN.");
      } finally {
        setBusy(false);
      }
    }
  }

  async function removeAccount(id: string) {
    setBusy(true);
    try {
      await api(`/api/instructor/bank-accounts/${id}`, { method: "DELETE" });
      const rest = accounts.filter((a) => a.id !== id);
      setAccounts(rest);
      const def = rest.find((a) => a.isDefault)?.id ?? rest[0]?.id ?? "";
      if (accountId === id) setAccountId(def);
      setChooseSel(def);
      toast.show({ title: "Bank Account Removed" });
    } catch (err) {
      toast.show({ tone: "error", title: "Couldn’t remove the account", body: err instanceof ApiClientError ? err.message : undefined });
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  }

  const npMismatch = np2 !== "" && np1 !== np2;
  const prim: Record<Step, { label: string; ok: boolean }> = {
    form: { label: "Confirm", ok: formOk },
    review: { label: "Proceed", ok: true },
    pin: { label: busy ? "Processing…" : "Confirm Withdrawal", ok: /^\d{4}$/.test(pin) && !locked },
    receipt: { label: "Download Receipt", ok: !!result && result.status === "SUCCESSFUL" },
    choose: { label: "Save Default", ok: !!chooseSel && chooseSel !== accountId },
    add: { label: busy ? "Saving…" : "Save Bank Details", ok: isBankAccountComplete(add) },
    resetAuth: { label: busy ? "Verifying…" : "Continue", ok: !!rsPw },
    resetPin: { label: busy ? "Updating…" : "Update Transaction PIN", ok: /^\d{4}$/.test(np1) && np1 === np2 },
  };
  const secondary: Record<Step, [string, () => void]> = {
    form: ["Cancel", requestClose],
    review: ["Back", () => setStep("form")],
    pin: ["Back", () => setStep("review")],
    receipt: ["Return to Earnings", onClose],
    choose: ["Back", () => setStep("form")],
    add: ["Back", () => setStep("choose")],
    resetAuth: ["Back", () => setStep("pin")],
    resetPin: ["Back", () => setStep("resetAuth")],
  };

  if (success && result) {
    return (
      <Dialog open title="" onRequestClose={onClose} width={400}>
        <div className="-mt-6 flex flex-col items-center gap-2.5 text-center">
          <SuccessBadge size={56} />
          <h2 className="m-0 text-[17px] font-semibold">{result.status === "SUCCESSFUL" ? "Withdrawal Successful" : "Withdrawal Processing"}</h2>
          <p className="m-0 text-[13px] leading-normal text-ink-3">
            {result.status === "SUCCESSFUL"
              ? `You’ve successfully withdrawn ${formatNaira(result.amountKobo)} to ${result.bank}. Your funds are on the way, and you’ll receive a confirmation email shortly.`
              : result.status === "AWAITING_APPROVAL"
                ? `Withdrawals of this size are checked by our team before they’re sent. Your ${formatNaira(result.amountKobo)} is reserved, and we’ll notify you once it’s on its way to ${result.bank}.`
                : `Your ${formatNaira(result.amountKobo)} withdrawal to ${result.bank} is being processed. We’ll notify you when it completes.`}
          </p>
          <div className="mt-2 grid w-full grid-cols-2 gap-2.5">
            <Button variant="outline" size="md" className="h-10" onClick={onClose}>View transaction history</Button>
            <Button size="md" className="h-10" onClick={() => { setSuccess(false); setStep("receipt"); }}>View Receipt</Button>
          </div>
        </div>
      </Dialog>
    );
  }

  return (
    <>
      <SlideOver
        open
        title={HEADS[step][0]}
        description={HEADS[step][1]}
        onRequestClose={requestClose}
        footer={
          <>
            <Button variant="outline" onClick={secondary[step][1]} disabled={busy}>{secondary[step][0]}</Button>
            <Button disabled={!prim[step].ok} busy={busy} busyLabel={prim[step].label} onClick={primary}>{prim[step].label}</Button>
          </>
        }
      >
        {error && <p role="alert" className="m-0 rounded-control bg-danger-bg px-3 py-2 text-xs text-danger-text">{error}</p>}

        {step === "form" && (
          <>
            <span className="inline-flex h-[30px] items-center self-start rounded-full bg-info-tint px-3 text-xs font-semibold text-info-text">Available to Withdraw: {formatNaira(availableKobo)}</span>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="wd-bank" className="text-xs font-semibold">Bank</label>
              <select id="wd-bank" value={accountId} onChange={(e) => setAccountId(e.target.value)} className="h-[42px] rounded-control border border-line-input bg-surface px-2.5 text-[13px]">
                {accounts.length === 0 && <option value="">No saved account</option>}
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.bankName} (****{a.last4}){a.isDefault ? " · Default" : ""}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="wd-acct" className="text-xs font-semibold">Bank Account Number</label>
              <input id="wd-acct" readOnly value={account ? `******${account.last4} · ${account.accountName}` : ""} className="h-[42px] rounded-control border border-line bg-surface-2 px-3 text-[13px] text-ink-3" />
              {onHold && account?.usableFrom && <span className="text-xs text-warning-text">For your security, this new account can receive withdrawals from {new Date(account.usableFrom).toLocaleString("en-GB", { timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short" })}.</span>}
            </div>
            <Button variant="outline" size="md" className="h-10" onClick={() => { setChooseSel(accountId); setStep("choose"); }}>Change Bank Account</Button>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="wd-amt" className="text-xs font-semibold">Amount to Withdraw</label>
              <input id="wd-amt" inputMode="decimal" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))} aria-describedby="wd-hint" aria-invalid={!!amtErr || undefined} className={clsx("h-[42px] rounded-control border bg-surface px-3 text-[13px] outline-none focus:border-primary", amtErr ? "border-danger-light" : "border-line-input")} />
              <span id="wd-hint" className={clsx("self-end text-[11px]", amtErr ? "text-danger" : "text-muted")} role={amtErr ? "alert" : undefined}>{amtErr ?? `Minimum withdrawal is ${formatNaira(minKobo).replace(/\.00$/, "")}`}</span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK.map((v) => (
                  <button key={v} type="button" aria-pressed={amountKobo === v * 100} onClick={() => setAmount(String(v))} className={clsx("h-8 rounded-control border px-3 text-xs font-semibold", amountKobo === v * 100 ? "border-primary bg-primary text-white" : "border-primary bg-white text-primary")}>
                    {formatNaira(v * 100).replace(/\.00$/, "")}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === "review" && account && (
          <>
            <div className="flex flex-col items-center gap-1 py-1.5"><span className="text-xs text-ink-3">Withdrawal Amount</span><strong className="text-[28px] text-price">{formatNaira(amountKobo)}</strong></div>
            <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-[13px]">
              <dt className="text-ink-3">Receiving Bank</dt><dd className="m-0 text-right font-medium">{account.bankName}</dd>
              <dt className="text-ink-3">Account Number</dt><dd className="m-0 text-right font-medium">******{account.last4}</dd>
              <dt className="text-ink-3">Name</dt><dd className="m-0 text-right font-medium">{account.accountName}</dd>
              <dt className="text-ink-3">Transaction Amount</dt><dd className="m-0 text-right font-medium">{formatNaira(amountKobo)}</dd>
              <dt className="text-ink-3">Charge</dt><dd className="m-0 text-right font-medium">{formatNaira(feeKobo).replace(/\.00$/, "")}</dd>
              <dt className="border-t border-line pt-3 font-semibold">Total Debit</dt><dd className="m-0 border-t border-line pt-3 text-right font-bold">{formatNaira(amountKobo + feeKobo)}</dd>
            </dl>
          </>
        )}

        {step === "pin" && (
          <div className="flex flex-col items-center gap-2.5 pt-3">
            <PinInput label="Transaction PIN" value={pin} onChange={setPin} error={!!pinMsg?.error} message={pinMsg?.text} />
            <button type="button" onClick={() => { setRsPw(""); setRsErr(null); setStep("resetAuth"); }} className="h-[30px] border-0 bg-transparent text-xs font-semibold text-primary underline">Forgot Pin?</button>
          </div>
        )}

        {step === "receipt" && result && (
          <>
            <div className="flex flex-col items-center gap-1 py-1.5"><span className="text-xs text-ink-3">Withdrawal Completed</span><strong className="text-[28px] text-price">{formatNaira(result.amountKobo)}</strong></div>
            <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-[13px]">
              <dt className="text-ink-3">Transaction Type</dt><dd className="m-0 text-right font-medium">Withdrawal</dd>
              <dt className="text-ink-3">Receiving Bank</dt><dd className="m-0 text-right font-medium">{result.bank}</dd>
              <dt className="text-ink-3">Charge</dt><dd className="m-0 text-right font-medium">{formatNaira(result.feeKobo)}</dd>
              <dt className="text-ink-3">Reference ID</dt><dd className="m-0 text-right font-medium">{result.reference}</dd>
              <dt className="text-ink-3">Status</dt><dd className="m-0 text-right"><StatusBadge status={result.status === "SUCCESSFUL" ? "Successful" : result.status === "FAILED" ? "Failed" : "Pending"} /></dd>
            </dl>
            <div className="rounded-control bg-surface px-3 py-2.5 text-xs text-ink-2"><strong className="block">Notes</strong>{result.status === "SUCCESSFUL" ? "Payment processed to bank account." : "We’ll update this once the bank confirms the transfer."}</div>
          </>
        )}

        {step === "choose" && (
          <div className="flex flex-col gap-2">
            {accounts.length === 0 && <p className="m-0 text-[13px] text-ink-3">No saved accounts. Add one to withdraw.</p>}
            {accounts.map((a) => (
              <label key={a.id} className={clsx("flex cursor-pointer items-center gap-3 rounded-[10px] border px-3 py-3", chooseSel === a.id ? "border-primary bg-info-tint-2" : "border-line")}>
                <input type="radio" name="acct" checked={chooseSel === a.id} onChange={() => setChooseSel(a.id)} className="accent-primary" />
                <span className="flex flex-1 flex-col gap-0.5"><span className="text-[13px] font-semibold">{a.bankName} (****{a.last4})</span><span className="text-xs text-ink-3">{a.accountName}{a.usableFrom ? " · available after 24 h" : ""}</span></span>
                {a.isDefault && <span className="rounded-full bg-info-tint px-2 py-0.5 text-[11px] font-semibold text-info-text">Default</span>}
                <button type="button" aria-label={`Remove ${a.bankName} account`} onClick={(e) => { e.preventDefault(); setConfirm({ kind: "remove", id: a.id }); }} className="border-0 bg-transparent text-xs font-semibold text-danger">Remove</button>
              </label>
            ))}
            <Button variant="outline" size="md" className="h-10" onClick={() => { setAdd({ accountNumber: "", bankCode: "", accountName: null }); setStep("add"); }}>Add a New Bank Account</Button>
          </div>
        )}

        {step === "add" && <BankAccountForm banks={banks} value={add} onChange={setAdd} resolver={bankResolver} />}

        {step === "resetAuth" && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="rs-pw" className="text-xs font-semibold">Enter your account password</label>
            <PasswordInput id="rs-pw" data-autofocus value={rsPw} onChange={(e) => { setRsPw(e.target.value); setRsErr(null); }} invalid={!!rsErr} />
            {rsErr && <FieldMessage tone="error">{rsErr}</FieldMessage>}
          </div>
        )}

        {step === "resetPin" && (
          <div className="flex flex-col items-center gap-4 pt-2">
            <PinInput label="New 4-digit PIN" value={np1} onChange={setNp1} size="md" toggleLabels={["Show PINs", "Hide PINs"]} />
            <PinInput label="Confirm New PIN" value={np2} onChange={setNp2} size="md" error={npMismatch} message={npMismatch ? "PINs do not match." : undefined} />
          </div>
        )}
      </SlideOver>

      <ConfirmDialog
        open={confirm?.kind === "cancel"}
        title="Cancel Withdraw?"
        body="You’re about to exit this transaction. Do you want to cancel the withdrawal?"
        confirmLabel="Yes, Cancel"
        cancelLabel="No, Continue"
        tone="danger"
        onDismiss={() => setConfirm(null)}
        onCancel={() => setConfirm(null)}
        onConfirm={() => { setConfirm(null); onClose(); }}
      />
      <ConfirmDialog
        open={confirm?.kind === "remove"}
        title="Are you sure you want to remove this account?"
        body={confirm?.kind === "remove" && confirm.id === accountId ? "This account is currently selected for withdrawal." : "You can add it again at any time."}
        confirmLabel="Remove"
        tone="danger"
        busy={busy}
        busyLabel="Removing…"
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm?.kind === "remove" && removeAccount(confirm.id)}
      />
    </>
  );
}
