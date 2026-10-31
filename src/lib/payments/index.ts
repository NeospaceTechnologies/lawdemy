import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { appUrl } from "@/lib/email";

// Payment provider boundary (PRD 10). The provider is undecided (Flutterwave or
// Paystack, open question); "mock" lets the whole flow run locally. A real
// adapter implements the same interface with the provider's APIs.

export type Bank = { code: string; name: string };

export interface PaymentProvider {
  name: string;
  /** Hosted checkout. Returns the URL to send the learner to. */
  initialize(input: { reference: string; amountKobo: number; email: string; callbackUrl: string }): Promise<{ authorizationUrl: string; providerRef: string }>;
  /** Server-side check of a payment's status by our reference. */
  verify(reference: string): Promise<{ status: "paid" | "failed" | "pending"; amountKobo: number }>;
  /** Verifies a webhook signature; returns the parsed event or null. */
  parseWebhook(rawBody: string, signature: string | null): { event: "charge.success" | "charge.failed" | "transfer.success" | "transfer.failed"; reference: string } | null;
  listBanks(): Promise<Bank[]>;
  /** Suggest the bank for a 10-digit NUBAN (account-resolve API). */
  suggestBank(accountNumber: string): Promise<Bank | null>;
  /** Verified account holder name, or null. */
  resolveAccount(accountNumber: string, bankCode: string): Promise<string | null>;
  /** Start a transfer to a bank account. */
  transfer(input: { reference: string; amountKobo: number; bankCode: string; accountNumber: string; accountName: string }): Promise<{ status: "successful" | "pending" | "failed"; providerRef: string; failureReason?: string }>;
  /** Transfer status by our reference, for reconciliation (ADM-06). */
  transferStatus(reference: string): Promise<{ status: "successful" | "pending" | "failed" | "unknown"; amountKobo: number }>;
  /** Full or partial refund of a paid charge (ADM-07). */
  refund(input: { reference: string; amountKobo: number }): Promise<{ status: "processed" | "pending" | "failed"; providerRef: string; failureReason?: string }>;
}

const SECRET = process.env.PAYMENT_WEBHOOK_SECRET ?? "dev-webhook-secret";

export function sign(body: string) {
  return createHmac("sha512", SECRET).update(body).digest("hex");
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

const BANKS: Bank[] = [
  { code: "044", name: "Access Bank" },
  { code: "058", name: "GTBank Plc" },
  { code: "50211", name: "Kuda Microfinance Bank" },
  { code: "50515", name: "Moniepoint Microfinance Bank" },
  { code: "999991", name: "PalmPay" },
  { code: "057", name: "Zenith Bank" },
  { code: "011", name: "First Bank of Nigeria" },
  { code: "033", name: "United Bank for Africa" },
];

// In-memory payment state for the mock (single dev process). Kept on globalThis
// because Next.js can load this module separately for each route handler.
type MockPayment = { amountKobo: number; status: "paid" | "failed" | "pending" };
type MockTransfer = { amountKobo: number; status: "successful" | "failed" };
const g = globalThis as unknown as { __lawdemyMockPayments?: Map<string, MockPayment>; __lawdemyMockTransfers?: Map<string, MockTransfer> };
const mockPayments = (g.__lawdemyMockPayments ??= new Map<string, MockPayment>());
const mockTransfers = (g.__lawdemyMockTransfers ??= new Map<string, MockTransfer>());

const mock: PaymentProvider = {
  name: "mock",
  async initialize({ reference, amountKobo }) {
    mockPayments.set(reference, { amountKobo, status: "pending" });
    return { authorizationUrl: appUrl(`/api/payments/mock/pay?reference=${encodeURIComponent(reference)}`), providerRef: `MOCK-${randomBytes(6).toString("hex")}` };
  },
  async verify(reference) {
    const p = mockPayments.get(reference);
    return p ? { status: p.status, amountKobo: p.amountKobo } : { status: "pending", amountKobo: 0 };
  },
  parseWebhook(rawBody, signature) {
    if (!signature || !safeEqual(sign(rawBody), signature)) return null;
    try {
      const j = JSON.parse(rawBody);
      return { event: j.event, reference: j.data.reference };
    } catch {
      return null;
    }
  },
  async listBanks() {
    return BANKS;
  },
  async suggestBank(accountNumber) {
    if (!/^\d{10}$/.test(accountNumber)) return null;
    return BANKS[Number(accountNumber[9]) % BANKS.length];
  },
  async resolveAccount(accountNumber, bankCode) {
    // Mock: accounts ending in 0000 can't be verified.
    if (!/^\d{10}$/.test(accountNumber) || accountNumber.endsWith("0000") || !BANKS.some((b) => b.code === bankCode)) return null;
    return "VERIFIED ACCOUNT HOLDER";
  },
  async transfer({ reference, amountKobo, accountNumber }) {
    // Mock: accounts ending in 9 fail, so the failure path can be tested.
    if (accountNumber.endsWith("9")) {
      mockTransfers.set(reference, { amountKobo, status: "failed" });
      return { status: "failed", providerRef: `TRF-${reference}`, failureReason: "Beneficiary bank unavailable" };
    }
    mockTransfers.set(reference, { amountKobo, status: "successful" });
    return { status: "successful", providerRef: `TRF-${reference}` };
  },
  async transferStatus(reference) {
    // The mock forgets transfers when the dev server restarts; "unknown" is reported, not a mismatch.
    const t = mockTransfers.get(reference);
    return t ? { status: t.status, amountKobo: t.amountKobo } : { status: "unknown", amountKobo: 0 };
  },
  async refund({ reference, amountKobo }) {
    if (amountKobo <= 0) return { status: "failed", providerRef: "", failureReason: "Nothing to refund" };
    return { status: "processed", providerRef: `RFD-${reference}-${randomBytes(3).toString("hex")}` };
  },
};

/** Mock-only: mark a payment as completed, as the hosted page would. */
export function mockComplete(reference: string, status: "paid" | "failed") {
  const p = mockPayments.get(reference);
  if (p) p.status = status;
}

export function payments(): PaymentProvider {
  switch (process.env.PAYMENT_PROVIDER ?? "mock") {
    case "mock":
      return mock;
    default:
      throw new Error(`Unknown PAYMENT_PROVIDER "${process.env.PAYMENT_PROVIDER}"`);
  }
}

export function newReference(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
}
