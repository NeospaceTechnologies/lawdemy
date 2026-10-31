import { z } from "zod";
import { db } from "@/lib/db";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";

const schema = z.object({ assetId: z.string().nullable() });

// Change or remove the profile photo (an IMAGE asset the user uploaded).
export async function PUT(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  if (p.data.assetId) {
    const a = await db.mediaAsset.findFirst({ where: { id: p.data.assetId, ownerId: user.id, kind: "IMAGE", status: "READY" } });
    if (!a) return fail(422, "BAD_ASSET", "Upload a JPEG or PNG image.");
  }
  await db.user.update({ where: { id: user.id }, data: { photoAssetId: p.data.assetId } });
  return ok({ ok: true });
}
