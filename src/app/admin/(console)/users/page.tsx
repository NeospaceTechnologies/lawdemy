import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader, AdminTable, FilterBar, inputCls, Pill, Td, when } from "@/features/admin/Table";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Users" };

// ADM-09: search users by name or email.
export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const role = sp.role === "LEARNER" || sp.role === "INSTRUCTOR" || sp.role === "ADMIN" ? sp.role : undefined;
  const users = await db.user.findMany({
    where: {
      deletedAt: null,
      ...(role ? { role } : {}),
      ...(q ? { OR: [{ email: { contains: q, mode: "insensitive" as const } }, { firstName: { contains: q, mode: "insensitive" as const } }, { lastName: { contains: q, mode: "insensitive" as const } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <>
      <AdminHeader title="Users" subtitle="Find a learner, instructor or staff account." />
      <FilterBar>
        <input name="q" defaultValue={q} placeholder="Name or email" className={inputCls + " w-72"} aria-label="Name or email" />
        <select name="role" defaultValue={role ?? ""} className={inputCls} aria-label="Role"><option value="">All roles</option><option value="LEARNER">Learners</option><option value="INSTRUCTOR">Instructors</option><option value="ADMIN">Staff</option></select>
        <button className="h-9 rounded-control border border-primary bg-white px-3 text-[13px] font-semibold text-primary">Search</button>
      </FilterBar>
      <AdminTable head={["Name", "Email", "Role", "Status", "Joined"]} empty="No users match.">
        {users.map((u) => (
          <tr key={u.id}>
            <Td><Link href={`/admin/users/${u.id}`} className="font-medium">{u.firstName} {u.lastName}</Link></Td>
            <Td className="text-ink-3">{u.email}</Td>
            <Td>{u.role === "ADMIN" ? "Staff" : u.role === "INSTRUCTOR" ? "Instructor" : "Learner"}</Td>
            <Td>{u.status === "ACTIVE" ? <Pill tone="green">Active</Pill> : <Pill tone="red">Deactivated</Pill>}{u.walletFrozenAt && <span className="ml-1"><Pill tone="red">Wallet frozen</Pill></span>}</Td>
            <Td className="text-ink-3">{when(u.createdAt)}</Td>
          </tr>
        ))}
      </AdminTable>
    </>
  );
}
