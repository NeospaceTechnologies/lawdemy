import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fail } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";

// Receipt by reference (used right after a withdrawal) → the transaction receipt route.
export async function GET(req: Request, { params }: { params: Promise<{ ref: string }> }) {
  const { user, error } = await requireUser("INSTRUCTOR");
  if (error) return error;
  const t = await db.walletTransaction.findFirst({ where: { reference: (await params).ref, instructorId: user.id }, select: { id: true } });
  if (!t) return fail(404, "NOT_FOUND", "Receipt not found.");
  return NextResponse.redirect(new URL(`/api/instructor/transactions/${t.id}/receipt`, req.url));
}
