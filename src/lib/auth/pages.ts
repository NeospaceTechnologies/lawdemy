import "server-only";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "./session";

/** Learner pages: signed-in, verified learner. Onboarding pages pass `onboarding: true`. */
export async function requireLearnerPage({ onboarding = false } = {}) {
  const user = await getCurrentUser("LEARNER");
  if (!user) redirect("/sign-in");
  const profile = await db.learnerProfile.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });
  if (!onboarding && !profile.onboardedAt) redirect("/onboarding/legal-credentials");
  return { user, profile };
}

/** Instructor pages: signed-in instructor who finished onboarding. */
export async function requireInstructorPage({ onboarding = false } = {}) {
  const user = await getCurrentUser("INSTRUCTOR");
  if (!user) redirect("/instructor/sign-in");
  const profile = await db.instructorProfile.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });
  if (!onboarding && !profile.onboardedAt) redirect("/instructor/onboarding");
  return { user, profile };
}
