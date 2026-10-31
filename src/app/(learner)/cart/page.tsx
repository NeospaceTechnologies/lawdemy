import type { Metadata } from "next";
import { Topbar } from "@/components/learner/Topbar";
import { CartView, type CartLine } from "@/features/buy/CartView";
import { db } from "@/lib/db";
import { effectivePrice, recommendedFor } from "@/lib/catalog";
import { requireLearnerPage } from "@/lib/auth/pages";

export const metadata: Metadata = { title: "Your cart" };

export default async function CartPage() {
  const { user } = await requireLearnerPage();
  const rows = await db.cartItem.findMany({
    where: { learnerId: user.id, course: { status: "LIVE", deletedAt: null } },
    orderBy: { createdAt: "asc" },
    include: { course: { include: { instructor: { select: { firstName: true, lastName: true } }, modules: { select: { _count: { select: { lessons: true } } } } } } },
  });
  const lines: CartLine[] = rows.map(({ course: c }) => {
    const p = effectivePrice(c);
    const lectures = c.modules.reduce((a, m) => a + m._count.lessons, 0);
    return {
      courseId: c.id,
      title: c.title,
      instructor: `${c.instructor.firstName} ${c.instructor.lastName}`,
      priceKobo: p.kobo,
      fullKobo: p.fullKobo,
      meta: `${Math.round((c.durationSeconds ?? 0) / 3600)} Total hours • ${lectures} Lectures • ${c.level ?? "Beginner"}`,
      thumbnailUrl: c.thumbnailAssetId ? `/api/media/${c.thumbnailAssetId}` : null,
    };
  });
  const explore = lines.length ? [] : await recommendedFor(user.id, 3);
  return (
    <>
      <Topbar back="/courses" />
      <CartView initial={lines} explore={explore} />
    </>
  );
}
