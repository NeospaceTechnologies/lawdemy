import { fail, invalid, ok, readJson } from "@/lib/http";
import { getCurrentUser } from "@/lib/auth/session";
import { courseDraftSchema } from "@/lib/course/schema";
import { EDITABLE_STATUSES, assertAssetsUsable, findOwnedCourse, saveCourse, toDraft } from "@/lib/course/repository";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser("INSTRUCTOR");
  if (!user) return fail(401, "UNAUTHENTICATED", "Please sign in again.");
  const course = await findOwnedCourse((await params).id, user.id);
  if (!course) return fail(404, "NOT_FOUND", "Course not found.");
  return ok({ id: course.id, status: course.status, updatedAt: course.updatedAt, draft: toDraft(course) });
}

// Save the whole draft (Save Draft, autosave, and before submitting).
export async function PUT(req: Request, { params }: Ctx) {
  const user = await getCurrentUser("INSTRUCTOR");
  if (!user) return fail(401, "UNAUTHENTICATED", "Please sign in again.");
  const course = await findOwnedCourse((await params).id, user.id);
  if (!course) return fail(404, "NOT_FOUND", "Course not found.");
  if (!EDITABLE_STATUSES.includes(course.status)) {
    return fail(409, "NOT_EDITABLE", "This course can't be edited while it is under review or live.");
  }

  const parsed = courseDraftSchema.safeParse(await readJson(req));
  if (!parsed.success) return invalid(parsed.error);

  try {
    await assertAssetsUsable(parsed.data, user.id);
  } catch {
    return fail(422, "ASSET_NOT_USABLE", "One of the uploaded files is missing or still uploading.");
  }

  const saved = await saveCourse(course.id, parsed.data);
  return ok({ id: saved.id, status: saved.status, updatedAt: saved.updatedAt });
}
