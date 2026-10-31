// Placeholders until the team provides real contact details (PRD 3, Assumptions).
export const SUPPORT_CONTACT = {
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "[SUPPORT EMAIL]",
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "[PHONE NUMBER]",
  address: process.env.NEXT_PUBLIC_SUPPORT_ADDRESS ?? "[OFFICE ADDRESS], Lagos",
  socials: ["[Social 1]", "[Social 2]", "[Social 3]"],
};

export const LEARNER_SUPPORT_CATEGORIES = ["Account", "Billing", "Community", "Technical", "Other"];
export const INSTRUCTOR_SUPPORT_CATEGORIES = ["Course Management", "Learner Issue", "Publishing", "Bank Setup", "Account", "Other"];
