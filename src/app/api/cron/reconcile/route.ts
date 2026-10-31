import { fail, ok } from "@/lib/http";
import { previousWatDay, reconcile } from "@/lib/reconcile";

// Nightly reconciliation (ADM-06). Call daily with "Authorization: Bearer $CRON_SECRET"
// (e.g. Vercel Cron, GitHub Actions or a server crontab). Reconciles yesterday (WAT).
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return fail(401, "UNAUTHENTICATED", "Bad cron secret.");
  const { start, end } = previousWatDay();
  const run = await reconcile(start, end, null);
  return ok({ id: run.id, checked: run.checked, mismatches: Array.isArray(run.mismatches) ? run.mismatches.length : 0 });
}
