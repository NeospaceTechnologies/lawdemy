import { z } from "zod";
import { db } from "@/lib/db";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";
import { isKnown } from "@/lib/taxonomy-store";

const legal = z.discriminatedUnion("isLawyer", [
  z.object({
    step: z.literal("legal"),
    isLawyer: z.literal(true),
    callYear: z.number().int().min(1950).max(new Date().getUTCFullYear()),
    jurisdictions: z.array(z.string().max(120)).min(1, "Choose at least one jurisdiction.").max(10),
    practiceAreas: z.array(z.string().max(120)).min(1, "Choose at least one practice area.").max(15),
  }),
  z.object({ step: z.literal("legal"), isLawyer: z.literal(false) }),
]);
const interests = z.object({ step: z.literal("interests"), interests: z.array(z.string().max(120)).min(1, "Pick at least one area.").max(40) });
const done = z.object({ step: z.literal("done"), marketingOptIn: z.boolean() });

// Learner onboarding steps after email verification (LRN-ONB-04..06).
export async function PUT(req: Request) {
  const { user, error } = await requireUser("LEARNER");
  if (error) return error;
  if (!user.emailVerifiedAt) return fail(403, "EMAIL_UNVERIFIED", "Verify your email first.");
  const body = await readJson(req);
  const step = (body as { step?: string } | null)?.step;
  if (step === "legal") {
    const p = legal.safeParse(body);
    if (!p.success) return invalid(p.error);
    const d = p.data;
    if (d.isLawyer && !((await isKnown("jurisdiction", d.jurisdictions)) && (await isKnown("practice_area", d.practiceAreas)))) {
      return fail(422, "VALIDATION_FAILED", "Choose values from the lists.");
    }
    await db.learnerProfile.update({
      where: { userId: user.id },
      data: d.isLawyer
        ? { isLawyer: true, callYear: d.callYear, jurisdictions: d.jurisdictions, practiceAreas: d.practiceAreas }
        : { isLawyer: false, callYear: null, jurisdictions: [], practiceAreas: [] },
    });
  } else if (step === "interests") {
    const p = interests.safeParse(body);
    if (!p.success) return invalid(p.error);
    if (!(await isKnown("interest", p.data.interests))) return fail(422, "VALIDATION_FAILED", "Pick areas from the list.");
    await db.learnerProfile.update({ where: { userId: user.id }, data: { interests: p.data.interests, onboardedAt: new Date() } });
  } else if (step === "done") {
    const p = done.safeParse(body);
    if (!p.success) return invalid(p.error);
    await db.user.update({ where: { id: user.id }, data: { marketingOptIn: p.data.marketingOptIn } });
  } else {
    return fail(400, "BAD_STEP", "Unknown onboarding step.");
  }
  return ok({ ok: true });
}
