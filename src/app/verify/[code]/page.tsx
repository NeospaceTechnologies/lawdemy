import type { Metadata } from "next";
import { CertificateFull } from "@/components/learner/CertificateArt";
import { Logo } from "@/components/ui/Logo";
import { SuccessBadge } from "@/components/ui/Onboarding";
import { certificateByCode, closingLine } from "@/lib/certificate-data";

export const metadata: Metadata = { title: "Verify a certificate" };

// Public certificate verification (PRD 10, Certificates).
export default async function VerifyCertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const c = await certificateByCode(decodeURIComponent((await params).code));
  return (
    <div className="mx-auto flex min-h-screen max-w-[1040px] flex-col gap-6 px-4 py-8">
      <Logo />
      {c ? (
        <>
          <div className="flex items-center gap-4">
            <SuccessBadge size={56} />
            <div className="flex flex-col gap-1">
              <h1 className="m-0 text-2xl font-semibold">Verified certificate</h1>
              <p className="m-0 text-sm text-ink-3">{c.learner} completed “{c.course}” on Lawdemy on {c.issuedAt}. Certificate ID {c.code}.</p>
            </div>
          </div>
          <CertificateFull c={c} closing={closingLine(c.lawyer)} />
        </>
      ) : (
        <div className="flex flex-col gap-2">
          <h1 className="m-0 text-2xl font-semibold">Certificate not found</h1>
          <p className="m-0 text-sm text-ink-3">We couldn’t find a certificate with that ID. Check the code and try again.</p>
        </div>
      )}
    </div>
  );
}
