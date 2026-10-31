import { z } from "zod";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { requireStaff } from "@/lib/auth/staff";
import { db } from "@/lib/db";
import { creditBonus } from "@/lib/admin/ops";

const schema = z.object({
  instructorEmail: z.string().trim().toLowerCase().email("Enter the instructor’s email."),
  amountKobo: z.number().int().positive("Enter an amount."),
  description: z.string().trim().min(5, "Describe the bonus (shown to the instructor).").max(120),
});

// ADM-10: credit a Promotional Bonus, shown in the instructor's transactions.
export async function POST(req: Request) {
  const { user, error } = await requireStaff();
  if (error) return error;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  const instructor = await db.user.findFirst({ where: { email: p.data.instructorEmail, role: "INSTRUCTOR", deletedAt: null }, select: { id: true } });
  if (!instructor) return fail(404, "NOT_FOUND", "No instructor has that email.", { instructorEmail: "No instructor has that email." });
  const r = await creditBonus(user.id, instructor.id, p.data.amountKobo, p.data.description);
  return r.ok ? ok({ ok: true }) : fail(409, "NOT_ALLOWED", r.error);
}
