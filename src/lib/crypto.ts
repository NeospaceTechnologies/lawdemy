import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// AES-256-GCM for bank account numbers at rest (PRD 9). Set BANK_ENC_KEY (32 bytes, base64) in production.
function key() {
  const env = process.env.BANK_ENC_KEY;
  if (env) return Buffer.from(env, "base64");
  if (process.env.NODE_ENV === "production") throw new Error("BANK_ENC_KEY is required in production");
  return createHash("sha256").update("lawdemy-dev-only-key").digest();
}

export function encrypt(plain: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv.toString("base64"), c.getAuthTag().toString("base64"), data.toString("base64")].join(".");
}

export function decrypt(blob: string) {
  const [iv, tag, data] = blob.split(".").map((p) => Buffer.from(p, "base64"));
  const d = createDecipheriv("aes-256-gcm", key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(data), d.final()]).toString("utf8");
}
