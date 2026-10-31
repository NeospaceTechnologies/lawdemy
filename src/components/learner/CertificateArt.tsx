import localFont from "next/font/local";
import clsx from "clsx";
import type { CertView } from "@/lib/certificate-data";
import { qrModules } from "@/lib/qr";

const serif = localFont({ src: "../../fonts/PlayfairDisplay-latin.woff2", weight: "400 700", variable: "--font-cert-serif" });
const script = localFont({ src: "../../fonts/GreatVibes-latin.woff2", weight: "400", variable: "--font-cert-script" });

export const certFonts = clsx(serif.variable, script.variable);

/** Scannable link to the public verification page (/verify/[code]). */
function VerifyQr({ url }: { url: string }) {
  const m = qrModules(url);
  const n = m.length;
  return (
    <svg width="44" height="44" viewBox={`-1 -1 ${n + 2} ${n + 2}`} shapeRendering="crispEdges" role="img" aria-label="QR code to verify this certificate">
      <rect x="-1" y="-1" width={n + 2} height={n + 2} fill="#fff" />
      <path d={m.flatMap((row, y) => row.map((on, x) => (on ? `M${x} ${y}h1v1h-1z` : ""))).join("")} fill="#101828" />
    </svg>
  );
}

function Pattern({ small }: { small?: boolean }) {
  if (small) {
    return (
      <svg width="62" height="160" viewBox="0 0 62 160" preserveAspectRatio="none" aria-hidden="true">
        <rect width="31" height="32" fill="#6B3FA0" /><circle cx="31" cy="32" r="31" fill="#FFC21A" />
        <rect y="32" width="31" height="32" fill="#12127A" /><path d="M31 32h31v32z" fill="#F26B1D" /><path d="M31 32v32h31z" fill="#C9B6F2" />
        <rect y="64" width="62" height="32" fill="#FFC21A" /><path d="M0 64l31 32H0z" fill="#F26B1D" /><rect x="31" y="64" width="31" height="32" fill="#B8E6D3" />
        <rect y="96" width="31" height="32" fill="#FFC21A" /><circle cx="62" cy="128" r="31" fill="#17B26A" />
        <rect y="128" width="62" height="32" fill="#111827" /><path d="M0 128l15 32 16-32 15 32 16-32v32H0z" fill="#6B3FA0" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" width="26%" viewBox="0 0 200 400" preserveAspectRatio="xMidYMid slice" className="h-full flex-none">
      <rect width="100" height="80" fill="#6B3FA0" /><circle cx="100" cy="80" r="78" fill="#FFC21A" /><rect x="100" width="100" height="80" fill="#FFC21A" /><path d="M100 0l25 40 25-40 25 40 25-40v80l-25-40-25 40-25-40-25 40z" fill="#F7B500" />
      <rect y="80" width="100" height="80" fill="#12127A" /><path d="M0 80h100L0 160z" fill="#ffffff" /><path d="M100 80l50 40-50 40zM150 80l50 40-50 40z" fill="#F26B1D" /><rect x="100" y="80" width="100" height="80" fill="#C9B6F2" opacity="0.5" />
      <rect y="160" width="100" height="80" fill="#FFC21A" /><path d="M0 160l100 80H0z" fill="#F7B500" /><rect x="100" y="160" width="100" height="80" fill="#B8E6D3" />
      <rect y="240" width="100" height="80" fill="#FFC21A" /><path d="M0 240l25 40 25-40 25 40 25-40v80H0z" fill="#F26B1D" /><circle cx="200" cy="320" r="80" fill="#17B26A" />
      <rect y="320" width="200" height="80" fill="#111827" /><path d="M0 320l25 80 25-80 25 80 25-80 25 80 25-80 25 80 25-80v80H0z" fill="#6B3FA0" />
    </svg>
  );
}

const serifFont = "font-[family-name:var(--font-cert-serif)]";
const scriptFont = "font-[family-name:var(--font-cert-script)]";

export function CertificateThumb({ name }: { name: string }) {
  return (
    <div aria-hidden="true" className={clsx(certFonts, "flex h-40 border-b border-line bg-[linear-gradient(135deg,#F1EDFB_0%,#ffffff_50%)]")}>
      <div className="flex flex-1 flex-col gap-1 px-3 py-3.5">
        <span className={clsx(serifFont, "text-[9px] tracking-[0.06em] text-ink-2")}>CERTIFICATE OF</span>
        <span className={clsx(serifFont, "text-sm font-bold tracking-[0.04em]")}>COMPLETION</span>
        <span className="mt-1 text-[7px] text-muted">This is proudly presented to</span>
        <span className={clsx(scriptFont, "text-xl leading-none")}>{name}</span>
        <span className="mt-1.5 h-[3px] w-4/5 rounded-sm bg-line" />
        <span className="h-[3px] w-[65%] rounded-sm bg-line" />
      </div>
      <Pattern small />
    </div>
  );
}

export function CertificateFull({ c, closing }: { c: CertView; closing: string }) {
  return (
    <figure role="img" aria-label={`Certificate of completion for ${c.learner}`} className={clsx(certFonts, "m-0 flex aspect-[1.42] max-w-[1000px] overflow-hidden rounded-card border border-line shadow-[0_4px_12px_rgba(16,24,40,0.08)]")}>
      <div className="relative flex flex-1 flex-col bg-[linear-gradient(135deg,#F1EDFB_0%,#ffffff_45%)] px-[5%] py-[4.5%]">
        <span aria-hidden="true" className="absolute top-[30%] right-[4%] text-[64px] font-bold text-ink/[0.04]">Lawdemy</span>
        <span className="flex items-center gap-1.5">
          <svg width="14" height="17" viewBox="0 0 22 26" aria-hidden="true"><path d="M2 2h6v16h12v6H5a3 3 0 0 1-3-3z" fill="#0B0B7E" /><circle cx="16" cy="12" r="4.5" fill="#F26B1D" /></svg>
          <span className="text-xs font-bold text-primary">Lawdemy</span>
        </span>
        <span className={clsx(serifFont, "mt-[7%] text-[clamp(11px,1.6vw,18px)] tracking-[0.06em] text-ink-2")}>CERTIFICATE OF</span>
        <span className={clsx(serifFont, "text-[clamp(18px,2.6vw,30px)] font-bold tracking-[0.04em]")}>COMPLETION</span>
        <span className="mt-[5%] text-[clamp(9px,1vw,12px)] text-ink-3">This is proudly presented to</span>
        <span className={clsx(scriptFont, "text-[clamp(26px,4vw,46px)] leading-[1.2]")}>{c.learner}</span>
        <p className="m-0 mt-[3%] max-w-[460px] text-[clamp(9px,1vw,12px)] leading-[1.6] text-ink-2">
          For successfully completing the course <strong>{c.course}</strong> taught by <strong>{c.instructor}{c.instructorTitle ? `, ${c.instructorTitle}` : ""}</strong> and offered by <strong>Lawdemy</strong>, {closing}
        </p>
        <div className="mt-auto flex items-end justify-between gap-4">
          <div className="flex flex-col gap-0.5"><span className={clsx(scriptFont, "text-[22px]")}>{c.instructor.split(" ").map((p, i) => (i === 0 ? `${p[0]}.` : p.toLowerCase())).join("")}</span><span className="text-[10px] text-ink-3">{c.instructor}</span></div>
          <div className="flex flex-col items-center gap-0.5"><span className="text-[10px] text-ink-3">Certificate ID</span><strong className="text-[13px]">{c.code}</strong></div>
          <div className="flex flex-col items-end gap-1"><VerifyQr url={c.verifyUrl} /><span className="text-[10px] text-ink-3">Issued on</span><strong className="text-[13px]">{c.issuedAt}</strong></div>
        </div>
      </div>
      <Pattern />
    </figure>
  );
}
