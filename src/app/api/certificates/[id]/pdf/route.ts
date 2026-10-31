import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { fail } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";
import { certificateFor, closingLine } from "@/lib/certificate-data";
import { qrModules } from "@/lib/qr";

// Server-side certificate PDF (PRD 10). A4 landscape with the brand pattern.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser("LEARNER");
  if (error) return error;
  const c = await certificateFor((await params).id, user.id);
  if (!c) return fail(404, "NOT_FOUND", "Certificate not found.");

  const pdf = await PDFDocument.create();
  pdf.setTitle(`Lawdemy certificate ${c.code}`);
  const page = pdf.addPage([842, 595]);
  const serif = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const serifItalic = await pdf.embedFont(StandardFonts.TimesRomanBoldItalic);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.06, 0.09, 0.16);
  const muted = rgb(0.28, 0.33, 0.4);
  const navy = rgb(0.043, 0.043, 0.494);

  page.drawRectangle({ x: 0, y: 0, width: 842, height: 595, color: rgb(0.96, 0.95, 0.99) });
  page.drawRectangle({ x: 0, y: 0, width: 622, height: 595, color: rgb(1, 1, 1), opacity: 0.6 });
  // Pattern band
  const band: [number, number, number][] = [[0.42, 0.25, 0.63], [0.07, 0.07, 0.48], [1, 0.76, 0.1], [0.72, 0.9, 0.83], [0.95, 0.42, 0.11], [0.07, 0.09, 0.15]];
  band.forEach((col, i) => page.drawRectangle({ x: 622, y: 595 - (i + 1) * 99.2, width: 220, height: 99.2, color: rgb(...col) }));
  page.drawCircle({ x: 732, y: 495, size: 70, color: rgb(1, 0.76, 0.1) });
  page.drawCircle({ x: 842, y: 100, size: 80, color: rgb(0.09, 0.7, 0.42) });

  page.drawText("Lawdemy", { x: 60, y: 530, size: 14, font: sansBold, color: navy });
  page.drawText("CERTIFICATE OF", { x: 60, y: 450, size: 20, font: serif, color: muted });
  page.drawText("COMPLETION", { x: 60, y: 412, size: 36, font: serif, color: ink });
  page.drawText("This is proudly presented to", { x: 60, y: 372, size: 12, font: sans, color: muted });
  page.drawText(c.learner, { x: 60, y: 324, size: 38, font: serifItalic, color: ink });
  const body = `For successfully completing the course "${c.course}" taught by ${c.instructor}${c.instructorTitle ? `, ${c.instructorTitle}` : ""} and offered by Lawdemy, ${closingLine(c.lawyer)}`;
  const words = body.split(" ");
  let line = "";
  let y = 290;
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (sans.widthOfTextAtSize(next, 11) > 500) {
      page.drawText(line, { x: 60, y, size: 11, font: sans, color: ink });
      y -= 16;
      line = w;
    } else line = next;
  }
  if (line) page.drawText(line, { x: 60, y, size: 11, font: sans, color: ink });

  page.drawText(c.instructor, { x: 60, y: 80, size: 10, font: sans, color: muted });
  page.drawLine({ start: { x: 60, y: 96 }, end: { x: 200, y: 96 }, thickness: 0.6, color: muted });
  page.drawText("Certificate ID", { x: 270, y: 96, size: 9, font: sans, color: muted });
  page.drawText(c.code, { x: 270, y: 80, size: 12, font: sansBold, color: ink });
  const qr = qrModules(c.verifyUrl);
  const cell = 52 / qr.length;
  qr.forEach((row, y) => row.forEach((on, x) => on && page.drawRectangle({ x: 470 + x * cell, y: 110 + (qr.length - 1 - y) * cell, width: cell, height: cell, color: ink })));
  page.drawText("Issued on", { x: 470, y: 96, size: 9, font: sans, color: muted });
  page.drawText(c.issuedAt, { x: 470, y: 80, size: 12, font: sansBold, color: ink });
  page.drawText(`Verify at ${c.verifyUrl}`, { x: 60, y: 40, size: 8, font: sans, color: muted });

  const bytes = await pdf.save();
  return new Response(Buffer.from(bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="Lawdemy-certificate-${c.code}.pdf"` },
  });
}
