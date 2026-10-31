import { db } from "@/lib/db";
import { fail } from "@/lib/http";
import { getCurrentUser } from "@/lib/auth/session";
import { storage } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Serves uploaded media with access rules. Images (thumbnails, photos, post
 * attachments) are public; lesson videos need ownership, enrolment, or a preview
 * lesson. Production replaces this with signed, expiring CDN URLs (PRD 9).
 */
async function canView(assetId: string, kind: string, ownerId: string) {
  if (kind === "IMAGE") return true;
  const user = await getCurrentUser();
  if (user && user.id === ownerId) return true;
  if (kind === "FILE") return !!user; // Q&A / community attachments: any signed-in user
  const lessons = await db.lesson.findMany({
    where: { videoAssetId: assetId },
    select: { isPreview: true, module: { select: { course: { select: { id: true, status: true } } } } },
  });
  for (const l of lessons) {
    const course = l.module.course;
    if (l.isPreview && course.status === "LIVE") return true;
    if (user && (await db.enrollment.count({ where: { courseId: course.id, learnerId: user.id } }))) return true;
  }
  return false;
}

export async function GET(req: Request, { params }: Ctx) {
  const asset = await db.mediaAsset.findUnique({ where: { id: (await params).id } });
  if (!asset || asset.status !== "READY") return fail(404, "NOT_FOUND", "File not found.");
  if (!(await canView(asset.id, asset.kind, asset.ownerId))) return fail(403, "FORBIDDEN", "You don’t have access to this file.");

  const size = asset.sizeBytes;
  const range = req.headers.get("range");
  const m = range && /bytes=(\d*)-(\d*)/.exec(range);
  if (m) {
    const start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
    const end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
    if (start >= size || start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    const file = await storage().read(asset.storageKey, { start, end });
    if (!file) return fail(404, "NOT_FOUND", "File not found.");
    return new Response(file.stream, {
      status: 206,
      headers: {
        "Content-Type": asset.mime,
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=300",
      },
    });
  }
  const file = await storage().read(asset.storageKey);
  if (!file) return fail(404, "NOT_FOUND", "File not found.");
  return new Response(file.stream, {
    headers: {
      "Content-Type": asset.mime,
      "Content-Length": String(file.size),
      "Accept-Ranges": "bytes",
      "Cache-Control": asset.kind === "IMAGE" ? "public, max-age=3600" : "private, max-age=300",
      ...(asset.kind === "FILE" ? { "Content-Disposition": `attachment; filename="${asset.fileName.replace(/"/g, "")}"` } : {}),
    },
  });
}
