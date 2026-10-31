import { z } from "zod";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { requireStaff } from "@/lib/auth/staff";
import { restoreCourse, takeDownCourse } from "@/lib/admin/ops";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("takedown"), reason: z.string().trim().min(20, "Give a reason of at least 20 characters.").max(2000), revokeAccess: z.boolean().default(false) }),
  z.object({ action: z.literal("restore") }),
]);

// ADM-03: unpublish a Live course for a policy breach, or lift a takedown.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireStaff();
  if (error) return error;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  const id = (await params).id;
  const r = p.data.action === "takedown" ? await takeDownCourse(user.id, id, p.data.reason, p.data.revokeAccess) : await restoreCourse(user.id, id);
  return r.ok ? ok({ ok: true }) : fail(409, "NOT_ALLOWED", r.error);
}
