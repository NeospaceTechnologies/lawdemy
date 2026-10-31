import "server-only";
import sanitizeHtml from "sanitize-html";
import type { CourseStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { CourseDraft } from "./schema";

// What each status allows (PRD 7.2): content can be edited only in Draft and Rejected.
export const EDITABLE_STATUSES: CourseStatus[] = ["DRAFT", "REJECTED"];

const courseInclude = {
  thumbnail: true,
  quiz: { include: { questions: { orderBy: { position: "asc" } } } },
  modules: {
    orderBy: { position: "asc" },
    include: { lessons: { orderBy: { position: "asc" }, include: { video: true, captions: true } } },
  },
} satisfies Prisma.CourseInclude;

type CourseWithTree = Prisma.CourseGetPayload<{ include: typeof courseInclude }>;

export function sanitizeWriteUp(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ["p", "div", "br", "b", "strong", "i", "em", "h3", "h4", "blockquote", "a", "ul", "ol", "li"],
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["https", "http", "mailto"],
    transformTags: { a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }) },
  });
}

export async function findOwnedCourse(courseId: string, instructorId: string) {
  return db.course.findFirst({
    where: { id: courseId, instructorId, deletedAt: null },
    include: courseInclude,
  });
}

export function toDraft(c: CourseWithTree): CourseDraft {
  return {
    wizardStep: c.wizardStep,
    info: {
      title: c.title,
      subtitle: c.subtitle ?? "",
      description: c.description ?? "",
      outcomes: c.outcomes ?? "",
      durationSeconds: c.durationSeconds,
      durationFormat: c.durationFormat,
      category: (c.category ?? "") as CourseDraft["info"]["category"],
      level: (c.level ?? "Beginner") as CourseDraft["info"]["level"],
      thumbnail: c.thumbnail ? { id: c.thumbnail.id, fileName: c.thumbnail.fileName, sizeBytes: c.thumbnail.sizeBytes } : null,
    },
    price: {
      access: c.access,
      priceKobo: c.priceKobo,
      discountPct: c.discountPct,
      discountEndsAt: c.discountEndsAt ? c.discountEndsAt.toISOString().slice(0, 10) : null,
      hasCertificate: c.hasCertificate,
    },
    modules: c.modules.map((m) => ({
      id: m.id,
      title: m.title,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        video: l.video ? { id: l.video.id, fileName: l.video.fileName, sizeBytes: l.video.sizeBytes } : null,
        captions: l.captions ? { id: l.captions.id, fileName: l.captions.fileName, sizeBytes: l.captions.sizeBytes } : null,
        writeUp: l.writeUp ?? "",
        durationSeconds: l.durationSeconds,
        durationFormat: l.durationFormat,
        isPreview: l.isPreview,
      })),
    })),
    quiz: c.quiz
      ? {
          title: c.quiz.title,
          instructions: c.quiz.instructions ?? "",
          questions: c.quiz.questions.map((q) => ({
            id: q.id,
            type: q.type,
            prompt: q.prompt,
            options: q.options as { text: string; correct: boolean }[],
            modelAnswer: q.modelAnswer ?? "",
            feedback: q.feedback ?? "",
          })),
        }
      : null,
  };
}

/** Throws if any referenced media asset isn't owned by the instructor and ready. */
export async function assertAssetsUsable(draft: CourseDraft, ownerId: string) {
  const ids = new Set<string>();
  if (draft.info.thumbnail) ids.add(draft.info.thumbnail.id);
  draft.modules.forEach((m) => m.lessons.forEach((l) => {
    if (l.video) ids.add(l.video.id);
    if (l.captions) ids.add(l.captions.id);
  }));
  if (ids.size === 0) return;
  const found = await db.mediaAsset.findMany({
    where: { id: { in: [...ids] }, ownerId, status: { in: ["READY", "PROCESSING"] } },
    select: { id: true },
  });
  if (found.length !== ids.size) throw new Error("ASSET_NOT_USABLE");
}

function courseColumns(draft: CourseDraft) {
  const { info, price } = draft;
  const paid = price.access === "PAID";
  return {
    title: info.title.trim(),
    subtitle: info.subtitle.trim() || null,
    description: info.description.trim() || null,
    outcomes: info.outcomes.trim() || null,
    durationSeconds: info.durationSeconds,
    durationFormat: info.durationFormat,
    category: info.category || null,
    level: info.level,
    thumbnailAssetId: info.thumbnail?.id ?? null,
    access: price.access,
    priceKobo: paid ? price.priceKobo : null,
    discountPct: paid ? price.discountPct : null,
    discountEndsAt: paid && price.discountEndsAt ? new Date(`${price.discountEndsAt}T23:59:59+01:00`) : null,
    hasCertificate: price.hasCertificate,
    wizardStep: draft.wizardStep,
  };
}

async function writeTree(tx: Prisma.TransactionClient, courseId: string, draft: CourseDraft) {
  // Drafts are saved as a whole document: replace the module/lesson/quiz tree.
  await tx.module.deleteMany({ where: { courseId } });
  for (const [mi, m] of draft.modules.entries()) {
    await tx.module.create({
      data: {
        id: m.id,
        courseId,
        title: m.title.trim(),
        position: mi,
        lessons: {
          create: m.lessons.map((l, li) => ({
            id: l.id,
            title: l.title.trim(),
            position: li,
            videoAssetId: l.video?.id ?? null,
            captionsAssetId: l.video && l.captions ? l.captions.id : null,
            writeUp: l.writeUp ? sanitizeWriteUp(l.writeUp) : null,
            durationSeconds: l.durationSeconds,
            durationFormat: l.durationFormat,
            isPreview: l.isPreview,
          })),
        },
      },
    });
  }
  await tx.quiz.deleteMany({ where: { courseId } });
  if (draft.quiz) {
    await tx.quiz.create({
      data: {
        courseId,
        title: draft.quiz.title.trim(),
        instructions: draft.quiz.instructions.trim() || null,
        questions: {
          create: draft.quiz.questions.map((q, qi) => ({
            id: q.id,
            type: q.type,
            prompt: q.prompt.trim(),
            options: q.type === "MC" || q.type === "TF" ? q.options : [],
            modelAnswer: q.type === "SHORT" ? q.modelAnswer.trim() || null : null,
            feedback: q.feedback.trim() || null,
            position: qi,
          })),
        },
      },
    });
  }
}

export async function createCourse(instructorId: string, draft: CourseDraft) {
  return db.$transaction(async (tx) => {
    const course = await tx.course.create({ data: { instructorId, ...courseColumns(draft) } });
    await writeTree(tx, course.id, draft);
    return course;
  });
}

export async function saveCourse(courseId: string, draft: CourseDraft) {
  return db.$transaction(async (tx) => {
    const course = await tx.course.update({ where: { id: courseId }, data: courseColumns(draft) });
    await writeTree(tx, courseId, draft);
    return course;
  });
}
