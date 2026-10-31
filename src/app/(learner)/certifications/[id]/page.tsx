import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/learner/Topbar";
import { CertificateFull } from "@/components/learner/CertificateArt";
import { CertificateActions } from "@/features/certs/CertificateActions";
import { appUrl } from "@/lib/email";
import { requireLearnerPage } from "@/lib/auth/pages";
import { certificateFor, closingLine } from "@/lib/certificate-data";

export const metadata: Metadata = { title: "Certificate preview" };

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireLearnerPage();
  const c = await certificateFor((await params).id, user.id);
  if (!c) notFound();
  return (
    <>
      <Topbar back="/certifications" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 text-[26px] font-semibold">Certificate Preview</h1>
        <CertificateActions id={c.id} verifyUrl={appUrl(`/verify/${c.code}`)} />
      </div>
      <CertificateFull c={c} closing={closingLine(c.lawyer)} />
    </>
  );
}
