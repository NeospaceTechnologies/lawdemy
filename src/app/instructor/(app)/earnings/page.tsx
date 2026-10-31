import type { Metadata } from "next";
import { InstructorTopbar } from "@/components/layout/InstructorTopbar";
import { EarningsView } from "@/features/earnings/EarningsView";
import { db } from "@/lib/db";
import { BUSINESS } from "@/lib/config";
import { requireInstructorPage } from "@/lib/auth/pages";
import { listAccounts } from "@/lib/banking";
import { listTransactions } from "@/lib/earnings";
import { payments } from "@/lib/payments";
import { balances } from "@/lib/wallet";

export const metadata: Metadata = { title: "Earnings" };

export default async function EarningsPage({ searchParams }: { searchParams: Promise<{ withdraw?: string }> }) {
  const { user } = await requireInstructorPage();
  const [b, accounts, txs, banks, pin, unread] = await Promise.all([
    balances(user.id),
    listAccounts(user.id),
    listTransactions(user.id),
    payments().listBanks(),
    db.transactionPin.findUnique({ where: { instructorId: user.id }, select: { instructorId: true } }),
    db.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);
  return (
    <>
      <InstructorTopbar unread={unread} />
      <EarningsView
        openWithdraw={(await searchParams).withdraw === "1" && accounts.length ? {} : undefined}
        d={{
          totalKobo: b.totalKobo,
          availableKobo: b.availableKobo,
          pendingKobo: b.pendingKobo,
          lastWithdrawal: b.lastWithdrawal ? { amountKobo: b.lastWithdrawal.amountKobo, at: b.lastWithdrawal.at.toISOString() } : null,
          accounts,
          hasPin: !!pin,
          banks,
          txs,
          feeKobo: BUSINESS.withdrawalFeeKobo,
          minKobo: BUSINESS.minWithdrawalKobo,
          email: user.email,
        }}
      />
    </>
  );
}
