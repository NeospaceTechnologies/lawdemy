import { ok } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";
import { payments } from "@/lib/payments";

export async function GET() {
  const { error } = await requireUser("INSTRUCTOR");
  if (error) return error;
  return ok({ banks: await payments().listBanks() });
}
