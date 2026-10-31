import { PrismaClient, type Prisma } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import { createCipheriv, createHash, randomBytes } from "node:crypto";

// Dev-only staff TOTP secret (see the admin account below).
const DEV_TOTP_SECRET = "JBSWY3DPEHPK3PXP";

// Mirrors src/lib/crypto.ts (dev key) so the seeded bank account decrypts.
function encryptDev(plain: string) {
  const key = process.env.BANK_ENC_KEY ? Buffer.from(process.env.BANK_ENC_KEY, "base64") : createHash("sha256").update("lawdemy-dev-only-key").digest();
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv.toString("base64"), c.getAuthTag().toString("base64"), data.toString("base64")].join(".");
}

// Local development data. Re-running resets the seeded catalogue.
//   Instructor: james@lawdemy.test / Lawdemy#2026 (plus 3 catalogue instructors)
//   Learners:   daniel@lawdemy.test / Lawdemy#2026 (first-time), adaeze@lawdemy.test / Lawdemy#2026 (existing)
const db = new PrismaClient();
const PASSWORD = "Lawdemy#2026";
const DAY = 86400_000;

const CATALOG: { title: string; category: string; level: string; priceNaira: number | null; discount?: number; instructor: number; daysAgo: number }[] = [
  { title: "Introduction to Law in Africa (For most Non-Lawyers)", category: "Law Practice Areas", level: "Beginner", priceNaira: 32900, discount: 25, instructor: 0, daysAgo: 5 },
  { title: "Foundations of Criminal Law", category: "Law Practice Areas", level: "Intermediate", priceNaira: 22900, instructor: 1, daysAgo: 40 },
  { title: "Arbitration in Practice: From Clause to Award", category: "Law Practice Areas", level: "Advanced", priceNaira: 45000, discount: 20, instructor: 3, daysAgo: 12 },
  { title: "Family Law Essentials for Practitioners", category: "Law Practice Areas", level: "Beginner", priceNaira: 18500, instructor: 1, daysAgo: 70 },
  { title: "Legal Writing That Persuades", category: "Legal Skills & Development", level: "Beginner", priceNaira: null, instructor: 0, daysAgo: 3 },
  { title: "Contract Drafting and Negotiation for Corporations", category: "Legal Skills & Development", level: "Intermediate", priceNaira: 27500, instructor: 3, daysAgo: 25 },
  { title: "Advocacy and Courtroom Skills", category: "Legal Skills & Development", level: "Advanced", priceNaira: 39000, instructor: 1, daysAgo: 90 },
  { title: "Legal Framework for Startups and Business Formation", category: "Business, Tech & Compliance", level: "Beginner", priceNaira: 24900, discount: 30, instructor: 0, daysAgo: 8 },
  { title: "Data Protection Law and Policy: From GDPR to the NDPA", category: "Business, Tech & Compliance", level: "Intermediate", priceNaira: 29900, instructor: 2, daysAgo: 15 },
  { title: "Securities Regulation and Corporate Finance Law", category: "Business, Tech & Compliance", level: "Advanced", priceNaira: 52000, instructor: 3, daysAgo: 60 },
  { title: "Tech & IP: Protecting Software and Brands", category: "Business, Tech & Compliance", level: "Intermediate", priceNaira: 26500, instructor: 0, daysAgo: 33 },
  { title: "Human Rights Law in Everyday Life", category: "Cross-Sector & General Interest", level: "Beginner", priceNaira: null, instructor: 1, daysAgo: 2 },
  { title: "Employment Law for Managers", category: "Cross-Sector & General Interest", level: "Beginner", priceNaira: 15900, instructor: 2, daysAgo: 45 },
  { title: "Understanding Your Tenancy Rights", category: "Cross-Sector & General Interest", level: "Beginner", priceNaira: 9900, discount: 15, instructor: 0, daysAgo: 20 },
  { title: "Climate Litigation and Environmental Justice", category: "International & Emerging Fields", level: "Advanced", priceNaira: 34900, instructor: 2, daysAgo: 6 },
  { title: "AI, Big Data & Data Privacy", category: "International & Emerging Fields", level: "Intermediate", priceNaira: 31000, instructor: 1, daysAgo: 18 },
  { title: "International Trade Law and the AfCFTA", category: "International & Emerging Fields", level: "Advanced", priceNaira: 41500, instructor: 0, daysAgo: 50 },
  { title: "Legal Tech for Modern Practice", category: "International & Emerging Fields", level: "Beginner", priceNaira: 19900, instructor: 2, daysAgo: 10 },
];

