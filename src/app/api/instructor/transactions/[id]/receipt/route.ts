import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { db } from "@/lib/db";
import { fail } from "@/lib/http";
import { formatNaira } from "@/lib/format";
import { requireUser } from "@/lib/auth/guard";

// Receipt PDF for a successful withdrawal or a bonus (INS-PAY-05).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser("INSTRUCTOR");
  if (error) return error;
  const t = await db.walletTransaction.findFirst({ where: { id: (await params).id, instructorId: user.id }, include: { withdrawal: { include: { bankAccount: true } } } });
  if (!t || !((t.type === "WITHDRAWAL" && t.status === "SUCCESSFUL") || t.type === "BONUS")) return fail(404, "NOT_FOUND", "Receipt not available.");
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([420, 560]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.043, 0.043, 0.494);
  const muted = rgb(0.4, 0.44, 0.52);
  page.drawText("Lawdemy", { x: 32, y: 516, size: 16, font: bold, color: navy });
  page.drawText("Transaction Receipt", { x: 32, y: 480, size: 14, font: bold });
  const amount = t.withdrawal ? t.withdrawal.amountKobo : t.amountKobo;
  page.drawText(formatNaira(amount).replace("₦", "NGN "), { x: 32, y: 440, size: 24, font: bold, color: rgb(0.77, 0.2, 0.04) });
  const rows: [string, string][] = t.withdrawal
    ? [
        ["Transaction Type", "Withdrawal"],
        ["Charge", formatNaira(t.withdrawal.feeKobo).replace("₦", "NGN ")],
        ["Total Debit", formatNaira(t.withdrawal.amountKobo + t.withdrawal.feeKobo).replace("₦", "NGN ")],
        ["Receiving Bank", `${t.withdrawal.bankAccount.bankName} (****${t.withdrawal.bankAccount.accountNumberLast4})`],
        ["Account Name", t.withdrawal.bankAccount.accountName],
        ["Reference ID", t.reference],
        ["Date", (t.withdrawal.completedAt ?? t.createdAt).toLocaleString("en-GB", { timeZone: "Africa/Lagos" })],
        ["Status", "Successful"],
      ]
    : [["Transaction Type", "Promotional Bonus"], ["Description", t.notes ?? "Bonus"], ["Reference ID", t.reference], ["Date", t.createdAt.toLocaleString("en-GB", { timeZone: "Africa/Lagos" })], ["Status", "Successful"]];
  let y = 400;
  for (const [k, v] of rows) {
    page.drawText(k, { x: 32, y, size: 10, font, color: muted });
    page.drawText(v.slice(0, 48), { x: 170, y, size: 10, font: bold });
    y -= 26;
  }
  page.drawText("Thank you for teaching on Lawdemy.", { x: 32, y: 40, size: 9, font, color: muted });
  return new Response(Buffer.from(await pdf.save()), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="Lawdemy-receipt-${t.reference}.pdf"` } });
}
