import "server-only";
import { hash, verify } from "@node-rs/argon2";
import { createHash, randomBytes } from "node:crypto";

// Argon2id (PRD 9). @node-rs/argon2 defaults to the id variant.
const OPTS = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

export function hashPassword(pw: string) {
  return hash(pw, OPTS);
}

export async function verifyPassword(hashed: string, pw: string) {
  try {
    return await verify(hashed, pw);
  } catch {
    return false;
  }
}

// Used to keep sign-in timing the same whether or not the account exists.
let dummy: Promise<string> | null = null;
export async function burnPasswordCheck(pw: string) {
  dummy ??= hashPassword("lawdemy-timing-equaliser");
  await verifyPassword(await dummy, pw);
}

export function newToken() {
  return randomBytes(32).toString("base64url");
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
