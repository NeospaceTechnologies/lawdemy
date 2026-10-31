"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import type { Bank } from "@/components/ui/BankAccountForm";
import { Button, buttonClass } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { ChevronDownIcon, CloseIcon, FilterIcon, PlusIcon, SearchIcon } from "@/components/ui/icons";
import { SlideOver } from "@/components/ui/SlideOver";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import type { BankAccountView } from "@/lib/banking";
import type { TxView } from "@/lib/earnings";
import { formatNaira } from "@/lib/format";
import { BankSetupPanel } from "./BankSetupPanel";
import { WithdrawPanel } from "./WithdrawPanel";

const FAQ: [string, string][] = [
  ["What does “Available to Withdraw” mean?", "This is the amount you can withdraw immediately. It includes cleared earnings from your enrolments."],
  ["What does “Pending Earnings” mean?", "These are funds from course enrolments that are still in the holding period. They’ll move to Available to Withdraw once cleared."],
  ["What does “Last Withdrawal” mean?", "This shows the most recent withdrawal to your bank account, including the date and amount."],
];
const dateLabel = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Africa/Lagos" });

export type EarningsData = {
  totalKobo: number;
  availableKobo: number;
  pendingKobo: number;
  lastWithdrawal: { amountKobo: number; at: string } | null;
  accounts: BankAccountView[];
  hasPin: boolean;
  banks: Bank[];
  txs: TxView[];
  feeKobo: number;
  minKobo: number;
  email: string;
};

