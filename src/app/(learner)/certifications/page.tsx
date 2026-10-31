import type { Metadata } from "next";
import Link from "next/link";
import { Topbar } from "@/components/learner/Topbar";
import { CertificateThumb } from "@/components/learner/CertificateArt";
import { buttonClass } from "@/components/ui/Button";
import { AwardIcon, CalendarIcon, DownloadIcon } from "@/components/ui/icons";
import { requireLearnerPage } from "@/lib/auth/pages";
import { certificatesFor } from "@/lib/certificate-data";

export const metadata: Metadata = { title: "Certifications" };

export default async function CertificationsPage() {
  const { user } = await requireLearnerPage();
  const certs = await certificatesFor(user.id);
  return (
    <>
      <Topbar />
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-[30px] font-bold tracking-[-0.01em]">Certifications</h1>
        <p className="m-0 text-sm text-ink-3">All your completed certificates in one place.</p>
      </div>
      {certs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex h-[52px] w-[52px] items-center justify-center rounded-card border-[1.5px] border-primary bg-[#F4F4FD] text-primary"><AwardIcon size={24} /></span>
          <h2 className="m-0 text-[17px] font-semibold">No Certificates Yet</h2>
          <p className="m-0 max-w-[380px] text-[13px] leading-normal text-ink-3">Complete a course and pass the final assessment to unlock your certificate of completion.</p>
          <Link href="/courses" className={buttonClass("primary", "md", "h-10 px-5")}>Browse Courses</Link>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
          {certs.map((c) => (
            <article key={c.id} className="flex flex-col overflow-hidden rounded-card border border-line bg-white shadow-[0_1px_3px_rgba(16,24,40,0.08)]">
              <CertificateThumb name={c.learner} />
              <div className="flex flex-col gap-2 p-3">
                <h2 className="m-0 text-[15px] leading-[1.35] font-semibold">{c.course}</h2>
                <span className="flex items-center gap-1.5 text-xs text-ink-3"><CalendarIcon size={12} />Date Issued: <strong className="text-ink">{c.issuedAt}</strong></span>
                <span className="flex items-center gap-1.5 text-xs text-ink-3"><AwardIcon size={12} />Instructor: <strong className="text-ink">{c.instructor}</strong></span>
                <Link href={`/certifications/${c.id}`} className={buttonClass("primary", "md", "mt-1 h-10")}>Download <DownloadIcon size={14} /></Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
