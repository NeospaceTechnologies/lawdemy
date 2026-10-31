import type { Metadata } from "next";
import { Topbar } from "@/components/learner/Topbar";
import { WishlistView } from "@/features/buy/WishlistView";
import { db } from "@/lib/db";
import { cardsByIds } from "@/lib/catalog";
import { requireLearnerPage } from "@/lib/auth/pages";

export const metadata: Metadata = { title: "Your wishlist" };

export default async function WishlistPage() {
  const { user } = await requireLearnerPage();
  const rows = await db.wishlistItem.findMany({ where: { learnerId: user.id, course: { status: "LIVE", deletedAt: null } }, orderBy: { createdAt: "desc" }, select: { courseId: true } });
  return (
    <>
      <Topbar back="/courses" />
      <WishlistView initial={await cardsByIds(rows.map((r) => r.courseId))} />
    </>
  );
}
