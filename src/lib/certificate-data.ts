import "server-only";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/email";

export type CertView = {
  id: string;
  code: string;
  learner: string;
  course: string;
  instructor: string;
  instructorTitle: string | null;
  issuedAt: string;
  lawyer: boolean;
  verifyUrl: string;
};

const include = {
  enrollment: {
    include: {
      learner: { select: { firstName: true, lastName: true } },
      course: { select: { title: true, instructor: { select: { firstName: true, lastName: true, instructorProfile: { select: { professionalTitle: true } } } } } },
    },
  },
} as const;

function view(c: NonNullable<Awaited<ReturnType<typeof findOne>>>): CertView {
  const e = c.enrollment;
  return {
    id: c.id,
    code: c.verificationCode,
    learner: `${e.learner.firstName} ${e.learner.lastName}`,
    course: e.course.title,
    instructor: `${e.course.instructor.firstName} ${e.course.instructor.lastName}`,
    instructorTitle: e.course.instructor.instructorProfile?.professionalTitle ?? null,
    issuedAt: c.issuedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" }),
    lawyer: c.variant === "lawyer",
    verifyUrl: appUrl(`/verify/${c.verificationCode}`),
  };
}

function findOne(where: { id?: string; verificationCode?: string }) {
  return db.certificate.findFirst({ where, include });
}

export async function certificatesFor(learnerId: string) {
  const rows = await db.certificate.findMany({ where: { enrollment: { learnerId } }, orderBy: { issuedAt: "desc" }, include });
  return rows.map(view);
}

export async function certificateFor(id: string, learnerId: string) {
  const c = await findOne({ id });
  return c && c.enrollment.learnerId === learnerId ? view(c) : null;
}

export async function certificateByCode(code: string) {
  const c = await findOne({ verificationCode: code });
  return c ? view(c) : null;
}

export function closingLine(lawyer: boolean) {
  // PRD 3: certificates state completion only; no CLE/CPD accreditation claim in v1.
  return lawyer
    ? "in recognition of their commitment to Continuing Legal Education and professional growth."
    : "in recognition of their commitment to continuous learning and professional development.";
}
