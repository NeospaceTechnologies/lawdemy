import "server-only";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { mailer } from "@/lib/email";
import { formatNaira } from "@/lib/format";
import { notify } from "@/lib/notify";
import { newReference, payments } from "@/lib/payments";
import { balances, settleWithdrawal } from "@/lib/wallet";
import { sendTransfer } from "@/lib/withdrawals";
import { destroyAllSessions } from "@/lib/auth/session";

// Staff operations behind the console (PRD 11). Every change is audited with the staff actor.

type Result = { ok: true } | { ok: false; error: string };
const okR: Result = { ok: true };
const no = (error: string): Result => ({ ok: false, error });

// ---- ADM-03 Live course takedown ------------------------------------------------

export async function takeDownCourse(staffId: string, courseId: string, reason: string, revokeAccess: boolean): Promise<Result> {
  const c = await db.course.findFirst({ where: { id: courseId, deletedAt: null }, include: { instructor: { select: { email: true, firstName: true } } } });
  if (!c) return no("Course not found.");
  if (c.status !== "LIVE") return no("Only Live courses can be taken down.");
  await db.$transaction(async (tx) => {
    await tx.course.update({ where: { id: c.id }, data: { status: "ARCHIVED", archivedAt: new Date(), takenDownAt: new Date(), takedownReason: reason, takedownRevokes: revokeAccess } });
    await audit({ actorId: staffId, action: "course_taken_down", targetType: "course", targetId: c.id, before: { status: c.status }, after: { status: "ARCHIVED", reason, revokeAccess } }, tx);
    await notify(c.instructorId, { type: "review_rejected", title: "Course unpublished by Lawdemy", body: `“${c.title}” was unpublished: ${reason}`, link: `/instructor/courses/${c.id}` }, tx);
  });
  await mailer().send({
    to: c.instructor.email,
    subject: `“${c.title}” has been unpublished`,
    text: `Hi ${c.instructor.firstName},\n\nLawdemy unpublished your course “${c.title}”.\n\nReason: ${reason}\n\n${revokeAccess ? "Enrolled learners no longer have access." : "Learners already enrolled keep their access."}\n\nReply to this email if you’d like to discuss it.`,
  });
  return okR;
}

export async function restoreCourse(staffId: string, courseId: string): Promise<Result> {
  const c = await db.course.findFirst({ where: { id: courseId, deletedAt: null } });
  if (!c?.takenDownAt) return no("This course wasn’t taken down by staff.");
  await db.$transaction(async (tx) => {
    await tx.course.update({ where: { id: c.id }, data: { status: "LIVE", archivedAt: null, takenDownAt: null, takedownReason: null, takedownRevokes: false } });
    await audit({ actorId: staffId, action: "course_takedown_lifted", targetType: "course", targetId: c.id, before: { reason: c.takedownReason }, after: { status: "LIVE" } }, tx);
    await notify(c.instructorId, { type: "review_approved", title: "Course restored", body: `“${c.title}” is live again.`, link: `/instructor/courses/${c.id}` }, tx);
  });
  return okR;
}

// ---- ADM-04 Report moderation ------------------------------------------------------

export const REPORT_TARGETS = ["question", "question_reply", "post", "post_reply"] as const;
export type ReportTarget = (typeof REPORT_TARGETS)[number];
export type ModerationAction = "dismiss" | "hide" | "warn" | "suspend";

export async function reportedContent(type: ReportTarget, id: string) {
  if (type === "question") {
    const q = await db.question.findUnique({ where: { id }, include: { author: true } });
    return q && { authorId: q.authorId, author: q.author, title: q.title, body: q.body, hidden: !!q.deletedAt, createdAt: q.createdAt };
  }
  if (type === "question_reply") {
    const r = await db.questionReply.findUnique({ where: { id }, include: { author: true } });
    return r && { authorId: r.authorId, author: r.author, title: null, body: r.body, hidden: !!r.deletedAt, createdAt: r.createdAt };
  }
  if (type === "post") {
    const p = await db.post.findUnique({ where: { id }, include: { author: true } });
    return p && { authorId: p.authorId, author: p.author, title: p.title, body: p.body, hidden: p.status === "hidden" || !!p.deletedAt, createdAt: p.createdAt };
  }
  const r = await db.postReply.findUnique({ where: { id }, include: { author: true } });
  return r && { authorId: r.authorId, author: r.author, title: null, body: r.body, hidden: !!r.deletedAt, createdAt: r.createdAt };
}

