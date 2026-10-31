import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { fail } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { requireUser } from "@/lib/auth/guard";

// Data export (PRD 9, NDPA): everything we hold about the signed-in user, as JSON.
// Secrets never leave the server: password and PIN hashes, 2FA secrets and full bank
// account numbers are left out. Other people's data is limited to what the user saw.
export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!rateLimit(`export:${user.id}`, 3, 60 * 60_000).ok) return fail(429, "RATE_LIMITED", "You can download your data 3 times an hour.");

  const u = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true, role: true, email: true, firstName: true, lastName: true, emailVerifiedAt: true, marketingOptIn: true, notificationPrefs: true, createdAt: true,
      learnerProfile: { select: { isLawyer: true, callYear: true, jurisdictions: true, practiceAreas: true, interests: true, onboardedAt: true } },
      instructorProfile: { select: { professionalTitle: true, yearsExperience: true, jurisdictions: true, practiceAreas: true, bio: true, links: true, onboardedAt: true } },
      enrollments: { select: { course: { select: { title: true } }, progressPct: true, completedAt: true, createdAt: true, certificate: { select: { verificationCode: true, issuedAt: true } } } },
      quizAttempts: { select: { quiz: { select: { course: { select: { title: true } } } }, scorePct: true, passed: true, status: true, answers: true, marks: true, submittedAt: true } },
      ratings: { select: { course: { select: { title: true } }, stars: true, updatedAt: true } },
      orders: { select: { reference: true, totalKobo: true, refundedKobo: true, status: true, paidAt: true, items: { select: { course: { select: { title: true } }, priceKobo: true, refundedKobo: true } } } },
      cartItems: { select: { course: { select: { title: true } }, createdAt: true } },
      wishlistItems: { select: { course: { select: { title: true } }, createdAt: true } },
      questions: { where: { deletedAt: null }, select: { title: true, body: true, createdAt: true } },
      questionReplies: { where: { deletedAt: null }, select: { body: true, createdAt: true } },
      posts: { where: { deletedAt: null }, select: { kind: true, title: true, body: true, createdAt: true } },
      postReplies: { where: { deletedAt: null }, select: { body: true, createdAt: true } },
      supportTickets: { select: { category: true, message: true, status: true, createdAt: true } },
      notifications: { select: { title: true, body: true, readAt: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 500 },
      courses: { where: { deletedAt: null }, select: { title: true, status: true, createdAt: true, publishedAt: true } },
      wallet: { select: { type: true, amountKobo: true, status: true, reference: true, notes: true, createdAt: true } },
      withdrawals: { select: { reference: true, amountKobo: true, feeKobo: true, status: true, requestedAt: true, completedAt: true } },
      bankAccounts: { where: { deletedAt: null }, select: { bankName: true, accountNumberLast4: true, accountName: true, isDefault: true } },
    },
  });
  if (!u) return fail(404, "NOT_FOUND", "Account not found.");
  await audit({ actorId: user.id, action: "data_exported", targetType: "user", targetId: user.id });

  const body = JSON.stringify({ exportedAt: new Date().toISOString(), note: "Money values are in kobo (₦1 = 100 kobo).", account: u }, null, 2);
  const day = new Date().toISOString().slice(0, 10);
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="lawdemy-data-${day}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
