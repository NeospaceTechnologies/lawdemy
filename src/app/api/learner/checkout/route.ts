import { db } from "@/lib/db";
import { BUSINESS } from "@/lib/config";
import { effectivePrice, LIVE } from "@/lib/catalog";
import { fail, ok } from "@/lib/http";
import { appUrl } from "@/lib/email";
import { requireUser } from "@/lib/auth/guard";
import { newReference, payments } from "@/lib/payments";

// Proceed to Pay: price the cart on the server, create a pending order, start hosted checkout.
export async function POST() {
  const { user, error } = await requireUser("LEARNER");
  if (error) return error;
  const cart = await db.cartItem.findMany({
    where: { learnerId: user.id, course: LIVE },
    include: { course: { select: { id: true, access: true, priceKobo: true, discountPct: true, discountEndsAt: true } } },
  });
  const owned = new Set((await db.enrollment.findMany({ where: { learnerId: user.id }, select: { courseId: true } })).map((e) => e.courseId));
  const items = cart.filter((c) => !owned.has(c.courseId) && c.course.access === "PAID");
  if (!items.length) return fail(409, "EMPTY_CART", "Your cart is empty.");

  const lines = items.map((c) => {
    const price = effectivePrice(c.course).kobo;
    const fee = Math.round((price * BUSINESS.platformFeePct) / 100);
    return { courseId: c.courseId, priceKobo: price, platformFeeKobo: fee, instructorShareKobo: price - fee };
  });
  const totalKobo = lines.reduce((a, l) => a + l.priceKobo, 0);
  const reference = newReference("LWD");
  const provider = payments();
  const order = await db.order.create({ data: { learnerId: user.id, reference, totalKobo, provider: provider.name, items: { create: lines } } });
  try {
    const init = await provider.initialize({ reference, amountKobo: totalKobo, email: user.email, callbackUrl: appUrl(`/api/payments/callback?reference=${reference}`) });
    await db.order.update({ where: { id: order.id }, data: { providerRef: init.providerRef } });
    return ok({ reference, authorizationUrl: init.authorizationUrl });
  } catch {
    await db.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
    return fail(502, "PROVIDER_ERROR", "We couldn’t reach the payment provider. Please try again.");
  }
}
