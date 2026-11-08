import { z } from "zod";
import { db } from "@/lib/db";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/auth/session";
import { IMAGE_MIME, LIMITS, VIDEO_MIME } from "@/lib/course/constants";
import { storage } from "@/lib/storage";

const createSchema = z.object({
  kind: z.enum(["VIDEO", "IMAGE", "FILE"]),
  fileName: z.string().trim().min(1).max(255),
  mime: z.string(),
  sizeBytes: z.number().int().positive(),
  durationSeconds: z.number().min(0).nullable().optional(),
});

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const RULES = {
  VIDEO: { mime: VIDEO_MIME as readonly string[], max: LIMITS.videoMaxBytes, label: "MP4 video up to 500MB" },
  IMAGE: { mime: IMAGE_MIME as readonly string[], max: LIMITS.imageMaxBytes, label: "JPEG or PNG image up to 5MB" },
  // Q&A, reply, community and support attachments (PRD 7.1: max 10 MB).
  FILE: { mime: [...IMAGE_MIME, "application/pdf", DOCX, "text/vtt"] as readonly string[], max: 10 * 1024 * 1024, label: "JPEG, PNG, PDF or DOCX file up to 10MB" },
};
const EXT: Record<string, string> = { "video/mp4": "mp4", "image/png": "png", "image/jpeg": "jpg", "application/pdf": "pdf", [DOCX]: "docx", "text/vtt": "vtt" };

// Step 1 of an upload: register the file and get the URL to send the bytes to.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHENTICATED", "Please sign in again.");
  if (!rateLimit(`upload:${user.id}`, 30, 60 * 60_000).ok) {
    return fail(429, "RATE_LIMITED", "Too many uploads. Please wait and try again.");
  }

  const parsed = createSchema.safeParse(await readJson(req));
  if (!parsed.success) return invalid(parsed.error);
  const { kind, fileName, mime, sizeBytes, durationSeconds } = parsed.data;
  if (kind === "VIDEO" && user.role !== "INSTRUCTOR") return fail(403, "FORBIDDEN", "Only instructors can upload lesson videos.");
  if (mime === "text/vtt" && user.role !== "INSTRUCTOR") return fail(403, "FORBIDDEN", "Only instructors can upload captions.");
  const rule = RULES[kind];
  if (!rule.mime.includes(mime)) return fail(415, "UNSUPPORTED_TYPE", `Upload a ${rule.label}.`);
  if (sizeBytes > rule.max) return fail(413, "TOO_LARGE", `Upload a ${rule.label}.`);
  if (kind === "VIDEO" && durationSeconds && durationSeconds > LIMITS.videoMaxSeconds) {
    return fail(422, "TOO_LONG", "Videos must be 30 minutes or shorter.");
  }

  const ext = EXT[mime] ?? "bin";
  const asset = await db.mediaAsset.create({
    data: {
      ownerId: user.id,
      kind,
      fileName,
      mime,
      sizeBytes,
      storageKey: "pending",
      durationSeconds: durationSeconds ? Math.round(durationSeconds) : null,
    },
  });
  const storageKey = `${user.id}/${asset.id}.${ext}`;
  await db.mediaAsset.update({ where: { id: asset.id }, data: { storageKey } });

  // Direct-upload drivers: the browser sends the bytes straight to storage, then confirms.
  const store = storage();
  if (store.createUploadUrl) {
    const uploadUrl = await store.createUploadUrl(storageKey);
    return ok({ id: asset.id, uploadUrl, completeUrl: `/api/uploads/${asset.id}/complete` }, { status: 201 });
  }
  return ok({ id: asset.id, uploadUrl: `/api/uploads/${asset.id}` }, { status: 201 });
}
