import "server-only";
import type { Storage } from "./index";

// Supabase Storage over its REST API (https://supabase.com/docs/reference/api), using the
// service-role key on the server only. The bucket should be private.

const READ_URL_TTL_S = 3600;

function config() {
  const url = clean(process.env.SUPABASE_URL);
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required when STORAGE_DRIVER=supabase");
  // Only the project origin is used, so a URL copied with a path (…/rest/v1/) still works.
  return { base: `${new URL(url).origin}/storage/v1`, key, bucket: clean(process.env.SUPABASE_STORAGE_BUCKET) || "lawdemy" };
}

/** Dashboard-pasted values can carry spaces or surrounding quotes. */
function clean(v: string | undefined) {
  return (v ?? "").trim().replace(/^["']+|["']+$/g, "").trim();
}

function call(path: string, init: RequestInit & { duplex?: "half" } = {}) {
  const { base, key } = config();
  // New secret keys (sb_secret_…) go in apikey only; legacy service_role JWTs also as a bearer token.
  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  if (!key.startsWith("sb_")) headers.set("Authorization", `Bearer ${key}`);
  return fetch(`${base}${path}`, { ...init, headers });
}

const objectPath = (key: string) => `${encodeURIComponent(config().bucket)}/${key.split("/").map(encodeURIComponent).join("/")}`;

async function fail(res: Response, action: string): Promise<never> {
  throw new Error(`Supabase Storage ${action} failed (${res.status}): ${await res.text()}`);
}

export const supabaseStorage: Storage = {
  async put(key, body, maxBytes) {
    let written = 0;
    const limited = body.pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, ctrl) {
          written += chunk.byteLength;
          if (written > maxBytes) ctrl.error(new Error("TOO_LARGE"));
          else ctrl.enqueue(chunk);
        },
      }),
    );
    const res = await call(`/object/${objectPath(key)}`, { method: "POST", body: limited, duplex: "half", headers: { "x-upsert": "true" } }).catch((err) => {
      if (written > maxBytes) throw new Error("TOO_LARGE");
      throw err;
    });
    if (!res.ok) await fail(res, "upload");
    return written;
  },

  async read(key, range) {
    const res = await call(`/object/authenticated/${objectPath(key)}`, range ? { headers: { Range: `bytes=${range.start}-${range.end}` } } : {});
    if (res.status === 404 || res.status === 400) return null;
    if (!res.ok || !res.body) await fail(res, "read");
    const total = res.headers.get("content-range")?.split("/")[1];
    return { stream: res.body!, size: Number(total ?? res.headers.get("content-length") ?? 0) };
  },

  async remove(key) {
    const res = await call(`/object/${encodeURIComponent(config().bucket)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: [key] }),
    });
    if (!res.ok && res.status !== 404) await fail(res, "delete");
  },

  async createUploadUrl(key) {
    const res = await call(`/object/upload/sign/${objectPath(key)}`, { method: "POST" });
    if (!res.ok) await fail(res, "upload URL");
    const { url } = (await res.json()) as { url: string };
    return `${config().base}${url}`;
  },

  async size(key) {
    const res = await call(`/object/${objectPath(key)}`, { method: "HEAD" });
    if (!res.ok) return null;
    return Number(res.headers.get("content-length") ?? 0);
  },

  async signedReadUrl(key, download) {
    const res = await call(`/object/sign/${objectPath(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiresIn: READ_URL_TTL_S }),
    });
    if (res.status === 404 || res.status === 400) return null;
    if (!res.ok) await fail(res, "signed URL");
    const { signedURL } = (await res.json()) as { signedURL: string };
    const url = `${config().base}${signedURL}`;
    return download ? `${url}&download=${encodeURIComponent(download)}` : url;
  },
};
