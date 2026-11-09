import "server-only";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

import { supabaseStorage } from "./supabase";

// Storage driver. "local" writes to ./uploads for development. "supabase" keeps files in a
// private Supabase Storage bucket: browsers upload straight to it with a signed URL (so files
// never pass through the 4.5 MB serverless request limit) and read through short-lived
// signed URLs after /api/media checks access. A video host (Mux / Cloudflare Stream) for
// transcoding and HLS can replace it later (PRD 10).

export interface Storage {
  /** Streams the body to storage; rejects if more than maxBytes arrive. Returns bytes written. */
  put(key: string, body: ReadableStream<Uint8Array>, maxBytes: number): Promise<number>;
  read(key: string, range?: { start: number; end: number }): Promise<{ stream: ReadableStream<Uint8Array>; size: number } | null>;
  remove(key: string): Promise<void>;
  /** Direct-upload drivers: a URL the browser PUTs the file to. */
  createUploadUrl?(key: string): Promise<string>;
  /** Direct-upload drivers: the stored object's size in bytes, or null when it is missing. */
  size?(key: string): Promise<number | null>;
  /** Signed-read drivers: a short-lived URL for the object, optionally as a named download. */
  signedReadUrl?(key: string, download?: string): Promise<string | null>;
}

const ROOT = path.resolve(process.cwd(), "uploads");

function safePath(key: string) {
  const p = path.resolve(ROOT, key);
  if (!p.startsWith(ROOT + path.sep)) throw new Error("Bad storage key");
  return p;
}

const localStorage: Storage = {
  async put(key, body, maxBytes) {
    const file = safePath(key);
    await mkdir(path.dirname(file), { recursive: true });
    let written = 0;
    const limiter = new Transform({
      transform(chunk: Buffer, _enc, cb) {
        written += chunk.length;
        if (written > maxBytes) cb(new Error("TOO_LARGE"));
        else cb(null, chunk);
      },
    });
    try {
      await pipeline(Readable.fromWeb(body as import("node:stream/web").ReadableStream), limiter, createWriteStream(file));
    } catch (err) {
      await rm(file, { force: true });
      throw err;
    }
    return written;
  },
  async read(key, range) {
    const file = safePath(key);
    try {
      const { size } = await stat(file);
      return { stream: Readable.toWeb(createReadStream(file, range)) as ReadableStream<Uint8Array>, size };
    } catch {
      return null;
    }
  },
  async remove(key) {
    await rm(safePath(key), { force: true });
  },
};

export function storage(): Storage {
  switch ((process.env.STORAGE_DRIVER ?? "local").trim().replace(/^["']+|["']+$/g, "").toLowerCase()) {
    case "local":
      return localStorage;
    case "supabase":
      return supabaseStorage;
    default:
      throw new Error(`Unknown STORAGE_DRIVER "${process.env.STORAGE_DRIVER}"`);
  }
}
