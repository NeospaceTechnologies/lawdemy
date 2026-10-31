import "server-only";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { BUSINESS } from "@/lib/config";
import { notify } from "@/lib/notify";

/**
 * Applies a confirmed payment exactly once (webhooks may repeat): order → PAID,
 * enrolments, pending instructor earnings, cart cleanup, notifications.
 */
export async function fulfilOrder(reference: string, providerAmountKobo: number) {
  const done = await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { reference }, include: { items: { include: { course: { select: { id: true, title: true, instructorId: true } } } }, learner: true } });
    if (!order) return null;
    if (order.status !== "PENDING") return order; // already handled
    if (providerAmountKobo !== order.totalKobo) {
      await tx.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
      return null;
    }
    const claimed = await tx.order.updateMany({ where: { id: order.id, status: "PENDING" }, data: { status: "PAID", paidAt: new Date() } });
    if (claimed.count === 0) return order;
    const availableAt = new Date(Date.now() + BUSINESS.pendingDays * 86400_000);
    for (const item of order.items) {
      await tx.enrollment.upsert({
        where: { courseId_learnerId: { courseId: item.courseId, learnerId: order.learnerId } },
        update: {},
        create: { courseId: item.courseId, learnerId: order.learnerId, orderId: order.id },
      });
      if (item.instructorShareKobo > 0) {
        await tx.walletTransaction.create({
          data: {
            instructorId: item.course.instructorId,
            type: "ENROLLMENT",
            amountKobo: item.instructorShareKobo,
            status: "PENDING",
            reference: `ENR-${item.id}`,
            availableAt,
            orderItemId: item.id,
            notes: `${order.learner.firstName} ${order.learner.lastName} enrolled in ${item.course.title}`,
          },
        });
      }
      await notify(item.course.instructorId, { type: "enrollment", title: "New enrolment", body: `${order.learner.firstName} ${order.learner.lastName} enrolled in ${item.course.title}.`, link: `/instructor/courses/${item.courseId}?tab=engagement` }, tx);
    }
    const ids = order.items.map((i) => i.courseId);
    await tx.cartItem.deleteMany({ where: { learnerId: order.learnerId, courseId: { in: ids } } });
    await tx.wishlistItem.deleteMany({ where: { learnerId: order.learnerId, courseId: { in: ids } } });
    await notify(order.learnerId, { type: "purchase", title: "Payment successful", body: `You’re enrolled in ${order.items.length} course${order.items.length === 1 ? "" : "s"}.`, link: "/my-courses" }, tx);
    await audit({ actorId: order.learnerId, action: "payment_succeeded", targetType: "order", targetId: order.id, after: { totalKobo: order.totalKobo } }, tx);
    return order;
  });
  return done;
}

export async function failOrder(reference: string) {
  await db.order.updateMany({ where: { reference, status: "PENDING" }, data: { status: "FAILED" } });
}
