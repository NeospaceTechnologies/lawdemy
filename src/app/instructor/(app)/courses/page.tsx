import type { Metadata } from "next";
import { InstructorTopbar } from "@/components/layout/InstructorTopbar";
import { CourseLibrary } from "@/features/instructor/CourseLibrary";
import { db } from "@/lib/db";
import { requireInstructorPage } from "@/lib/auth/pages";
import { courseRows } from "@/lib/instructor";

export const metadata: Metadata = { title: "My Courses" };

export default async function InstructorCoursesPage() {
  const { user } = await requireInstructorPage();
  const [rows, unread] = await Promise.all([courseRows(user.id), db.notification.count({ where: { userId: user.id, readAt: null } })]);
  return (
    <>
      <InstructorTopbar unread={unread} />
      <CourseLibrary rows={rows} />
    </>
  );
}
