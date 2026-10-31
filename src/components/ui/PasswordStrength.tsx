"use client";
import clsx from "clsx";
import { checkPassword, passwordStrength, type PasswordRole } from "@/lib/auth/password-rules";
import { CheckIcon, CircleIcon } from "./icons";

const BAR = ["", "bg-danger", "bg-warning", "bg-success-light", "bg-success"];

/**
 * Strength meter + rule checklist (Reset-NewPassword, sign-up). Passed rules turn
 * green; after `showErrors` failing rules turn red (PRD 4.1 acceptance criteria).
 */
export function PasswordStrength({ password, role, showErrors = false, id }: { password: string; role: PasswordRole; showErrors?: boolean; id?: string }) {
  const { results, common } = checkPassword(password, role);
  const strength = passwordStrength(password, role);
  return (
    <div id={id} className="flex flex-col gap-2">
      <div className="flex items-center gap-2" aria-hidden={!password}>
        <div className="grid flex-1 grid-cols-4 gap-1">
          {[1, 2, 3, 4].map((n) => (
            <span key={n} className={clsx("h-1 rounded-full", n <= strength.score ? BAR[strength.score] : "bg-line")} />
          ))}
        </div>
        <span className="w-12 text-right text-xs font-medium text-ink-3" aria-live="polite">
          {strength.label}
        </span>
      </div>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-[13px]" aria-label="Password requirements">
        {results.map((r) => (
          <li key={r.id} className={clsx("flex items-center gap-2", r.ok ? "text-success" : showErrors && password ? "text-danger-text" : "text-muted")}>
            {r.ok ? <CheckIcon /> : <CircleIcon className={showErrors && password ? "text-danger" : "text-placeholder"} />}
            {r.label}
            <span className="sr-only">{r.ok ? "(met)" : "(not met)"}</span>
          </li>
        ))}
        {common && (
          <li className="flex items-center gap-2 text-danger-text" role="alert">
            <CircleIcon className="text-danger" />
            This password is too common
          </li>
        )}
      </ul>
    </div>
  );
}
