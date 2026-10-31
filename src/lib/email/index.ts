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

export function mailer(): Mailer {
  switch (process.env.EMAIL_PROVIDER ?? "console") {
    case "console":
      return consoleMailer;
    default:
      // Add the chosen provider (Resend / SendGrid / Postmark) here.
      throw new Error(`Unknown EMAIL_PROVIDER "${process.env.EMAIL_PROVIDER}"`);
  }
}

export function appUrl(path: string) {
  return new URL(path, process.env.APP_URL ?? "http://localhost:3000").toString();
}
