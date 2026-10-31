import type { Metadata } from "next";
import { Topbar } from "@/components/learner/Topbar";
import { CommunityList } from "@/features/community/CommunityList";
import { requireLearnerPage } from "@/lib/auth/pages";
import { loadPosts } from "@/lib/community";

export const metadata: Metadata = { title: "Community" };

export default async function CommunityPage() {
  const { user } = await requireLearnerPage();
  const posts = await loadPosts(user.id, { where: { kind: "discussion" } });
  return (
    <>
      <Topbar />
      <CommunityList posts={posts} base="/community" />
    </>
  );
}
