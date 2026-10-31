"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FieldMessage, TextInput } from "@/components/ui/Field";
import { api, ApiClientError } from "@/lib/api-client";

export function TwoFactorForm() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      await api("/api/admin/2fa", { body: { code } });
      // Full load: the session just gained its second factor, so nothing cached should be reused.
      window.location.assign("/admin");
    } catch (e) {
      setErr(e instanceof ApiClientError ? e.message : "Couldn’t verify the code.");
      setCode("");
      setBusy(false);
    }
  }
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (/^\d{6}$/.test(code)) void submit();
      }}
    >
      <label className="flex flex-col gap-1.5 text-xs font-semibold">
        Verification code
        <TextInput
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="h-11 font-normal tracking-[0.3em]"
          invalid={!!err}
        />
      </label>
      {err && <FieldMessage tone="error">{err}</FieldMessage>}
      <Button type="submit" disabled={!/^\d{6}$/.test(code)} busy={busy} busyLabel="Verifying…">Verify</Button>
    </form>
  );
}
