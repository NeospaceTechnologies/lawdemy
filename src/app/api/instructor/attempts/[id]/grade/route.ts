import { z } from "zod";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";
import { markAttempt } from "@/lib/grading";

const schema = z.object({ marks: z.record(z.string(), z.object({ correct: z.boolean(), comment: z.string().max(1000).optional().nullable() })) });

// Mark the written answers of a final-quiz attempt.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser("INSTRUCTOR");
  if (error) return error;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  const r = await markAttempt((await params).id, user.id, p.data.marks);
  if ("error" in r) return fail(409, "NOT_ALLOWED", r.error ?? "Couldn’t save the marks.");
  return ok(r);
}
