import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "./session";

// Layout and page both run these guards; share the profile lookup within one render.
const learnerProfile = cache((userId: string) => db.learnerProfile.upsert({ where: { userId }, update: {}, create: { userId } }));
const instructorProfile = cache((userId: string) => db.instructorProfile.upsert({ where: { userId }, update: {}, create: { userId } }));

/** Learner pages: signed-in, verified learner. Onboarding pages pass `onboarding: true`. */
export async function requireLearnerPage({ onboarding = false } = {}) {
  const user = await getCurrentUser("LEARNER");
  if (!user) redirect("/sign-in");
  const profile = await learnerProfile(user.id);
  if (!onboarding && !profile.onboardedAt) redirect("/onboarding/legal-credentials");
  return { user, profile };
}

/** Instructor pages: signed-in instructor who finished onboarding. */
export async function requireInstructorPage({ onboarding = false } = {}) {
  const user = await getCurrentUser("INSTRUCTOR");
  if (!user) redirect("/instructor/sign-in");
  const profile = await instructorProfile(user.id);
  if (!onboarding && !profile.onboardedAt) redirect("/instructor/onboarding");
  return { user, profile };
}
