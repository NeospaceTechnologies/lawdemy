import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Split auth screen: photo panel on the left, form on the right with a soft
 * purple glow (Inst-SignIn, Reset-*). Stacks on small screens.
 */
export function AuthLayout({
  heroAlt,
  heroTitle,
  heroBody,
  heroColor = "#3A2A12",
  topLink,
  children,
}: {
  /** Placeholder until real photography arrives (PRD 3: images are placeholders). */
  heroAlt: string;
  heroTitle: string;
  heroBody?: string;
  heroColor?: string;
  topLink?: { prompt: string; label: string; href: string };
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-wrap bg-white">
      <div className="flex min-h-[320px] flex-[1_1_420px] flex-col justify-between p-8" style={{ background: heroColor }} role="img" aria-label={heroAlt}>
        <div aria-hidden="true" className="self-start rounded-md border border-dashed border-[rgba(245,230,211,0.5)] px-2.5 py-1.5 text-xs text-[#F5E6D3]">
          [Hero photo: {heroAlt}]
        </div>
        <div className="flex max-w-[360px] flex-col gap-2">
          <p className="m-0 text-[22px] leading-[1.3] font-semibold text-white">{heroTitle}</p>
          {heroBody && <p className="m-0 text-[13px] leading-normal text-[#F5E6D3]">{heroBody}</p>}
        </div>
      </div>
      <div className="flex flex-[1.25_1_480px] flex-col bg-[radial-gradient(circle_at_0%_0%,#EEEBFF_0%,#ffffff_38%)] px-4 pt-7 pb-12 sm:px-12">
        {topLink && (
          <div className="flex justify-end gap-1 text-[13px] text-ink-3">
            {topLink.prompt}{" "}
            <Link href={topLink.href} className="font-semibold underline">
              {topLink.label}
            </Link>
          </div>
        )}
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
