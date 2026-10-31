import type { Metadata } from "next";
import { InstructorCommunity } from "@/features/community/InstructorCommunity";
import { db } from "@/lib/db";
import { requireInstructorPage } from "@/lib/auth/pages";
import { loadPosts } from "@/lib/community";

export const metadata: Metadata = { title: "Community" };

export default async function InstructorCommunityPage() {
  const { user } = await requireInstructorPage();
  const [posts, announcements, courses] = await Promise.all([
    loadPosts(user.id, { where: { kind: "discussion" } }),
    loadPosts(user.id, { where: { kind: "announcement", authorId: user.id } }),
    db.course.findMany({ where: { instructorId: user.id, status: "LIVE", deletedAt: null }, select: { id: true, title: true }, orderBy: { title: "asc" } }),
  ]);
  return <InstructorCommunity posts={posts} announcements={announcements} courses={courses} />;
}
