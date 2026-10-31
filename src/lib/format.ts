// Naira formatting with Intl en-NG (PRD 9, Localisation).
const ngn = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 });

export function formatNaira(kobo: number) {
  return ngn.format(kobo / 100);
}

export function nairaToKobo(input: string): number | null {
  const n = Number(input.replace(/,/g, ""));
  if (!input.trim() || !Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function koboToNairaInput(kobo: number | null) {
  if (kobo === null) return "";
  return Number.isInteger(kobo / 100) ? String(kobo / 100) : (kobo / 100).toFixed(2);
}

export function discountedKobo(kobo: number, pct: number) {
  return Math.round((kobo * (100 - pct)) / 100);
}

export type DurationFormat = "HOURS_MINUTES" | "MINUTES_SECONDS";

/** Split seconds into the two inputs shown for a format (Hours/Minutes or Minutes/Seconds). */
export function splitDuration(seconds: number | null, format: DurationFormat): [string, string] {
  if (seconds === null) return ["", ""];
  if (format === "HOURS_MINUTES") return [String(Math.floor(seconds / 3600)), String(Math.floor((seconds % 3600) / 60))];
  return [String(Math.floor(seconds / 60)), String(seconds % 60)];
}

export function joinDuration(a: string, b: string, format: DurationFormat): number | null {
  if (a.trim() === "" && b.trim() === "") return null;
  const x = Math.max(0, Math.floor(Number(a) || 0));
  const y = Math.min(59, Math.max(0, Math.floor(Number(b) || 0)));
  return format === "HOURS_MINUTES" ? x * 3600 + y * 60 : x * 60 + y;
}

export function durationLabel(seconds: number, format: DurationFormat) {
  const [a, b] = splitDuration(seconds, format);
  return format === "HOURS_MINUTES" ? `${a}h ${b}min` : `${a}min ${b}s`;
}

export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 ** 3).toFixed(1)}GB`;
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / 1024 ** 2)}MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${bytes}B`;
}
