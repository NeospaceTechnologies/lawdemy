import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireStaffPage } from "@/lib/auth/staff";

export const metadata: Metadata = { title: "Review queue" };

// Course review queue (ADM-01): Under Review, oldest first, time in queue vs the 48 h target.
export default async function AdminQueuePage() {
  await requireStaffPage();
  const rows = await db.course.findMany({
    where: { status: "UNDER_REVIEW", deletedAt: null },
    orderBy: { submittedAt: "asc" },
    include: { instructor: { select: { firstName: true, lastName: true } } },
  });
  return (
    <>
      <h1 className="m-0 text-2xl font-bold">Course review queue</h1>
      {rows.length === 0 ? (
        <p className="m-0 text-sm text-ink-3">No courses are waiting for review.</p>
      ) : (
        <table className="w-full border-collapse overflow-hidden rounded-card border border-line text-[13px]">
          <thead><tr className="bg-surface text-left text-xs text-ink-3">{["Course", "Instructor", "Submitted", "In queue", ""].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((c) => {
              const hours = c.submittedAt ? Math.floor((Date.now() - c.submittedAt.getTime()) / 3600_000) : 0;
              return (
                <tr key={c.id} className="border-t border-line">
                  <td className="px-4 py-3 font-medium">{c.title}</td>
                  <td className="px-4 py-3 text-ink-3">{c.instructor.firstName} {c.instructor.lastName}</td>
                  <td className="px-4 py-3 text-ink-3">{c.submittedAt?.toLocaleString("en-GB", { timeZone: "Africa/Lagos" })}</td>
                  <td className={`px-4 py-3 font-semibold ${hours >= 48 ? "text-danger-text" : hours >= 36 ? "text-warning-text" : "text-success"}`}>{hours}h / 48h</td>
                  <td className="px-4 py-3 text-right"><Link href={`/admin/courses/${c.id}`} className="font-semibold">Review</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
