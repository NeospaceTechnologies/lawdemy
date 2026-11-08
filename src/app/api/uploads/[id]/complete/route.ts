import { db } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { getCurrentUser } from "@/lib/auth/session";
import { storage } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

// Step 3 for direct-upload drivers: the browser has sent the bytes to storage; check they all arrived.
export async function POST(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHENTICATED", "Please sign in again.");
  const asset = await db.mediaAsset.findFirst({ where: { id: (await params).id, ownerId: user.id } });
  if (!asset) return fail(404, "NOT_FOUND", "File not found.");
  if (asset.status === "READY") return ok({ id: asset.id, status: asset.status });
  if (asset.status !== "UPLOADING") return fail(409, "ALREADY_UPLOADED", "This file has already been uploaded.");

  const store = storage();
  const size = (await store.size?.(asset.storageKey)) ?? null;
  if (size !== asset.sizeBytes) {
    if (size !== null) await store.remove(asset.storageKey);
    await db.mediaAsset.update({ where: { id: asset.id }, data: { status: "FAILED" } });
    return fail(400, "INCOMPLETE", "Upload was interrupted. Please try again.");
  }

  const updated = await db.mediaAsset.update({ where: { id: asset.id }, data: { status: "READY", receivedBytes: size } });
  return ok({ id: updated.id, status: updated.status });
}
