import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/learner/Topbar";
import { PostThread } from "@/features/community/PostThread";
import { db } from "@/lib/db";
import { requireLearnerPage } from "@/lib/auth/pages";
import { canSeePost, loadThread } from "@/lib/community";

export const metadata: Metadata = { title: "Community thread" };

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireLearnerPage();
  const id = (await params).id;
  const raw = await db.post.findUnique({ where: { id }, select: { kind: true, courseId: true, authorId: true } });
  if (!raw || !(await canSeePost(raw, user))) notFound();
  const t = await loadThread(id, user.id);
  if (!t) notFound();
  return (
    <>
      <Topbar />
      <PostThread post={t.post} replies={t.replies} back="/community" />
    </>
  );
}
