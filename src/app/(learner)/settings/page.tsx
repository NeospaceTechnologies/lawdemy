import type { Metadata } from "next";
import { Topbar } from "@/components/learner/Topbar";
import { AccountSettings } from "@/features/account/AccountSettings";
import { PreferencesSettings } from "@/features/account/PreferencesSettings";
import { SettingsTabs } from "@/features/account/SettingsTabs";
import { requireLearnerPage } from "@/lib/auth/pages";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { user, profile } = await requireLearnerPage();
  const prefs = (user.notificationPrefs ?? {}) as Record<string, boolean>;
  return (
    <>
      <Topbar />
      <SettingsTabs
        initial={(await searchParams).tab === "preferences" ? "preferences" : "account"}
        tabs={[
          {
            id: "account",
            label: "Account",
            content: (
              <AccountSettings
                user={{ firstName: user.firstName, lastName: user.lastName, email: user.email, photoUrl: user.photoAssetId ? `/api/media/${user.photoAssetId}` : null, role: "learner" }}
                supportHref="/support"
                signInHref="/sign-in"
              />
            ),
          },
          {
            id: "preferences",
            label: "Notifications and Preferences",
            content: (
              <PreferencesSettings
                data={{
                  marketingOptIn: user.marketingOptIn,
                  prefs: { courseUpdates: prefs.courseUpdates !== false, qaReplies: prefs.qaReplies !== false, communityReplies: prefs.communityReplies !== false, enrolments: prefs.enrolments !== false },
                  legal: { isLawyer: profile.isLawyer, callYear: profile.callYear, jurisdictions: profile.jurisdictions, practiceAreas: profile.practiceAreas },
                  interests: profile.interests,
                }}
              />
            ),
          },
        ]}
      />
    </>
  );
}
