"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiClientError } from "./api-client";
import type { AssetRef } from "./course/schema";

export type UploadKind = "VIDEO" | "IMAGE" | "FILE";

/** The file's MIME type; Windows and some browsers leave it empty for WebVTT captions. */
export function mimeOf(file: File) {
  return file.type || (/\.vtt$/i.test(file.name) ? "text/vtt" : "");
}

function videoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(v.duration) ? v.duration : null);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    v.src = url;
  });
}

/** Registers the file, then streams it with XHR so we get progress events. */
export async function uploadFile(
  file: File,
  kind: UploadKind,
  onProgress: (loaded: number) => void,
  signal: AbortSignal,
): Promise<AssetRef> {
  const durationSeconds = kind === "VIDEO" ? await videoDuration(file) : null;
  const { id, uploadUrl, completeUrl } = await api<{ id: string; uploadUrl: string; completeUrl?: string }>("/api/uploads", {
    body: { kind, fileName: file.name, mime: mimeOf(file), sizeBytes: file.size, durationSeconds },
    signal,
  });

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", mimeOf(file));
    xhr.upload.onprogress = (e) => onProgress(e.loaded);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let message = xhr.status === 413 ? "This file is too large to upload." : "Upload failed. Please try again.";
      try {
        // Our API returns { error: { message } }; Supabase Storage returns { message }.
        const body = JSON.parse(xhr.responseText);
        const m = body?.error?.message ?? (xhr.status === 413 ? null : body?.message);
        if (typeof m === "string") message = m;
      } catch {}
      reject(new ApiClientError(xhr.status, "UPLOAD_FAILED", message));
    };
    xhr.onerror = () => reject(new ApiClientError(0, "NETWORK", "Upload interrupted. Check your connection and try again."));
    xhr.onabort = () => reject(new DOMException("Aborted", "AbortError"));
    signal.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(file);
  });
  // Direct uploads go straight to storage; the server then checks the file arrived whole.
  if (completeUrl) await api(completeUrl, { method: "POST", signal });

  return { id, fileName: file.name, sizeBytes: file.size };
}

export type UploadState =
  | { status: "idle" }
  | { status: "uploading"; fileName: string; sizeBytes: number; loaded: number }
  | { status: "done"; asset: AssetRef }
  | { status: "error"; message: string };

export type FileRule = { accept: string[]; maxBytes: number; maxSeconds?: number; message: string };

export function useUpload(kind: UploadKind, rule: FileRule, initial: AssetRef | null) {
  const [state, setState] = useState<UploadState>(initial ? { status: "done", asset: initial } : { status: "idle" });
  const ctrl = useRef<AbortController | null>(null);
  // Only files uploaded in this session may be deleted on remove; an initial
  // asset may still be referenced by the saved lesson or course.
  const uploadedHere = useRef(new Set<string>());

  useEffect(() => () => ctrl.current?.abort(), []);

  const start = useCallback(
    async (file: File) => {
      if (!rule.accept.includes(mimeOf(file)) || file.size > rule.maxBytes) {
        setState({ status: "error", message: rule.message });
        return;
      }
      if (kind === "VIDEO" && rule.maxSeconds) {
        const secs = await videoDuration(file);
        if (secs && secs > rule.maxSeconds) {
          setState({ status: "error", message: "Videos must be 30 minutes or shorter." });
          return;
        }
      }
      ctrl.current?.abort();
      const c = new AbortController();
      ctrl.current = c;
      setState({ status: "uploading", fileName: file.name, sizeBytes: file.size, loaded: 0 });
      try {
        const asset = await uploadFile(
          file,
          kind,
          (loaded) => setState((s) => (s.status === "uploading" ? { ...s, loaded } : s)),
          c.signal,
        );
        uploadedHere.current.add(asset.id);
        if (!c.signal.aborted) setState({ status: "done", asset });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState({ status: "error", message: err instanceof Error ? err.message : "Upload failed." });
      }
    },
    [kind, rule],
  );

  /** Cancels an in-flight upload or forgets the finished one. */
  const remove = useCallback(() => {
    ctrl.current?.abort();
    setState((s) => {
      if (s.status === "done" && uploadedHere.current.has(s.asset.id)) {
        void api(`/api/uploads/${s.asset.id}`, { method: "DELETE" }).catch(() => {});
      }
      return { status: "idle" };
    });
  }, []);

  return { state, start, remove, asset: state.status === "done" ? state.asset : null };
}
