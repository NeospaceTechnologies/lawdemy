import { InstructorShell } from "@/components/layout/InstructorShell";
import { WithTaxonomy } from "@/components/WithTaxonomy";
import { requireInstructorPage } from "@/lib/auth/pages";

// Every instructor page needs an instructor session; the API checks again on each call.
export default async function InstructorAppLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireInstructorPage();
  return <InstructorShell user={{ firstName: user.firstName, lastName: user.lastName }}><WithTaxonomy>{children}</WithTaxonomy></InstructorShell>;
}
