import type { Metadata } from "next";
import localFont from "next/font/local";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

// Self-hosted (variable, latin) so builds never depend on fetching Google Fonts.
const inter = localFont({ src: "../fonts/Inter-latin.woff2", weight: "400 700", variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "Lawdemy", template: "%s · Lawdemy" },
  description: "Learn law and teach it: courses by African legal professionals.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
