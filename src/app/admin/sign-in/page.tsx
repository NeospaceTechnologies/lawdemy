import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInForm } from "@/features/auth/SignInForm";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Staff sign in" };

export default async function AdminSignInPage() {
  if (await getCurrentUser("ADMIN")) redirect("/admin/2fa");
  return (
    <div className="mx-auto max-w-[400px] py-10">
      <SignInForm role="admin" />
    </div>
  );
}
