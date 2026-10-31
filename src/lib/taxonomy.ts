// Lists used by onboarding, profiles and filters. Admin-managed later (ADM-11).

export const JURISDICTIONS = [
  "Nigeria", "Ghana", "Kenya", "South Africa", "Egypt", "Rwanda", "Uganda", "Tanzania", "Ethiopia", "Botswana",
  "Cameroon", "Senegal", "Côte d’Ivoire", "Zambia", "Zimbabwe", "Morocco", "Australia", "Brazil", "Canada",
  "Chile", "France", "Germany", "United Kingdom", "United States",
] as const;

export const PRACTICE_AREAS = [
  "Banking, Finance & Capital Markets",
  "Corporate & Commercial",
  "Litigation & Dispute Resolution",
  "Arbitration",
  "Criminal Law",
  "Family Law",
  "Employment & Labour",
  "Real Estate & Property",
  "Tax",
  "Technology, Media & IP",
  "Data Protection & Privacy",
  "Energy & Natural Resources",
  "Human Rights",
  "Environmental & Climate",
  "Public & Constitutional",
] as const;

export const INTERESTS = [
  "Ecosystem Law", "Climate Litigation", "Legal Tech", "Data Privacy", "Contract Drafting", "Legal Writing", "Human Rights",
  "Corporate Law", "Arbitration", "Criminal Law", "Family Law", "Tech & IP", "Compliance",
] as const;

export const PROFESSIONAL_TITLES = [
  "Legal Practitioner", "Senior Advocate", "Law Lecturer / Academic", "In-house Counsel", "Legal Consultant", "Judge / Magistrate", "Other",
] as const;

export const POPULAR_SEARCHES = ["Corporate Law", "Tech & IP", "Criminal Law", "Family Law", "Human Rights", "Legal Writing"];

export function callYears(now = new Date()) {
  const y = now.getUTCFullYear();
  return Array.from({ length: 60 }, (_, i) => String(y - i));
}
