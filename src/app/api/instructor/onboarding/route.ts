import { z } from "zod";
import { db } from "@/lib/db";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";
import { isKnown } from "@/lib/taxonomy-store";

const url = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || /^https:\/\/[^\s/$.?#].[^\s]*$/i.test(v), "Enter a valid https:// link.");

const backgroundSchema = z.object({
  step: z.literal("background"),
  professionalTitle: z.string().trim().min(1, "Choose your professional title.").max(120),
  yearsExperience: z.number().int().min(0).max(70),
  jurisdictions: z.array(z.string().max(120)).min(1, "Choose at least one jurisdiction.").max(30),
  practiceAreas: z.array(z.string().max(120)).min(1, "Choose at least one practice area.").max(30),
});
const profileSchema = z.object({
  step: z.literal("profile"),
  bio: z.string().trim().min(1, "Add a short bio.").max(500, "Keep your bio to 500 characters."),
  photoAssetId: z.string().nullable().optional(),
  links: z.object({ linkedin: url, x: url, website: url, other: url }),
});
const done = z.object({ step: z.literal("done"), marketingOptIn: z.boolean() });

// Instructor onboarding after verification (INS-ONB-02..04). Also used by Settings → Legal background.
export async function PUT(req: Request) {
  const { user, error } = await requireUser("INSTRUCTOR");
  if (error) return error;
  if (!user.emailVerifiedAt) return fail(403, "EMAIL_UNVERIFIED", "Verify your email first.");
  const body = await readJson(req);
  const step = (body as { step?: string } | null)?.step;
  if (step === "background") {
    const p = backgroundSchema.safeParse(body);
    if (!p.success) return invalid(p.error);
    const { step: _s, ...data } = p.data;
    if (!(await isKnown("professional_title", [data.professionalTitle]))) return fail(422, "VALIDATION_FAILED", "Choose your professional title.", { professionalTitle: "Choose your professional title." });
    if (!(await isKnown("jurisdiction", data.jurisdictions))) return fail(422, "VALIDATION_FAILED", "Choose jurisdictions from the list.", { jurisdictions: "Choose jurisdictions from the list." });
    if (!(await isKnown("practice_area", data.practiceAreas))) return fail(422, "VALIDATION_FAILED", "Choose practice areas from the list.", { practiceAreas: "Choose practice areas from the list." });
    await db.instructorProfile.upsert({ where: { userId: user.id }, update: data, create: { userId: user.id, ...data } });
  } else if (step === "profile") {
    const p = profileSchema.safeParse(body);
    if (!p.success) return invalid(p.error);
    if (p.data.photoAssetId) {
      const a = await db.mediaAsset.findFirst({ where: { id: p.data.photoAssetId, ownerId: user.id, kind: "IMAGE", status: "READY" } });
      if (!a) return fail(422, "BAD_ASSET", "Upload a JPEG or PNG photo.");
    }
    const links = Object.fromEntries(Object.entries(p.data.links).filter(([, v]) => v));
    await db.$transaction([
      db.instructorProfile.update({ where: { userId: user.id }, data: { bio: p.data.bio, links, onboardedAt: new Date() } }),
      ...(p.data.photoAssetId !== undefined ? [db.user.update({ where: { id: user.id }, data: { photoAssetId: p.data.photoAssetId } })] : []),
    ]);
  } else if (step === "done") {
    const p = done.safeParse(body);
    if (!p.success) return invalid(p.error);
    await db.user.update({ where: { id: user.id }, data: { marketingOptIn: p.data.marketingOptIn } });
  } else {
    return fail(400, "BAD_STEP", "Unknown onboarding step.");
  }
  return ok({ ok: true });
}