export async function moderate(staffId: string, type: ReportTarget, id: string, action: ModerationAction, note?: string): Promise<Result> {
  const content = await reportedContent(type, id);
  if (!content) return no("That content no longer exists.");
  const open = await db.report.count({ where: { targetType: type, targetId: id, status: "open" } });
  if (!open) return no("These reports have already been handled.");
  const now = new Date();
  await db.$transaction(async (tx) => {
    if (action === "hide" || action === "suspend") {
      if (type === "question") await tx.question.update({ where: { id }, data: { deletedAt: now } });
      if (type === "question_reply") await tx.questionReply.update({ where: { id }, data: { deletedAt: now } });
      if (type === "post") await tx.post.update({ where: { id }, data: { status: "hidden" } });
      if (type === "post_reply") await tx.postReply.update({ where: { id }, data: { deletedAt: now } });
    }
    if (action === "warn" || action === "hide") {
      // The reporter is never revealed to the author (ADM-04).
      await notify(content.authorId, {
        type: "moderation",
        title: action === "warn" ? "A note from the Lawdemy team" : "Your post was removed",
        body: note || (action === "warn" ? "One of your posts was reported. Please keep discussions respectful and on topic." : "One of your posts broke the community guidelines and has been removed."),
      }, tx);
    }
    if (action === "suspend") {
      await tx.user.update({ where: { id: content.authorId }, data: { status: "LOCKED" } });
    }
    await tx.report.updateMany({ where: { targetType: type, targetId: id, status: "open" }, data: { status: action === "dismiss" ? "dismissed" : "actioned", action, handledById: staffId, handledAt: now } });
    await audit({ actorId: staffId, action: `report_${action}`, targetType: type, targetId: id, after: { note: note ?? null, authorId: content.authorId } }, tx);
  });
  if (action === "suspend") await destroyAllSessions(content.authorId);
  return okR;
}

// ---- ADM-05 Payout monitoring ------------------------------------------------------

export async function approveWithdrawal(staffId: string, withdrawalId: string): Promise<Result> {
  const w = await db.withdrawal.findUnique({ where: { id: withdrawalId }, include: { instructor: { select: { walletFrozenAt: true } } } });
  if (!w || w.status !== "AWAITING_APPROVAL") return no("This withdrawal isn’t waiting for approval.");
  if (w.instructor.walletFrozenAt) return no("This wallet is frozen. Unfreeze it before approving.");
  const res = await db.withdrawal.updateMany({ where: { id: w.id, status: "AWAITING_APPROVAL" }, data: { status: "PENDING", approvedById: staffId, approvedAt: new Date() } });
  if (!res.count) return no("Someone else already handled this withdrawal.");
  await audit({ actorId: staffId, action: "withdrawal_approved", targetType: "withdrawal", targetId: w.id, after: { amountKobo: w.amountKobo } });
  await sendTransfer(w.id);
  return okR;
}

export async function rejectWithdrawal(staffId: string, withdrawalId: string, reason: string): Promise<Result> {
  const w = await db.withdrawal.findUnique({ where: { id: withdrawalId } });
  if (!w || w.status !== "AWAITING_APPROVAL") return no("Only withdrawals waiting for approval can be rejected.");
  await settleWithdrawal(w.reference, "failed", `Declined by Lawdemy: ${reason}`);
  await audit({ actorId: staffId, action: "withdrawal_rejected", targetType: "withdrawal", targetId: w.id, after: { reason } });
  return okR;
}

