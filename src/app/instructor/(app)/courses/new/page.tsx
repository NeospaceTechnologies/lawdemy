import type { Metadata } from "next";
import { CourseWizard } from "@/features/course-wizard/CourseWizard";
import { emptyDraft } from "@/lib/course/schema";
import { todayInWAT } from "@/lib/course/rules";

export const metadata: Metadata = { title: "Create course" };

// The draft is created on the first save, so abandoning an empty form leaves nothing behind.
export default function NewCoursePage() {
  return <CourseWizard courseId={null} initial={emptyDraft()} today={todayInWAT()} />;
}
