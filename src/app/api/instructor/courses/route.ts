import { audit } from "@/lib/audit";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { getCurrentUser } from "@/lib/auth/session";
import { courseDraftSchema } from "@/lib/course/schema";
import { assertAssetsUsable, createCourse } from "@/lib/course/repository";

// Create a draft course from the wizard's first save.
export async function POST(req: Request) {
  const user = await getCurrentUser("INSTRUCTOR");
  if (!user) return fail(401, "UNAUTHENTICATED", "Please sign in again.");

  const parsed = courseDraftSchema.safeParse(await readJson(req));
  if (!parsed.success) return invalid(parsed.error);

  try {
    await assertAssetsUsable(parsed.data, user.id);
  } catch {
    return fail(422, "ASSET_NOT_USABLE", "One of the uploaded files is missing or still uploading.");
  }

  const course = await createCourse(user.id, parsed.data);
  await audit({ actorId: user.id, action: "course_created", targetType: "course", targetId: course.id });
  return ok({ id: course.id, status: course.status, updatedAt: course.updatedAt }, { status: 201 });
}