/** Re-sends a failed transfer: the funds are reserved again (if still available) and the transfer restarts. */
export async function retryWithdrawal(staffId: string, withdrawalId: string): Promise<Result> {
  const w = await db.withdrawal.findUnique({ where: { id: withdrawalId }, include: { bankAccount: true, instructor: { select: { walletFrozenAt: true } } } });
  if (!w || w.status !== "FAILED") return no("Only failed withdrawals can be retried.");
  if (w.bankAccount.deletedAt) return no("The instructor removed this bank account. Ask them to withdraw again.");
  if (w.instructor.walletFrozenAt) return no("This wallet is frozen. Unfreeze it before retrying.");
  const reserved = await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${w.instructorId}))`;
    const b = await balances(w.instructorId);
    if (w.amountKobo + w.feeKobo > b.availableKobo) return false;
    await tx.withdrawal.update({ where: { id: w.id }, data: { status: "PENDING", failureReason: null, completedAt: null, attempts: { increment: 1 } } });
    await tx.walletTransaction.updateMany({ where: { withdrawalId: w.id }, data: { status: "PENDING" } });
    await audit({ actorId: staffId, action: "withdrawal_retried", targetType: "withdrawal", targetId: w.id, after: { attempt: w.attempts + 1 } }, tx);
    return true;
  });
  if (!reserved) return no("The instructor’s available balance no longer covers this withdrawal.");
  await sendTransfer(w.id);
  return okR;
}

export async function setWalletFrozen(staffId: string, userId: string, frozen: boolean): Promise<Result> {
  const u = await db.user.findUnique({ where: { id: userId } });
  if (!u || u.role !== "INSTRUCTOR") return no("Only instructor wallets can be frozen.");
  await db.user.update({ where: { id: u.id }, data: { walletFrozenAt: frozen ? new Date() : null } });
  await audit({ actorId: staffId, action: frozen ? "wallet_frozen" : "wallet_unfrozen", targetType: "user", targetId: u.id });
  return okR;
}

// ---- ADM-07 Refunds ------------------------------------------------------------------

export async function refundOrderItem(staffId: string, itemId: string, amountKobo: number, revoke: boolean, reason: string): Promise<Result> {
  const item = await db.orderItem.findUnique({
    where: { id: itemId },
    include: { order: { include: { learner: { select: { id: true, email: true, firstName: true } } } }, course: { select: { id: true, title: true, instructorId: true } }, walletTransaction: true },
  });
  if (!item) return no("Order item not found.");
  if (item.order.status !== "PAID" && item.order.status !== "REFUNDED") return no("Only paid orders can be refunded.");
  const refundable = item.priceKobo - item.refundedKobo;
  if (amountKobo <= 0 || amountKobo > refundable) return no(`You can refund up to ${formatNaira(refundable)} on this item.`);

  const r = await payments().refund({ reference: item.order.reference, amountKobo });
  if (r.status === "failed") return no(`The payment provider declined the refund: ${r.failureReason ?? "unknown error"}.`);

  // Reverse the instructor's share in proportion to the refund.
  const shareKobo = Math.round((item.instructorShareKobo * amountKobo) / item.priceKobo);
  const earning = item.walletTransaction;
  await db.$transaction(async (tx) => {
    await tx.orderItem.update({ where: { id: item.id }, data: { refundedKobo: { increment: amountKobo }, refundedAt: new Date() } });
    const order = await tx.order.update({ where: { id: item.orderId }, data: { refundedKobo: { increment: amountKobo } } });
    if (order.refundedKobo >= order.totalKobo) await tx.order.update({ where: { id: order.id }, data: { status: "REFUNDED" } });
    if (shareKobo > 0) {
      const stillPending = earning?.status === "PENDING";
      await tx.walletTransaction.create({
        data: {
          instructorId: item.course.instructorId,
          type: "REFUND",
          amountKobo: -shareKobo,
          status: stillPending ? "PENDING" : "AVAILABLE",
          availableAt: stillPending ? earning?.availableAt : null,
          reference: newReference("RFD"),
          notes: `Refund: ${item.course.title}`,
        },
      });
    }
    if (revoke) {
      const enr = await tx.enrollment.findUnique({ where: { courseId_learnerId: { courseId: item.courseId, learnerId: item.order.learnerId } }, select: { id: true } });
      if (enr) {
        await tx.certificate.deleteMany({ where: { enrollmentId: enr.id } });
        await tx.enrollment.delete({ where: { id: enr.id } });
      }
    }
    await audit({ actorId: staffId, action: "order_refunded", targetType: "order_item", targetId: item.id, after: { amountKobo, shareKobo, revoke, reason, providerRef: r.providerRef } }, tx);
    await notify(item.order.learnerId, { type: "purchase", title: "Refund issued", body: `${formatNaira(amountKobo)} for “${item.course.title}” is on its way back to you.` }, tx);
  });
  await mailer().send({
    to: item.order.learner.email,
    subject: `Your refund for “${item.course.title}”`,
    text: `Hi ${item.order.learner.firstName},\n\nWe’ve refunded ${formatNaira(amountKobo)} for “${item.course.title}” (order ${item.order.reference}). It can take 5–10 working days to reach your account.${revoke ? "\n\nYour access to this course has ended." : ""}`,
  });
  return okR;
}

// ---- ADM-09 User lookup actions --------------------------------------------------------

export type UserAction = "unlock_signin" | "reset_pin_lock" | "deactivate" | "reactivate" | "reset_2fa";

export async function userAction(staffId: string, userId: string, action: UserAction): Promise<Result> {
  const u = await db.user.findUnique({ where: { id: userId } });
  if (!u || u.deletedAt) return no("User not found.");
  if (action === "unlock_signin") {
    await db.loginAttempt.deleteMany({ where: { email: u.email, role: u.role, success: false } });
  } else if (action === "reset_pin_lock") {
    if (u.role !== "INSTRUCTOR") return no("Only instructors have a transaction PIN.");
    await db.transactionPin.updateMany({ where: { instructorId: u.id }, data: { failedAttempts: 0, lockedUntil: null } });
  } else if (action === "deactivate") {
    if (u.id === staffId) return no("You can’t deactivate your own account.");
    await db.user.update({ where: { id: u.id }, data: { status: "LOCKED" } });
    await destroyAllSessions(u.id);
  } else if (action === "reactivate") {
    await db.user.update({ where: { id: u.id }, data: { status: "ACTIVE" } });
  } else if (action === "reset_2fa") {
    if (u.role !== "ADMIN") return no("Only staff accounts use 2FA.");
    if (u.id === staffId) return no("Ask another staff member to reset your 2FA.");
    await db.user.update({ where: { id: u.id }, data: { totpSecretEnc: null, totpEnabledAt: null } });
    await destroyAllSessions(u.id);
  }
  await audit({ actorId: staffId, action: `user_${action}`, targetType: "user", targetId: u.id });
  return okR;
}

// ---- ADM-10 Bonuses -----------------------------------------------------------------------

export async function creditBonus(staffId: string, instructorId: string, amountKobo: number, description: string): Promise<Result> {
  const u = await db.user.findUnique({ where: { id: instructorId } });
  if (!u || u.role !== "INSTRUCTOR" || u.deletedAt) return no("Choose an instructor account.");
  if (amountKobo <= 0 || amountKobo > 100_000_000) return no("Enter an amount between ₦1 and ₦1,000,000.");
  await db.$transaction(async (tx) => {
    const t = await tx.walletTransaction.create({ data: { instructorId: u.id, type: "BONUS", amountKobo, status: "AVAILABLE", reference: newReference("BON"), notes: description } });
    await audit({ actorId: staffId, action: "bonus_credited", targetType: "wallet_transaction", targetId: t.id, after: { instructorId: u.id, amountKobo, description } }, tx);
    await notify(u.id, { type: "payout_success", title: "Promotional bonus added", body: `${formatNaira(amountKobo)} was added to your earnings: ${description}`, link: "/instructor/earnings" }, tx);
  });
  return okR;
}
