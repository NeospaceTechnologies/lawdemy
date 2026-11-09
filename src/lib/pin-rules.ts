// Transaction PIN rules (PRD 7.1). Kept free of client and server-only code so either side can use them.

/** True for PINs PRD 7.1 blocks: 0000-style repeats and simple sequences. */
export function isWeakPin(pin: string) {
  if (!/^\d{4}$/.test(pin)) return false;
  if (/^(\d)\1{3}$/.test(pin)) return true;
  return ["0123", "1234", "2345", "3456", "4567", "5678", "6789", "9876", "8765", "7654", "6543", "5432", "4321", "3210"].includes(pin);
}
