"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { FileIcon, ImageIcon } from "@/components/ui/icons";
import { UploadDropzone, UploadProgress } from "@/components/ui/Upload";
import { useUpload, type FileRule } from "@/lib/upload-client";
import type { AssetRef } from "@/lib/course/schema";

export type AttachmentView = { id: string; url: string; name: string; isImage: boolean } | null;

const RULE: FileRule = {
  accept: ["image/jpeg", "image/png", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  maxBytes: 10 * 1024 * 1024,
  message: "Upload a JPEG, PNG, PDF or DOCX file up to 10MB.",
};

/** Shows an attachment: image thumbnail opens "Preview Image"; other files download. */
export function AttachmentPreview({ a }: { a: NonNullable<AttachmentView> }) {
  const [open, setOpen] = useState(false);
  if (!a.isImage) {
    return (
      <a href={a.url} className="inline-flex items-center gap-2 self-start rounded-control border border-line px-3 py-2 text-xs text-ink-2 no-underline hover:bg-surface">
        <FileIcon size={14} /> {a.name}
      </a>
    );
  }
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="self-start overflow-hidden rounded-control border border-line p-0" aria-label={`Preview ${a.name}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.url} alt={a.name} className="h-32 max-w-[240px] object-cover" />
      </button>
      <Dialog open={open} title="Preview Image" onRequestClose={() => setOpen(false)} width={640}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.url} alt={a.name} className="max-h-[70vh] w-full rounded-control object-contain" />
        <span className="text-xs text-ink-3">{a.name}</span>
      </Dialog>
    </>
  );
}

/**
 * Attach-a-file control for posts and replies: "Upload File" dialog with progress,
 * then a chip that opens "Manage File" (Preview / Delete / Replace) as in QA-Upload / QA-FileDialogs.
 */
/** `inline` shows the dropzone and progress in place (Support.dc.html); the default is an icon button that opens Upload File. */
export function AttachmentPicker({ value, onChange, inline = false }: { value: AssetRef | null; onChange: (a: AssetRef | null) => void; inline?: boolean }) {
  const up = useUpload("FILE", RULE, value);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [manage, setManage] = useState(false);

  async function pick(f: File) {
    await up.start(f);
  }
  // Keep the parent in sync with the finished upload.
  const cb = useRef(onChange);
  cb.current = onChange;
  const doneId = up.asset?.id;
  useEffect(() => {
    if (up.asset && up.asset.id !== value?.id) cb.current(up.asset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneId]);

  if (inline) {
    return (
      <>
        {up.state.status === "idle" && <UploadDropzone accept=".jpg,.jpeg,.png,.pdf" hint="JPEG, PNG, PDF (Max file 10MB)" onFile={pick} />}
        <UploadProgress state={up.state} onRemove={() => { up.remove(); onChange(null); }} />
      </>
    );
  }

  return (
    <>
      {value ? (
        <button type="button" onClick={() => setManage(true)} className="inline-flex items-center gap-2 self-start rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-2">
          <ImageIcon size={14} /> {value.fileName}
        </button>
      ) : (
        <button type="button" aria-label="Attach a file" onClick={() => setUploadOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-control border border-line text-ink-3 hover:bg-surface">
          <ImageIcon />
        </button>
      )}
      <Dialog open={uploadOpen} title="Upload File" onRequestClose={() => setUploadOpen(false)}>
        <UploadDropzone accept=".jpg,.jpeg,.png,.pdf,.docx" hint="JPEG, PNG, PDF or DOCX (Max file 10MB)" disabled={up.state.status === "uploading"} onFile={pick} />
        <UploadProgress state={up.state} onRemove={() => { up.remove(); onChange(null); }} />
        <div className="grid grid-cols-2 gap-2.5">
          <Button variant="outline" size="md" className="h-10" onClick={() => { up.remove(); onChange(null); setUploadOpen(false); }}>Cancel</Button>
          <Button size="md" className="h-10" disabled={up.state.status !== "done"} onClick={() => setUploadOpen(false)}>Attach</Button>
        </div>
      </Dialog>
      <Dialog open={manage} title="Manage File" description="You’re about to remove this file. What would you like to do?" onRequestClose={() => setManage(false)} width={380}>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="md" className="h-10" onClick={() => setManage(false)}>Cancel</Button>
          <Button variant="danger" size="md" className="h-10" onClick={() => { up.remove(); onChange(null); setManage(false); }}>Delete</Button>
          <Button size="md" className="h-10" onClick={() => { up.remove(); onChange(null); setManage(false); setUploadOpen(true); }}>Replace</Button>
        </div>
      </Dialog>
    </>
  );
}
