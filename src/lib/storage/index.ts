import "server-only";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

// Storage driver. "local" writes to ./uploads for development. Production swaps
// in an S3-compatible bucket (signed upload URLs) and the video host (Mux /
// Cloudflare Stream) for transcoding, HLS and signed playback (PRD 10).

export interface Storage {
  /** Streams the body to storage; rejects if more than maxBytes arrive. Returns bytes written. */
  put(key: string, body: ReadableStream<Uint8Array>, maxBytes: number): Promise<number>;
  read(key: string, range?: { start: number; end: number }): Promise<{ stream: ReadableStream<Uint8Array>; size: number } | null>;
  remove(key: string): Promise<void>;
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
  switch (process.env.STORAGE_DRIVER ?? "local") {
    case "local":
      return localStorage;
    default:
      throw new Error(`Unknown STORAGE_DRIVER "${process.env.STORAGE_DRIVER}"`);
  }
}