/** Earnings page (Inst-Earnings.dc.html, INS-PAY-01..05). */
export function EarningsView({ d, openWithdraw }: { d: EarningsData; openWithdraw?: { amountKobo?: number; accountId?: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<"new" | "old" | "high" | "az">("new");
  const [filters, setFilters] = useState<{ type?: string; status?: string }>({});
  const [draft, setDraft] = useState<{ type?: string; status?: string } | null>(null);
  const [explain, setExplain] = useState(false);
  const [faqOpen, setFaqOpen] = useState(0);
  const [tx, setTx] = useState<TxView | null>(null);
  const [bank, setBank] = useState<null | "add" | "edit">(null);
  const [withdraw, setWithdraw] = useState<{ amountKobo?: number; accountId?: string } | null>(openWithdraw ?? null);
  const hasBank = d.accounts.length > 0;

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = d.txs.filter((t) => {
      if (needle && !`${t.course} ${t.learner} ${t.ref}`.toLowerCase().includes(needle)) return false;
      const day = t.date.slice(0, 10);
      if (from && day < from) return false;
      if (to && day > to) return false;
      if (filters.type && filters.type !== "All" && t.type !== filters.type) return false;
      if (filters.status && filters.status !== "All" && t.status !== filters.status) return false;
      return true;
    });
    if (sort === "old") out = [...out].reverse();
    if (sort === "high") out = [...out].sort((a, b) => b.amountKobo - a.amountKobo);
    if (sort === "az") out = [...out].sort((a, b) => a.course.localeCompare(b.course));
    return out;
  }, [d.txs, q, from, to, filters, sort]);
  const chips = (["type", "status"] as const).filter((k) => filters[k] && filters[k] !== "All");

  const summary = [
    ["Available to Withdraw", formatNaira(d.availableKobo), "#17B26A"],
    ["Pending Earnings", formatNaira(d.pendingKobo), "#F79009"],
    ["Last Withdrawal", d.lastWithdrawal ? `${formatNaira(d.lastWithdrawal.amountKobo)} · ${dateLabel(d.lastWithdrawal.at)}` : "—", "#7F56D9"],
  ];
  const sel = "h-9 rounded-control border border-line-input bg-white px-2 text-[13px]";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-[28px] font-bold">Earnings</h1>
          <p className="m-0 text-sm text-ink-3">Track your earnings, request payouts, and manage your withdrawal settings.</p>
        </div>
        {hasBank ? (
          <div className="flex gap-2">
            <Button variant="outline" size="md" onClick={() => setBank("edit")}>Edit Bank Details</Button>
            <Button size="md" onClick={() => setWithdraw({})}>Withdraw Earnings</Button>
          </div>
        ) : (
          <Button size="md" onClick={() => setBank("add")}><PlusIcon size={14} />Add your Bank Info</Button>
        )}
      </div>

      <section aria-label="Earnings summary" className="overflow-hidden rounded-card border border-line">
        <div className="flex flex-col gap-3.5 px-[18px] py-4">
          <div className="flex items-center justify-between"><span className="text-sm font-semibold">Total Earnings</span><strong className="text-[22px] tabular-nums">{formatNaira(d.totalKobo)}</strong></div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
            {summary.map(([label, value, color]) => (
              <div key={label} className="flex flex-col gap-1.5">
                <span className="flex justify-between gap-2 text-xs text-ink-3">{label}<strong className="text-ink tabular-nums">{value}</strong></span>
                <span className="h-2 rounded" style={{ background: color }} />
              </div>
            ))}
          </div>
        </div>
        <button type="button" onClick={() => setExplain(true)} className="flex h-10 w-full items-center justify-between border-0 bg-info px-[18px] text-[13px] font-semibold text-white">What do these mean? <ChevronDownIcon size={14} className="-rotate-90" /></button>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="m-0 text-lg font-semibold">Transaction History</h2>
        {d.txs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-line-input px-6 py-10 text-center">
            <strong className="text-base">No Transactions yet</strong>
            <p className="m-0 max-w-[460px] text-[13px] text-ink-3">Once learners enrol in your paid courses, your earnings and transactions will be displayed here.</p>
            <Link href="/instructor/courses/new" className={buttonClass("primary", "md", "mt-2")}>Create Your First Course</Link>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <label className="flex h-[38px] w-[300px] max-w-full items-center gap-2 rounded-control border border-line-input px-3">
                <SearchIcon className="text-muted" />
                <input type="search" aria-label="Search transactions" placeholder="Search courses, learner or reference ID" value={q} onChange={(e) => setQ(e.target.value)} className="min-w-0 flex-1 border-0 bg-transparent text-[13px] outline-none" />
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-ink-3">From <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={sel} /></label>
                <label className="flex items-center gap-1.5 text-xs text-ink-3">To <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={sel} /></label>
                <label className="flex items-center gap-1.5 text-xs text-ink-3">Sort
                  <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className={sel}><option value="new">Newest First</option><option value="old">Oldest First</option><option value="high">Highest Amount</option><option value="az">Course Title (A–Z)</option></select>
                </label>
                <Button variant="outline" size="sm" onClick={() => setDraft({ ...filters })}><FilterIcon />Filter</Button>
              </div>
            </div>
            {chips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-ink-3">Showing {rows.length} results for</span>
                {chips.map((k) => (
                  <span key={k} className="inline-flex h-7 items-center gap-1 rounded-md border border-line-input pr-1 pl-2.5 text-ink-2">
                    {filters[k]}
                    <button type="button" aria-label={`Remove filter ${filters[k]}`} onClick={() => setFilters({ ...filters, [k]: undefined })} className="flex h-5 w-5 items-center justify-center border-0 bg-transparent text-ink-3"><CloseIcon size={9} /></button>
                  </span>
                ))}
                <button type="button" onClick={() => setFilters({})} className="border-0 bg-transparent font-semibold text-primary">Clear all</button>
              </div>
            )}
            <div className="overflow-x-auto rounded-card border border-line">
              <table className="w-full min-w-[920px] border-collapse text-[13px]">
                <thead>
                  <tr className="bg-surface text-left text-xs text-ink-3">
                    {["ID", "Course / Description", "Learner"].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}
                    <th scope="col" className="px-4 py-3 text-right font-medium">Amount (₦)</th>
                    {["Type", "Status", "Date"].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}
                    <th scope="col" className="px-4 py-3"><span className="sr-only">Details</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.id} className="border-t border-line">
                      <td className="px-4 py-3 text-xs whitespace-nowrap text-ink-3">{t.ref}</td>
                      <td className="px-4 py-3">{t.course}</td>
                      <td className="px-4 py-3 text-ink-3">{t.learner}</td>
                      <td className={clsx("px-4 py-3 text-right whitespace-nowrap tabular-nums", t.type === "Withdrawal" || t.type === "Refund" ? "text-ink-2" : "text-success")}>{t.type === "Withdrawal" || t.type === "Refund" ? "−" : "+"}{formatNaira(t.amountKobo).replace("₦", "")}</td>
                      <td className="px-4 py-3 text-ink-3">{t.type}</td>
                      <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                      <td className="px-4 py-3 whitespace-nowrap text-ink-3">{dateLabel(t.date)}</td>
                      <td className="px-4 py-3 text-right"><button type="button" onClick={() => setTx(t)} className="border-0 bg-transparent font-semibold text-primary">View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 && (
                <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                  <strong className="text-[15px]">No Transactions Found</strong>
                  <p className="m-0 text-[13px] text-ink-3">Looks like there’s nothing matching your search or filters.</p>
                  <Button variant="outline" size="sm" className="mt-1" onClick={() => { setQ(""); setFrom(""); setTo(""); setFilters({}); }}>Clear search &amp; filters</Button>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      <Dialog open={explain} title="Understanding Earnings Statuses" description="Everything you need to know about your earnings, explained simply." onRequestClose={() => setExplain(false)} width={500}>
        {FAQ.map(([qq, a], i) => (
          <div key={qq} className="border-b border-line last:border-b-0">
            <button type="button" aria-expanded={faqOpen === i} onClick={() => setFaqOpen(faqOpen === i ? -1 : i)} className="flex w-full items-center justify-between gap-2 border-0 bg-transparent py-3 text-left text-sm font-medium">{qq}<ChevronDownIcon size={14} className={clsx("text-ink-3 transition-transform", faqOpen === i && "rotate-180")} /></button>
            {faqOpen === i && <p className="m-0 pb-3 text-[13px] leading-normal text-ink-3">{a}</p>}
          </div>
        ))}
      </Dialog>

      <Dialog open={!!draft} title="Filter transactions" onRequestClose={() => setDraft(null)}>
        {draft && (
          <>
            <label className="flex flex-col gap-1.5 text-xs font-semibold">Type
              <select value={draft.type ?? ""} onChange={(e) => setDraft({ ...draft, type: e.target.value || undefined })} className="h-10 rounded-control border border-line-input bg-surface px-2.5 text-[13px] font-normal">
                <option value="">Please select</option>{["All", "Enrollment", "Promotional Bonus", "Withdrawal"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold">Status
              <select value={draft.status ?? ""} onChange={(e) => setDraft({ ...draft, status: e.target.value || undefined })} className="h-10 rounded-control border border-line-input bg-surface px-2.5 text-[13px] font-normal">
                <option value="">Please select</option>{["All", "Successful", "Pending", "Failed"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <Button variant="outline" size="md" className="h-10" onClick={() => setDraft(null)}>Cancel</Button>
              <Button size="md" className="h-10" disabled={!draft.type && !draft.status} onClick={() => { setFilters(draft); setDraft(null); }}>Apply</Button>
            </div>
          </>
        )}
      </Dialog>

      <SlideOver
        open={!!tx}
        title="Transaction Details"
        onRequestClose={() => setTx(null)}
        headerAction={tx && tx.type === "Withdrawal" && tx.status === "Failed" ? <Button variant="outline" size="sm" onClick={() => { setTx(null); setBank("edit"); }}>Edit Bank Info</Button> : undefined}
        footer={
          tx ? (
            tx.type === "Withdrawal" && tx.status === "Failed" ? (
              <>
                <Button variant="outline" onClick={() => setTx(null)}>Cancel</Button>
                <Button onClick={() => { setWithdraw({ amountKobo: tx.withdrawal?.amountKobo, accountId: tx.withdrawal?.bankAccountId }); setTx(null); }}>Retry Withdrawal</Button>
              </>
            ) : (tx.type === "Withdrawal" && tx.status === "Successful") || tx.type === "Promotional Bonus" ? (
              <>
                <Button variant="outline" onClick={() => setTx(null)}>Cancel</Button>
                <a href={`/api/instructor/transactions/${tx.id}/receipt`} onClick={() => toast.show({ title: "Receipt downloaded", body: "Your transaction receipt has been saved as a PDF." })} className={buttonClass("primary", "lg")}>Download Receipt</a>
              </>
            ) : (
              <>
                <span />
                <Button onClick={() => setTx(null)}>Close</Button>
              </>
            )
          ) : undefined
        }
      >
        {tx && (
          <>
            {tx.status === "Successful" && (
              <div className="flex flex-col items-center gap-1 py-2">
                <span className="text-xs text-ink-3">{tx.type === "Withdrawal" ? "Withdrawal Completed" : tx.type === "Promotional Bonus" ? "Bonus Credited" : "New Purchase"}</span>
                <strong className="text-[28px] text-price">{formatNaira(tx.amountKobo)}</strong>
              </div>
            )}
            <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-[13px]">
              {(tx.type === "Withdrawal"
                ? [["Transaction Type", "Withdrawal"], ["Amount", formatNaira(tx.amountKobo)], ["Charge", formatNaira(tx.withdrawal?.feeKobo ?? 0)], ["Date", new Date(tx.date).toLocaleString("en-GB", { timeZone: "Africa/Lagos" })], ["Reference ID", tx.ref], ["Receiving Bank", tx.bank ?? "—"]]
                : tx.type === "Promotional Bonus"
                  ? [["Transaction Type", "Promotional Bonus"], ["Description", tx.course], ["Date", new Date(tx.date).toLocaleString("en-GB", { timeZone: "Africa/Lagos" })], ["Reference ID", tx.ref]]
                  : [["Course Title", tx.course], ["Transaction Type", tx.type], ["Learner", tx.learner], ["Amount", formatNaira(tx.amountKobo)], ["Date", new Date(tx.date).toLocaleString("en-GB", { timeZone: "Africa/Lagos" })], ["Reference ID", tx.ref]]
              ).map(([k, v]) => (
                <div key={k} className="contents"><dt className="text-ink-3">{k}</dt><dd className="m-0 text-right font-medium">{v}</dd></div>
              ))}
              <dt className="text-ink-3">Status</dt><dd className="m-0 text-right"><StatusBadge status={tx.status} /></dd>
            </dl>
            <div className="rounded-control bg-surface px-3 py-2.5 text-xs text-ink-2">
              <strong className="block">Notes</strong>
              {tx.type === "Withdrawal"
                ? tx.status === "Successful" ? "Payment processed to bank account." : tx.status === "Failed" ? `Bank rejected transaction${tx.failureReason ? ` (${tx.failureReason})` : ""}. Please verify your account details. The funds are back in your available balance.` : "The transfer is being processed."
                : tx.type === "Promotional Bonus" ? "Credited to Available Earnings immediately."
                : tx.status === "Pending" ? "Earnings from this enrolment are in the holding period and will move to Available to Withdraw once cleared." : `Learner enrolled in ${tx.course}.`}
            </div>
          </>
        )}
      </SlideOver>

      {bank && (
        <BankSetupPanel
          mode={bank}
          banks={d.banks}
          hasPin={d.hasPin}
          email={d.email}
          onClose={() => setBank(null)}
          onSaved={(msg) => {
            if (msg) toast.show(msg);
            router.refresh();
          }}
        />
      )}
      {withdraw && (
        <WithdrawPanel
          availableKobo={d.availableKobo}
          feeKobo={d.feeKobo}
          minKobo={d.minKobo}
          accounts={d.accounts}
          banks={d.banks}
          initialAmount={withdraw.amountKobo}
          initialAccountId={withdraw.accountId}
          onClose={() => { setWithdraw(null); router.refresh(); }}
          onDone={() => router.refresh()}
        />
      )}
    </>
  );
}
