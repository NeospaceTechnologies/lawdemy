import type { ReactNode } from "react";

/** Inline error banner for auth forms (network failures, lockout, wrong credentials). */
export function FormBanner({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="rounded-control border border-[#FECDCA] bg-[#FEF3F2] px-3.5 py-3 text-[13px] leading-normal text-danger-text">
      {children}
    </div>
  );
}
