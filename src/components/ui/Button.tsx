import { forwardRef, type ButtonHTMLAttributes } from "react";
import Link, { type LinkProps } from "next/link";
import clsx from "clsx";

export type ButtonVariant = "primary" | "outline" | "danger" | "ghost" | "link";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-control font-semibold no-underline transition-colors disabled:cursor-not-allowed";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover hover:text-white disabled:bg-primary-disabled",
  outline: "border border-primary bg-white text-primary hover:bg-surface hover:text-primary-hover disabled:border-primary-disabled disabled:text-primary-disabled",
  danger: "bg-danger text-white hover:bg-danger-text hover:text-white disabled:opacity-50",
  ghost: "bg-transparent text-ink-2 hover:bg-surface",
  link: "h-auto! px-0! bg-transparent text-primary underline hover:text-primary-hover",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-[38px] px-3.5 text-[13px]",
  lg: "h-11 px-[18px] text-sm",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "lg", className?: string) {
  return clsx(base, variants[variant], sizes[size], className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows the busy label (e.g. "Saving…") and blocks clicks. */
  busy?: boolean;
  busyLabel?: string;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "lg", busy, busyLabel, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={clsx(buttonClass(variant, size, className), busy && variant === "primary" && "disabled:bg-primary-hover")}
      {...rest}
    >
      {busy && busyLabel ? busyLabel : children}
    </button>
  );
});

type ButtonLinkProps = LinkProps & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
};

export function ButtonLink({ variant = "primary", size = "lg", className, ...rest }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}

/** Square icon-only button (delete, edit, close). Always pass aria-label. */
export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "neutral" | "danger" | "outline" | "plain"; size?: number; "aria-label": string }
>(function IconButton({ tone = "plain", size = 32, className, style, type = "button", ...rest }, ref) {
  const tones = {
    plain: "bg-transparent text-ink-2 hover:bg-surface",
    neutral: "bg-surface text-ink-2 hover:bg-nav-active",
    outline: "border border-line-input bg-white text-ink-2 hover:bg-surface",
    danger: "bg-danger-bg text-danger-text hover:bg-[#FECDCA]",
  };
  return (
    <button
      ref={ref}
      type={type}
      className={clsx("inline-flex flex-none items-center justify-center rounded-control disabled:opacity-40", tones[tone], className)}
      style={{ width: size, height: size, ...style }}
      {...rest}
    />
  );
});
