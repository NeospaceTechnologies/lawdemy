import { z } from "zod";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";
import { allowedActions } from "@/lib/course/status-rules";

const schema = z.object({ action: z.enum(["archive", "restore", "duplicate"]) });

// Archive, restore and duplicate a course (INS-MGT-06/07).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser("INSTRUCTOR");
  if (error) return error;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  const course = await db.course.findFirst({
    where: { id: (await params).id, instructorId: user.id, deletedAt: null },
    include: { modules: { include: { lessons: true } }, quiz: { include: { questions: true } }, _count: { select: { enrollments: true } } },
  });
  if (!course) return fail(404, "NOT_FOUND", "Course not found.");
  const action = p.data.action;
  if (!allowedActions(course.status, course._count.enrollments).includes(action)) {
    return fail(409, "NOT_ALLOWED", "That action isn’t available for this course’s status.");
  }

  if (action === "restore" && course.takenDownAt) {
    return fail(409, "TAKEN_DOWN", "Lawdemy unpublished this course. Contact support to discuss restoring it.");
  }
  if (action === "archive" || action === "restore") {
    const to = action === "archive" ? "ARCHIVED" : "LIVE";
    await db.course.update({ where: { id: course.id }, data: { status: to, archivedAt: action === "archive" ? new Date() : null } });
    await audit({ actorId: user.id, action: `course_${action}d`, targetType: "course", targetId: course.id, before: { status: course.status }, after: { status: to } });
    return ok({ id: course.id, status: to });
  }

  // Duplicate: "Copy of <title>" as a Draft with all content (assets are shared, not copied).
  const copy = await db.course.create({
    data: {
      instructorId: user.id,
      title: `Copy of ${course.title}`.slice(0, 120),
      subtitle: course.subtitle,
      description: course.description,
      outcomes: course.outcomes,
      category: course.category,
      level: course.level,
      durationSeconds: course.durationSeconds,
      durationFormat: course.durationFormat,
      thumbnailAssetId: course.thumbnailAssetId,
      access: course.access,
      priceKobo: course.priceKobo,
      discountPct: null,
      discountEndsAt: null,
      hasCertificate: course.hasCertificate,
      status: "DRAFT",
      wizardStep: 3,
      duplicatedFromId: course.id,
      modules: {
        create: course.modules
          .sort((a, b) => a.position - b.position)
          .map((m) => ({
            id: randomUUID(),
            title: m.title,
            position: m.position,
            lessons: {
              create: m.lessons
                .sort((a, b) => a.position - b.position)
                .map((l) => ({ id: randomUUID(), title: l.title, position: l.position, videoAssetId: l.videoAssetId, captionsAssetId: l.captionsAssetId, writeUp: l.writeUp, durationSeconds: l.durationSeconds, durationFormat: l.durationFormat, isPreview: l.isPreview })),
            },
          })),
      },
      ...(course.quiz
        ? {
            quiz: {
              create: {
                title: course.quiz.title,
                instructions: course.quiz.instructions,
                questions: { create: course.quiz.questions.map((q) => ({ id: randomUUID(), type: q.type, prompt: q.prompt, options: q.options as object, modelAnswer: q.modelAnswer, feedback: q.feedback, position: q.position })) },
              },
            },
          }
        : {}),
    },
  });
  await audit({ actorId: user.id, action: "course_duplicated", targetType: "course", targetId: copy.id, before: { from: course.id } });
  return ok({ id: copy.id, status: "DRAFT" }, { status: 201 });
}
