import "server-only";

export type Email = { to: string; subject: string; text: string; html?: string };

export interface Mailer {
  send(email: Email): Promise<void>;
}

// Dev mailer: prints the email to the server log so links can be clicked locally.
const consoleMailer: Mailer = {
  async send({ to, subject, text }) {
    console.info(`\n[email] to=${to}\n[email] subject=${subject}\n${text}\n`);
  },
};

// Resend (https://resend.com/docs/api-reference/emails/send-email). EMAIL_FROM must use a domain
// verified in Resend. A failed send is logged rather than thrown, so the action that triggered it
// (sign-up, reset request, payout) still completes; users can ask for a new link from the UI.
const resendMailer: Mailer = {
  async send({ to, subject, text, html }) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is required when EMAIL_PROVIDER=resend");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM ?? "Lawdemy <onboarding@resend.dev>", to: [to], subject, text, ...(html ? { html } : {}) }),
    });
    if (!res.ok) console.error(`[email] Resend rejected "${subject}" (${res.status}): ${await res.text()}`);
  },
};

export function mailer(): Mailer {
  switch (process.env.EMAIL_PROVIDER ?? "console") {
    case "console":
      return consoleMailer;
    case "resend":
      return resendMailer;
    default:
      throw new Error(`Unknown EMAIL_PROVIDER "${process.env.EMAIL_PROVIDER}"`);
  }
}

export function appUrl(path: string) {
  return new URL(path, process.env.APP_URL ?? "http://localhost:3000").toString();
}
