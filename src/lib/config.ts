// Business values the PRD leaves open (section 7.1 / 13). Each is a placeholder
// until the team decides; change them here, never inline.
export const BUSINESS = {
  /** Lawdemy commission per sale. Open question 1. */
  platformFeePct: Number(process.env.PLATFORM_FEE_PCT ?? 20),
  /** Days an enrolment earning stays Pending before it becomes Available. Suggested 7. */
  pendingDays: Number(process.env.PENDING_DAYS ?? 7),
  /** Flat withdrawal charge in kobo (₦20 illustrative in the designs). */
  withdrawalFeeKobo: Number(process.env.WITHDRAWAL_FEE_KOBO ?? 2000),
  /** Minimum withdrawal in kobo (₦1,000 in the designs). */
  minWithdrawalKobo: 100_000,
  /** Final quiz pass mark for a certificate. Suggested 70%. */
  quizPassPct: Number(process.env.QUIZ_PASS_PCT ?? 70),
  /** Withdrawals are held this long after a bank account is added or changed (PRD 7.1 / 9). */
  bankChangeHoldMs: 24 * 3600_000,
  /** Announcements expire this many days after publishing. Suggested 30. */
  announcementDays: 30,
  /** Max announcements per course per calendar month (WAT). */
  announcementsPerMonth: 4,
  /** Withdrawals above this need staff approval before the transfer starts (PRD 9; ₦500,000 suggested). */
  withdrawalApprovalKobo: Number(process.env.WITHDRAWAL_APPROVAL_KOBO ?? 50_000_000),
  /** A course counts as "New" for this many days after going live. */
  newCourseDays: 30,
} as const;