const MODULES = [
  ["Course Introduction", "Key Concepts and Sources of Law", "How the Courts Are Organised"],
  ["Core Principles", "Reading a Judgment", "Common Pitfalls"],
  ["Applying the Law", "Case Study Walkthrough", "Practical Checklist"],
];

function writeUp(title: string) {
  return `<p>In this lesson we look at ${title.toLowerCase()} and why it matters in practice across African jurisdictions.</p><ul><li>What the rule is</li><li>Where it comes from</li><li>How courts apply it</li></ul><blockquote>Tip: note the key terms as you go; the final quiz draws on them.</blockquote>`;
}

async function user(email: string, role: "LEARNER" | "INSTRUCTOR" | "ADMIN", firstName: string, lastName: string, passwordHash: string, extra: Partial<Prisma.UserCreateInput> = {}) {
  return db.user.upsert({
    where: { email_role: { email, role } },
    update: {},
    create: { email, role, firstName, lastName, passwordHash, emailVerifiedAt: new Date(), ...extra },
  });
}

async function main() {
  const passwordHash = await hash(PASSWORD, { memoryCost: 19456, timeCost: 2, parallelism: 1 });

  const james = await user("james@lawdemy.test", "INSTRUCTOR", "James", "Adeniola", passwordHash, {
    instructorProfile: {
      create: {
        professionalTitle: "Senior Advocate of Nigeria",
        yearsExperience: 22,
        jurisdictions: ["Nigeria"],
        practiceAreas: ["Corporate & Commercial", "Litigation & Dispute Resolution"],
        bio: "Senior Advocate with two decades of commercial litigation experience and a part-time lecturer.",
        onboardedAt: new Date(),
      },
    },
  });
  await db.instructorProfile.updateMany({ where: { userId: james.id, onboardedAt: null }, data: { onboardedAt: new Date() } });

  const people = [
    ["segun@lawdemy.test", "Segun", "Bello"],
    ["linda@lawdemy.test", "Linda", "Ekubo"],
    ["amaka@lawdemy.test", "Amaka", "Okafor"],
  ] as const;
  const instructors = [];
  for (const [email, f, l] of people) {
    instructors.push(
      await user(email, "INSTRUCTOR", f, l, passwordHash, {
        instructorProfile: { create: { professionalTitle: "Legal Consultant", yearsExperience: 12, jurisdictions: ["Nigeria"], practiceAreas: ["Corporate & Commercial"], bio: `${f} teaches practical law for professionals.`, onboardedAt: new Date() } },
      }),
    );
  }

  // Staff 2FA with a fixed dev-only TOTP secret so local testing can generate codes
  // (any authenticator app, or `node -e` with src/lib/auth/totp.ts). Never reuse in production.
  const admin = await user("admin@lawdemy.test", "ADMIN", "Ngozi", "Reviewer", passwordHash);
  await db.user.update({ where: { id: admin.id }, data: { totpSecretEnc: encryptDev(DEV_TOTP_SECRET), totpEnabledAt: new Date() } });

  const daniel = await user("daniel@lawdemy.test", "LEARNER", "Daniel", "John", passwordHash, {
    learnerProfile: { create: { isLawyer: false, interests: ["Data Privacy", "Human Rights"], onboardedAt: new Date() } },
  });
  const adaeze = await user("adaeze@lawdemy.test", "LEARNER", "Adaeze", "Nwosu", passwordHash, {
    learnerProfile: { create: { isLawyer: true, callYear: 2019, jurisdictions: ["Nigeria"], practiceAreas: ["Corporate & Commercial"], interests: ["Corporate Law", "Contract Drafting"], onboardedAt: new Date() } },
  });
  const crowd = [];
  for (let i = 1; i <= 6; i++) {
    crowd.push(await user(`learner${i}@lawdemy.test`, "LEARNER", ["Tunde", "Ngozi", "Ifeoma", "Kofi", "Zainab", "Musa"][i - 1], "Learner", passwordHash, { learnerProfile: { create: { onboardedAt: new Date() } } }));
  }

  instructors.push(james);
  // Reset the seeded catalogue. Courses James created by hand are kept unless the seed
  // runs with --fresh (npm run db:seed -- --fresh), which resets him to the demo state too.
  const fresh = process.argv.includes("--fresh");
  const seededInstructorIds = instructors.map((i) => i.id);
  const old = await db.course.findMany({
    where: fresh
      ? { instructorId: { in: seededInstructorIds } }
      : { OR: [{ instructorId: { in: seededInstructorIds.filter((id) => id !== james.id) } }, { instructorId: james.id, title: { in: CATALOG.map((c) => c.title) } }] },
    select: { id: true },
  });
  const oldIds = old.map((o) => o.id);
  await db.walletTransaction.deleteMany({ where: { OR: [{ orderItem: { courseId: { in: oldIds } } }, { instructorId: james.id, type: "BONUS" }] } });
  await db.question.deleteMany({ where: { lesson: { module: { courseId: { in: oldIds } } } } });
  await db.post.deleteMany({ where: { courseId: { in: oldIds } } });
  await db.orderItem.deleteMany({ where: { courseId: { in: oldIds } } });
  await db.certificate.deleteMany({ where: { enrollment: { courseId: { in: oldIds } } } });
  await db.enrollment.deleteMany({ where: { courseId: { in: oldIds } } });
  await db.course.deleteMany({ where: { id: { in: oldIds } } });
  if (fresh) {
    // Withdrawals made while testing: ledger rows first (they reference the withdrawal).
    await db.walletTransaction.deleteMany({ where: { instructorId: james.id, type: "WITHDRAWAL" } });
    await db.withdrawal.deleteMany({ where: { instructorId: james.id } });
  }

  const courses = [];
  for (const [ci, c] of CATALOG.entries()) {
    const publishedAt = new Date(Date.now() - c.daysAgo * DAY);
    const course = await db.course.create({
      data: {
        instructorId: instructors[c.instructor].id,
        title: c.title,
        subtitle: "A practical, plain-language course with real examples.",
        description: `${c.title} gives you a clear, practical grounding: where the rules come from, how courts apply them, and what they mean day to day.\n\nYou’ll compare common-law, civil-law and customary approaches and finish with a checklist you can use straight away.`,
        outcomes: "Explain the core principles\nRead and summarise a judgment\nSpot the legal issues in a real scenario",
        category: c.category,
        level: c.level,
        durationSeconds: (2 + (ci % 4)) * 3600,
        access: c.priceNaira ? "PAID" : "FREE",
        priceKobo: c.priceNaira ? c.priceNaira * 100 : null,
        discountPct: c.discount ?? null,
        discountEndsAt: c.discount ? new Date(Date.now() + (1 + (ci % 5)) * DAY) : null,
        hasCertificate: true,
        status: "LIVE",
        wizardStep: 3,
        submittedAt: publishedAt,
        publishedAt,
        decisions: { create: { decision: "approved", decidedAt: publishedAt } },
        modules: {
          create: MODULES.map((lessons, mi) => ({
            id: `seed-${ci}-m${mi}`,
            title: ["Introduction", "Core Principles", "In Practice"][mi],
            position: mi,
            lessons: {
              create: lessons.map((t, li) => ({
                id: `seed-${ci}-m${mi}-l${li}`,
                title: t,
                position: li,
                writeUp: writeUp(t),
                durationSeconds: (2 + li * 3) * 60,
                durationFormat: "MINUTES_SECONDS" as const,
                isPreview: mi === 0 && li === 0,
              })),
            },
          })),
        },
        quiz: {
          create: {
            title: `${c.title.split(":")[0]}: Final Quiz`,
            instructions: "Answer all questions. You need 70% to earn your certificate.",
            questions: {
              create: [
                { id: `seed-${ci}-q1`, type: "MC", position: 0, prompt: "Which court is usually the final court of appeal?", options: [{ text: "The Supreme Court", correct: true }, { text: "A magistrate court", correct: false }, { text: "A customary court", correct: false }], feedback: "Most African legal systems place the Supreme Court at the top of the hierarchy." },
                { id: `seed-${ci}-q2`, type: "TF", position: 1, prompt: "Customary law can apply alongside statute law.", options: [{ text: "True", correct: true }, { text: "False", correct: false }], feedback: "Many jurisdictions recognise customary law where it is not repugnant to statute." },
                { id: `seed-${ci}-q3`, type: "MC", position: 2, prompt: "What is the binding part of a judgment called?", options: [{ text: "Obiter dictum", correct: false }, { text: "Ratio decidendi", correct: true }], feedback: "The ratio is the legal principle the decision rests on." },
                { id: `seed-${ci}-q4`, type: "SHORT", position: 3, prompt: "In one sentence, what makes an agreement legally binding?", options: [], modelAnswer: "Offer, acceptance, consideration and an intention to create legal relations.", feedback: "Look for all four elements; missing any one usually means there is no contract." },
              ],
            },
          },
        },
      },
    });
    courses.push(course);
  }

  // Enrolments: crowd learners make the first courses "Trending".
  const enroll = async (learnerId: string, courseId: string, daysAgo: number) =>
    db.enrollment.upsert({ where: { courseId_learnerId: { courseId, learnerId } }, update: {}, create: { courseId, learnerId, createdAt: new Date(Date.now() - daysAgo * DAY), lastActiveAt: new Date(Date.now() - daysAgo * DAY) } });
  for (const [i, l] of crowd.entries()) {
    for (const c of courses.slice(0, 4 + (i % 3))) await enroll(l.id, c.id, i % 10);
  }

  // Adaeze: three courses in progress, one complete.
  const lessonIds = async (courseId: string) =>
    (await db.lesson.findMany({ where: { module: { courseId } }, orderBy: [{ module: { position: "asc" } }, { position: "asc" }], select: { id: true } })).map((l) => l.id);
  for (const [k, c] of [courses[5], courses[8], courses[9], courses[1]].entries()) {
    const e = await enroll(adaeze.id, c.id, 10 - k);
    const ids = await lessonIds(c.id);
    const doneCount = k === 3 ? ids.length : [4, 5, 7][k];
    for (const id of ids.slice(0, doneCount)) {
      await db.lessonProgress.upsert({ where: { enrollmentId_lessonId: { enrollmentId: e.id, lessonId: id } }, update: {}, create: { enrollmentId: e.id, lessonId: id, completedAt: new Date(Date.now() - k * DAY), positionSeconds: 60 } });
    }
    await db.enrollment.update({
      where: { id: e.id },
      data: { progressPct: Math.round((doneCount / ids.length) * 100), currentLessonId: ids[Math.min(doneCount, ids.length - 1)], completedAt: k === 3 ? new Date(Date.now() - 2 * DAY) : null, lastActiveAt: new Date(Date.now() - k * 3600_000) },
    });
    if (k === 3) {
      const quiz = await db.quiz.findUnique({ where: { courseId: c.id } });
      if (quiz) await db.quizAttempt.create({ data: { quizId: quiz.id, learnerId: adaeze.id, scorePct: 100, passed: true, answers: {} } });
      await db.certificate.upsert({ where: { enrollmentId: e.id }, update: {}, create: { enrollmentId: e.id, verificationCode: `LWD-${c.id.slice(-6).toUpperCase()}`, variant: "lawyer" } });
    }
  }

  // Paid orders on James's courses so Earnings has a ledger: older ones cleared, recent ones pending.
  const jamesCourses = courses.filter((c) => c.instructorId === james.id);
  let n = 0;
  for (const [i, l] of crowd.entries()) {
    const course = jamesCourses[i % jamesCourses.length];
    const paidAt = new Date(Date.now() - (i < 3 ? 20 + i : i) * DAY);
    const price = course.discountPct && course.discountEndsAt && course.discountEndsAt > new Date() ? Math.round(((course.priceKobo ?? 0) * (100 - course.discountPct)) / 100) : course.priceKobo ?? 0;
    const fee = Math.round(price * 0.2);
    const order = await db.order.create({ data: { learnerId: l.id, reference: `SEED-${course.id.slice(-4)}-${i}`, totalKobo: price, status: "PAID", provider: "mock", paidAt, createdAt: paidAt, items: { create: { courseId: course.id, priceKobo: price, platformFeeKobo: fee, instructorShareKobo: price - fee } } }, include: { items: true } });
    await db.enrollment.upsert({ where: { courseId_learnerId: { courseId: course.id, learnerId: l.id } }, update: { orderId: order.id }, create: { courseId: course.id, learnerId: l.id, orderId: order.id, createdAt: paidAt } });
    const available = paidAt.getTime() + 7 * DAY < Date.now();
    await db.walletTransaction.create({ data: { instructorId: james.id, type: "ENROLLMENT", amountKobo: price - fee, status: available ? "AVAILABLE" : "PENDING", reference: `ENR-SEED-${course.id.slice(-4)}-${i}`, availableAt: new Date(paidAt.getTime() + 7 * DAY), orderItemId: order.items[0].id, notes: `${l.firstName} enrolled in ${course.title}`, createdAt: paidAt } });
    await db.courseRating.upsert({ where: { courseId_learnerId: { courseId: course.id, learnerId: l.id } }, update: {}, create: { courseId: course.id, learnerId: l.id, stars: i % 3 === 0 ? 4 : 5 } });
    n += 1;
  }
  await db.walletTransaction.create({ data: { instructorId: james.id, type: "BONUS", amountKobo: 500000, status: "AVAILABLE", reference: `BON-SEED-${Date.now().toString(36)}`, notes: "Launch partner bonus", createdAt: new Date(Date.now() - 10 * DAY) } });
  const firstLesson = await db.lesson.findFirst({ where: { module: { courseId: jamesCourses[0].id } }, orderBy: [{ module: { position: "asc" } }, { position: "asc" }] });
  if (firstLesson) {
    await db.question.create({ data: { lessonId: firstLesson.id, authorId: crowd[0].id, title: "Which court enforces a foreign arbitral award?", body: "The lesson mentions the New York Convention. In Nigeria, do I apply to the Federal High Court or the State High Court?" } });
  }
  // A final-quiz attempt with a written answer waiting for James to mark.
  const quiz = await db.quiz.findUnique({ where: { courseId: jamesCourses[0].id }, include: { questions: { orderBy: { position: "asc" } } } });
  if (quiz) {
    const answers = Object.fromEntries(
      quiz.questions.map((q) => [q.id, q.type === "SHORT" ? "Offer and acceptance, backed by consideration." : (q.options as { correct: boolean }[]).findIndex((o) => o.correct)]),
    );
    await db.quizAttempt.deleteMany({ where: { quizId: quiz.id, learnerId: crowd[0].id } });
    await db.quizAttempt.create({ data: { quizId: quiz.id, learnerId: crowd[0].id, scorePct: 75, passed: false, status: "awaiting_review", answers } });
  }

  // Community discussions so the Community pages aren't empty in the demo.
  const DISCUSSIONS: { by: typeof james; title: string; body: string; hoursAgo: number; replies: [typeof james, string][] }[] = [
    { by: crowd[1], title: "How relevant is Natural Law in today’s legal system?", body: "I’ve been reflecting on the Natural Law theorists we discussed in Module 1. Do you think Natural Law still holds weight in modern constitutional frameworks, or has it become more of a historical foundation than a living theory?", hoursAgo: 3, replies: [[james, "It still shapes how courts read fundamental rights provisions. Look at how the Supreme Court reasons about the right to life."], [crowd[2], "Agreed. It’s more alive in human rights litigation than people assume."]] },
    { by: crowd[3], title: "Struggling with Dworkin’s interpretivism", body: "Can anyone help clarify Dworkin’s “law as integrity” concept? I understand the basics, but I’m confused about how it practically differs from legal positivism.", hoursAgo: 60, replies: [] },
    { by: james, title: "Common mistakes in student contracts", body: "Here are the top 3 errors I noticed in the last assignment: undefined terms, missing termination clauses and vague payment schedules. Sharing them here so we can collectively learn.", hoursAgo: 48, replies: [[crowd[4], "The termination clause one caught me out. Thanks for sharing."]] },
  ];
  await db.post.deleteMany({ where: { kind: "discussion", title: { in: DISCUSSIONS.map((d) => d.title) } } });
  for (const d of DISCUSSIONS) {
    const createdAt = new Date(Date.now() - d.hoursAgo * 3600 * 1000);
    const post = await db.post.create({ data: { authorId: d.by.id, kind: "discussion", title: d.title, body: d.body, createdAt } });
    for (const [i, [who, body]] of d.replies.entries()) {
      await db.postReply.create({ data: { postId: post.id, authorId: who.id, body, createdAt: new Date(createdAt.getTime() + (i + 1) * 3600 * 1000) } });
    }
  }

  // A verified payout account (past the 24 h hold) and transaction PIN 2580.
  if (!(await db.bankAccount.count({ where: { instructorId: james.id, deletedAt: null } }))) {
    await db.bankAccount.create({ data: { instructorId: james.id, bankCode: "044", bankName: "Access Bank", accountNumberLast4: "4251", accountNumberEncrypted: encryptDev("0123454251"), accountName: "JAMES ADENIOLA", isDefault: true, verifiedAt: new Date(Date.now() - 3 * DAY) } });
  }
  const pinHash = await hash("2580", { memoryCost: 19456, timeCost: 2, parallelism: 1 });
  await db.transactionPin.upsert({ where: { instructorId: james.id }, update: { pinHash, failedAttempts: 0, lockedUntil: null }, create: { instructorId: james.id, pinHash } });
  console.log(`Seeded ${n} paid enrolments, a bonus, Access Bank ••••4251 and PIN 2580 for James.`);

  await db.notification.deleteMany({ where: { userId: { in: [daniel.id, adaeze.id] } } });
  await db.notification.createMany({
    data: [
      { userId: adaeze.id, type: "course_update", title: "Segun Bello", body: "has added a new module to Foundations of Criminal Law", link: `/courses/${courses[1].id}` },
      { userId: adaeze.id, type: "quiz_pending", title: "You", body: "have a pending quiz to complete in Contract Drafting.", link: `/learn/${courses[5].id}` },
      { userId: daniel.id, type: "course_update", title: "Welcome to Lawdemy", body: "Browse courses picked for your interests.", link: "/recommended" },
    ],
  });

  console.log(`Seeded ${courses.length} live courses. Accounts (password ${PASSWORD}):`);
  console.log("  instructor james@lawdemy.test · learners daniel@lawdemy.test (new), adaeze@lawdemy.test (existing) · staff admin@lawdemy.test (/admin, TOTP secret JBSWY3DPEHPK3PXP)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
