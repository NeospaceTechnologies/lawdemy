import QRCode from "qrcode";

/** QR modules for a URL (true = dark), used by the certificate preview and PDF. */
export function qrModules(text: string): boolean[][] {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "M" });
  const n = modules.size;
  return Array.from({ length: n }, (_, y) => Array.from({ length: n }, (_, x) => Boolean(modules.get(y, x))));
}
