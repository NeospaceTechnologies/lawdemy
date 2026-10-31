import "server-only";
import { db } from "@/lib/db";

export type TxView = {
  id: string;
  ref: string;
  course: string;
  learner: string;
  amountKobo: number;
  type: "Enrollment" | "Promotional Bonus" | "Withdrawal" | "Refund";
  status: "Successful" | "Pending" | "Failed";
  date: string;
  bank: string | null;
  failureReason: string | null;
  withdrawal: { amountKobo: number; feeKobo: number; bankAccountId: string } | null;
};

const TYPE = { ENROLLMENT: "Enrollment", BONUS: "Promotional Bonus", WITHDRAWAL: "Withdrawal", REFUND: "Refund" } as const;
const STATUS = { PENDING: "Pending", AVAILABLE: "Successful", SUCCESSFUL: "Successful", FAILED: "Failed" } as const;

export async function listTransactions(instructorId: string): Promise<TxView[]> {
  const rows = await db.walletTransaction.findMany({
    where: { instructorId },
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      orderItem: { select: { course: { select: { title: true } }, order: { select: { learner: { select: { firstName: true, lastName: true } } } } } },
      withdrawal: { include: { bankAccount: { select: { bankName: true, accountNumberLast4: true } } } },
    },
  });
  return rows.map((t) => ({
    id: t.id,
    ref: t.reference,
    course: t.orderItem?.course.title ?? t.notes ?? TYPE[t.type],
    learner: t.orderItem ? `${t.orderItem.order.learner.firstName} ${t.orderItem.order.learner.lastName}` : "—",
    amountKobo: t.withdrawal ? t.withdrawal.amountKobo : Math.abs(t.amountKobo),
    type: TYPE[t.type],
    status: STATUS[t.status],
    date: t.createdAt.toISOString(),
    bank: t.withdrawal ? `${t.withdrawal.bankAccount.bankName} (****${t.withdrawal.bankAccount.accountNumberLast4})` : null,
    failureReason: t.withdrawal?.failureReason ?? null,
    withdrawal: t.withdrawal ? { amountKobo: t.withdrawal.amountKobo, feeKobo: t.withdrawal.feeKobo, bankAccountId: t.withdrawal.bankAccountId } : null,
  }));
}
