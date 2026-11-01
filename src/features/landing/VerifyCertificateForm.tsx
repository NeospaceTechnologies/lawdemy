"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass } from "@/components/ui/Button";

/** Sends anyone (employer, client, regulator) to the public verification page for a certificate ID. */
export function VerifyCertificateForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const trimmed = code.trim().toUpperCase();

  return (
    <form
      className="flex w-full flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        if (trimmed) router.push(`/verify/${encodeURIComponent(trimmed)}`);
      }}
    >
      <label htmlFor="verify-code" className="sr-only">
        Certificate ID
      </label>
      <input
        id="verify-code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Certificate ID, e.g. LWD-8F2K1Q"
        autoComplete="off"
        className="h-11 w-full min-w-0 shrink-0 rounded-control sm:w-auto sm:flex-1 border border-white/25 bg-white/10 px-3.5 text-sm text-white placeholder:text-white/60 focus:border-white focus:outline-none"
      />
      <button type="submit" disabled={!trimmed} className={buttonClass("outline", "lg", "border-white! bg-white! disabled:opacity-60")}>
        Verify certificate
      </button>
    </form>
  );
}
