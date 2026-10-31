"use client";
import { useState } from "react";
import { Button, buttonClass } from "@/components/ui/Button";
import { DownloadIcon, ShareIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/Toast";

export function CertificateActions({ id, verifyUrl }: { id: string; verifyUrl: string }) {
  const toast = useToast();
  const [downloaded, setDownloaded] = useState(false);
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="md"
        onClick={async () => {
          await navigator.clipboard.writeText(verifyUrl).catch(() => {});
          toast.show({ title: "Verification link copied", body: "Anyone with the link can confirm this certificate." });
        }}
      >
        <ShareIcon size={14} /> Copy verification link
      </Button>
      <a href={`/api/certificates/${id}/pdf`} download onClick={() => setDownloaded(true)} className={buttonClass("primary", "md")}>
        {downloaded ? "Downloaded" : "Download Certificate"} <DownloadIcon size={14} />
      </a>
    </div>
  );
}
