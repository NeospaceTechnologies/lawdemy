import { db } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { getCurrentUser } from "@/lib/auth/session";
import { storage } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

async function ownedAsset(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: fail(401, "UNAUTHENTICATED", "Please sign in again.") };
  const asset = await db.mediaAsset.findFirst({ where: { id, ownerId: user.id } });
  if (!asset) return { error: fail(404, "NOT_FOUND", "File not found.") };
  return { asset };
}

// Step 2 of an upload: stream the bytes. The client sends this with XHR to show progress.
export async function PUT(req: Request, { params }: Ctx) {
  const { asset, error } = await ownedAsset((await params).id);
  if (error) return error;
  if (asset.status !== "UPLOADING") return fail(409, "ALREADY_UPLOADED", "This file has already been uploaded.");
  if (!req.body) return fail(400, "EMPTY", "No file received.");

  let written: number;
  try {
    written = await storage().put(asset.storageKey, req.body, asset.sizeBytes);
  } catch (err) {
    await db.mediaAsset.update({ where: { id: asset.id }, data: { status: "FAILED" } });
    const tooLarge = err instanceof Error && err.message === "TOO_LARGE";
    return fail(tooLarge ? 413 : 500, tooLarge ? "TOO_LARGE" : "UPLOAD_FAILED", tooLarge ? "File is larger than declared." : "Upload failed. Please try again.");
  }
  if (written !== asset.sizeBytes) {
    await storage().remove(asset.storageKey);
    await db.mediaAsset.update({ where: { id: asset.id }, data: { status: "FAILED" } });
    return fail(400, "INCOMPLETE", "Upload was interrupted. Please try again.");
  }

  // Local driver has no transcoding step, so the file is ready immediately.
  // With a video host this becomes PROCESSING until its webhook marks it READY.
  const updated = await db.mediaAsset.update({
    where: { id: asset.id },
    data: { status: "READY", receivedBytes: written },
  });
  return ok({ id: updated.id, status: updated.status });
}

export async function GET(_req: Request, { params }: Ctx) {
  const { asset, error } = await ownedAsset((await params).id);
  if (error) return error;
  const store = storage();
  if (asset.status === "READY" && store.signedReadUrl) {
    const url = await store.signedReadUrl(asset.storageKey);
    if (url) return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": "private, max-age=300" } });
  }
  const file = asset.status === "READY" ? await store.read(asset.storageKey) : null;
  if (!file) return fail(404, "NOT_FOUND", "File not found.");
  return new Response(file.stream, {
    headers: { "Content-Type": asset.mime, "Content-Length": String(file.size), "Cache-Control": "private, max-age=300" },
  });
}

// Remove an upload that no saved lesson or course uses any more.
export async function DELETE(_req: Request, { params }: Ctx) {
  const { asset, error } = await ownedAsset((await params).id);
  if (error) return error;
  const inUse =
    (await db.lesson.count({ where: { videoAssetId: asset.id } })) +
    (await db.course.count({ where: { thumbnailAssetId: asset.id } }));
  if (inUse > 0) return ok({ ok: true, kept: true }); // detached on next save; cleaned up by a sweeper job
  await storage().remove(asset.storageKey);
  await db.mediaAsset.delete({ where: { id: asset.id } });
  return ok({ ok: true });
}
