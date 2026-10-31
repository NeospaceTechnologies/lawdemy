import type { Metadata } from "next";
import { InstructorTopbar } from "@/components/layout/InstructorTopbar";
import { AccountSettings } from "@/features/account/AccountSettings";
import { InstructorAccountSections } from "@/features/account/InstructorSettingsPanels";
import { PreferencesSettings } from "@/features/account/PreferencesSettings";
import { SettingsTabs } from "@/features/account/SettingsTabs";
import { db } from "@/lib/db";
import { requireInstructorPage } from "@/lib/auth/pages";
import { listAccounts } from "@/lib/banking";
import { payments } from "@/lib/payments";

export const metadata: Metadata = { title: "Settings" };
// Older deep links (?tab=payout etc.) land on Account, which holds every section (as drawn).

export default async function InstructorSettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { user, profile } = await requireInstructorPage();
  const [accounts, banks, pin, unread] = await Promise.all([
    listAccounts(user.id),
    payments().listBanks(),
    db.transactionPin.findUnique({ where: { instructorId: user.id }, select: { instructorId: true } }),
    db.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);
  const prefs = (user.notificationPrefs ?? {}) as Record<string, boolean>;
  const tab = (await searchParams).tab;
  const photoUrl = user.photoAssetId ? `/api/media/${user.photoAssetId}` : null;
  return (
    <>
      <InstructorTopbar unread={unread} />
      <SettingsTabs
        initial={tab === "notifications" ? "notifications" : "account"}
        subtitle="Customize your profile, verify your credentials, and set up preferences to get the most out of your instructor experience."
        tabs={[
          {
            id: "account",
            label: "Account",
            content: (
              <AccountSettings user={{ firstName: user.firstName, lastName: user.lastName, email: user.email, photoUrl, role: "instructor" }} supportHref="/instructor/support" signInHref="/instructor/sign-in">
                <InstructorAccountSections
                  background={{ professionalTitle: profile.professionalTitle, yearsExperience: profile.yearsExperience, jurisdictions: profile.jurisdictions, practiceAreas: profile.practiceAreas }}
                  profile={{ bio: profile.bio, photoUrl, links: (profile.links ?? {}) as Record<string, string> }}
                  accounts={accounts}
                  banks={banks}
                  hasPin={!!pin}
                  email={user.email}
                />
              </AccountSettings>
            ),
          },
          {
            id: "notifications",
            label: "Notifications and Preferences",
            content: (
              <PreferencesSettings
                showEnrolments
                data={{ marketingOptIn: user.marketingOptIn, prefs: { courseUpdates: prefs.courseUpdates !== false, qaReplies: prefs.qaReplies !== false, communityReplies: prefs.communityReplies !== false, enrolments: prefs.enrolments !== false }, legal: null, interests: null }}
              />
            ),
          },
        ]}
      />
    </>
  );
}
