import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";

/** Issues a certificate once the course is complete (all lessons + passed quiz), if the course offers one (LRN-CERT-02). */
export async function issueIfEligible(enrollmentId: string) {
  const e = await db.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { certificate: true, course: { select: { title: true, hasCertificate: true } }, learner: { select: { learnerProfile: { select: { isLawyer: true } } } } },
  });
  if (!e || !e.completedAt || !e.course.hasCertificate || e.certificate) return e?.certificate ?? null;
  const cert = await db.certificate.create({
    data: {
      enrollmentId,
      verificationCode: `LWD-${randomBytes(4).toString("hex").toUpperCase()}`,
      variant: e.learner.learnerProfile?.isLawyer ? "lawyer" : "non_lawyer",
    },
  });
  await notify(e.learnerId, { type: "certificate", title: "Certificate earned", body: `Congratulations! You completed ${e.course.title}.`, link: `/certifications/${cert.id}` });
  return cert;
}
