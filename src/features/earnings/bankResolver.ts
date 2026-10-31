"use client";
import type { BankResolver } from "@/components/ui/BankAccountForm";
import { api } from "@/lib/api-client";

/** BankAccountForm resolver backed by the provider's account-resolve API. */
export const bankResolver: BankResolver = {
  async suggestBank(accountNumber, signal) {
    const r = await api<{ suggestion: { code: string; name: string } | null }>("/api/instructor/banks/resolve", { body: { accountNumber }, signal });
    return r.suggestion;
  },
  async verifyName(accountNumber, bankCode, signal) {
    const r = await api<{ accountName: string | null }>("/api/instructor/banks/resolve", { body: { accountNumber, bankCode }, signal });
    return r.accountName;
  },
};
