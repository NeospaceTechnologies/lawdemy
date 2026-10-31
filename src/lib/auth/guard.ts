import "server-only";
import type { Role, User } from "@prisma/client";
import { fail } from "@/lib/http";
import { getCurrentUser } from "./session";

/** For route handlers: returns the signed-in user or a 401 response. */
export async function requireUser(role?: Role): Promise<{ user: User; error?: never } | { user?: never; error: Response }> {
  const user = await getCurrentUser(role);
  if (!user) return { error: fail(401, "UNAUTHENTICATED", "Please sign in again.") };
  return { user };
}
