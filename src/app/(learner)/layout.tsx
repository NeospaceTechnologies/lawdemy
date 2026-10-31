import { LearnerShell } from "@/components/learner/LearnerShell";
import { WithTaxonomy } from "@/components/WithTaxonomy";
import { db } from "@/lib/db";
import { requireLearnerPage } from "@/lib/auth/pages";

export default async function LearnerLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireLearnerPage();
  const [cart, unread] = await Promise.all([
    db.cartItem.count({ where: { learnerId: user.id } }),
    db.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);
  return (
    <LearnerShell
      user={{ firstName: user.firstName, lastName: user.lastName, email: user.email, photoUrl: user.photoAssetId ? `/api/media/${user.photoAssetId}` : null }}
      counts={{ cart, unread }}
    >
      <WithTaxonomy>{children}</WithTaxonomy>
    </LearnerShell>
  );
}
