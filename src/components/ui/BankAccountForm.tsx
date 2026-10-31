"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Select, TextInput } from "./Field";

export type Bank = { code: string; name: string };
export type BankAccountValue = { accountNumber: string; bankCode: string; accountName: string | null };

export type BankResolver = {
  /** Suggest the bank for a 10-digit NUBAN (provider account-resolve API). */
  suggestBank: (accountNumber: string, signal: AbortSignal) => Promise<Bank | null>;
  /** Verify the holder name for account + bank. Returns null if it can't be verified. */
  verifyName: (accountNumber: string, bankCode: string, signal: AbortSignal) => Promise<string | null>;
};

/**
 * Bank account entry with bank match and name verification (Inst-Withdraw "Add
 * Bank Account", Inst-Earnings bank setup). The parent's Continue button should
 * stay disabled until `isBankAccountComplete(value)`.
 */
export function BankAccountForm({
  banks,
  value,
  onChange,
  resolver,
}: {
  banks: Bank[];
  value: BankAccountValue;
  onChange: (v: BankAccountValue) => void;
  resolver: BankResolver;
}) {
  const id = useId();
  const [matching, setMatching] = useState(false);
  const [suggestion, setSuggestion] = useState<Bank | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  // Match a bank once 10 digits are entered.
  useEffect(() => {
    setSuggestion(null);
    if (!/^\d{10}$/.test(value.accountNumber) || value.bankCode) return;
    const ctrl = new AbortController();
    setMatching(true);
    resolver
      .suggestBank(value.accountNumber, ctrl.signal)
      .then((b) => !ctrl.signal.aborted && setSuggestion(b))
      .catch(() => {})
      .finally(() => !ctrl.signal.aborted && setMatching(false));
    return () => ctrl.abort();
  }, [value.accountNumber, value.bankCode, resolver]);

  // Verify the account name once account + bank are both set.
  useEffect(() => {
    setVerifyError(null);
    if (!/^\d{10}$/.test(value.accountNumber) || !value.bankCode || value.accountName) return;
    const ctrl = new AbortController();
    setVerifying(true);
    resolver
      .verifyName(value.accountNumber, value.bankCode, ctrl.signal)
      .then((name) => {
        if (ctrl.signal.aborted) return;
        if (name) onChange({ ...valueRef.current, accountName: name });
        else setVerifyError("We couldn't verify this account. Check the number and bank.");
      })
      .catch(() => !ctrl.signal.aborted && setVerifyError("Verification failed. Please try again."))
      .finally(() => !ctrl.signal.aborted && setVerifying(false));
    return () => ctrl.abort();
    // onChange identity is not a trigger; valueRef keeps the latest value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.accountNumber, value.bankCode, value.accountName, resolver]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-acct`} className="text-xs font-semibold">Bank Account Number</label>
        <TextInput
          id={`${id}-acct`}
          inputMode="numeric"
          maxLength={10}
          className="h-[42px] text-[13px]"
          placeholder="Enter 10-digit account number"
          value={value.accountNumber}
          onChange={(e) => onChange({ accountNumber: e.target.value.replace(/\D/g, "").slice(0, 10), bankCode: "", accountName: null })}
        />
        {matching && <span role="status" className="text-xs text-ink-3">Matching banks…</span>}
        {suggestion && !value.bankCode && (
          <div className="flex items-center gap-2 self-start rounded-full bg-accent py-1.5 pr-1.5 pl-3 text-xs font-semibold text-white">
            {suggestion.name}
            <button
              type="button"
              onClick={() => onChange({ ...value, bankCode: suggestion.code, accountName: null })}
              className="h-[26px] rounded-full bg-primary px-2.5 text-[11px] font-semibold text-white"
            >
              Select
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-bank`} className="text-xs font-semibold">Bank</label>
        <Select
          id={`${id}-bank`}
          className="h-[42px] text-[13px]"
          value={value.bankCode}
          onChange={(e) => onChange({ ...value, bankCode: e.target.value, accountName: null })}
        >
          <option value="">Select bank</option>
          {banks.map((b) => (
            <option key={b.code} value={b.code}>{b.name}</option>
          ))}
        </Select>
        {verifying && <span role="status" className="text-xs text-ink-3">Verifying name…</span>}
        {verifyError && <span role="alert" className="text-xs text-danger-text">{verifyError}</span>}
        {value.accountName && (
          <span className="inline-flex h-[30px] items-center self-start rounded-full bg-accent px-3 text-xs font-bold text-white uppercase">
            {value.accountName}
          </span>
        )}
      </div>
    </div>
  );
}

export function isBankAccountComplete(v: BankAccountValue) {
  return /^\d{10}$/.test(v.accountNumber) && !!v.bankCode && !!v.accountName;
}
