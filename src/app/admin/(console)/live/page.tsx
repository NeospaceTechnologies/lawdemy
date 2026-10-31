import type { Metadata } from "next";
import Link from "next/link";
import { AdminAction } from "@/features/admin/AdminAction";
import { AdminHeader, AdminTable, FilterBar, inputCls, Pill, Td, when } from "@/features/admin/Table";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Live courses" };

// ADM-03: unpublish a Live course for a policy breach; lift a takedown.
export default async function LiveCoursesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim();
  const [live, down] = await Promise.all([
    db.course.findMany({
      where: { status: "LIVE", deletedAt: null, ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}) },
      orderBy: { publishedAt: "desc" },
      take: 100,
      include: { instructor: { select: { firstName: true, lastName: true } }, _count: { select: { enrollments: true } } },
    }),
    db.course.findMany({ where: { takenDownAt: { not: null }, deletedAt: null }, orderBy: { takenDownAt: "desc" }, include: { instructor: { select: { firstName: true, lastName: true } } } }),
  ]);
  return (
    <>
      <AdminHeader title="Live courses" subtitle="Unpublish a course that breaks policy. Enrolled learners keep access unless the reason is legal or safety." />
      <FilterBar>
        <input name="q" defaultValue={q} placeholder="Search by title" className={inputCls} aria-label="Search by title" />
        <button className="h-9 rounded-control border border-primary bg-white px-3 text-[13px] font-semibold text-primary">Search</button>
      </FilterBar>
      <AdminTable head={["Course", "Instructor", "Learners", "Live since", ""]} empty="No live courses match.">
        {live.map((c) => (
          <tr key={c.id}>
            <Td><Link href={`/admin/courses/${c.id}`} className="font-medium">{c.title}</Link></Td>
            <Td className="text-ink-3">{c.instructor.firstName} {c.instructor.lastName}</Td>
            <Td>{c._count.enrollments}</Td>
            <Td className="text-ink-3">{when(c.publishedAt)}</Td>
            <Td className="text-right">
              <AdminAction
                endpoint={`/api/admin/courses/${c.id}/takedown`}
                body={{ action: "takedown" }}
                label="Unpublish"
                variant="danger"
                title={`Unpublish “${c.title}”?`}
                description="The course disappears from the catalogue and the instructor is told why."
                fields={[
                  { name: "reason", label: "Reason (sent to the instructor)", type: "textarea", minLength: 20 },
                  { name: "revokeAccess", label: "Legal or safety reason: end access for enrolled learners", type: "checkbox", hint: "Leave unticked for ordinary policy breaches." },
                ]}
                busyLabel="Unpublishing…"
                success="Course unpublished"
              />
            </Td>
          </tr>
        ))}
      </AdminTable>
      <h2 className="m-0 text-lg font-semibold">Taken down</h2>
      <AdminTable head={["Course", "Instructor", "Reason", "Access", "Since", ""]} empty="No courses are taken down.">
        {down.map((c) => (
          <tr key={c.id}>
            <Td className="font-medium">{c.title}</Td>
            <Td className="text-ink-3">{c.instructor.firstName} {c.instructor.lastName}</Td>
            <Td className="max-w-[320px] text-ink-2">{c.takedownReason}</Td>
            <Td>{c.takedownRevokes ? <Pill tone="red">Revoked</Pill> : <Pill tone="green">Kept</Pill>}</Td>
            <Td className="text-ink-3">{when(c.takenDownAt)}</Td>
            <Td className="text-right"><AdminAction endpoint={`/api/admin/courses/${c.id}/takedown`} body={{ action: "restore" }} label="Restore" variant="outline" title="Put this course back live?" confirmLabel="Restore" busyLabel="Restoring…" success="Course is live again" /></Td>
          </tr>
        ))}
      </AdminTable>
    </>
  );
}
