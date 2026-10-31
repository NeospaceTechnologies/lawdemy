import { db } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";

export async function GET(_req: Request, { params }: { params: Promise<{ reference: string }> }) {
  const { user, error } = await requireUser("LEARNER");
  if (error) return error;
  const order = await db.order.findFirst({ where: { reference: (await params).reference, learnerId: user.id }, select: { status: true, items: { select: { courseId: true } } } });
  if (!order) return fail(404, "NOT_FOUND", "Order not found.");
  return ok(order);
}
