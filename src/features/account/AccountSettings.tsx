"use client";
import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { FieldMessage, Select, TextArea, TextInput } from "@/components/ui/Field";
import { DownloadIcon, EditIcon, LockIcon, MailIcon, TrashIcon } from "@/components/ui/icons";
import { PasswordInput } from "@/components/ui/Onboarding";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { useToast } from "@/components/ui/Toast";
import { api, ApiClientError } from "@/lib/api-client";
import { checkPassword } from "@/lib/auth/password-rules";
import { uploadFile } from "@/lib/upload-client";

export type AccountUser = { firstName: string; lastName: string; email: string; photoUrl: string | null; role: "learner" | "instructor" };

const LEAVE_REASONS = ["I no longer need the platform", "I’m using another learning platform", "I had technical issues", "Other"];

/**
 * Settings → Account: photo, name, email, password, delete account (Settings.dc.html).
 * Instructors (Inst-Settings.dc.html) pass their extra sections as children, which render
 * between General and Delete Account, and get a "Log out" button at the end.
 */
export function AccountSettings({ user, supportHref, signInHref, children }: { user: AccountUser; supportHref: string; signInHref: string; children?: ReactNode }) {
  const router = useRouter();
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState(user.photoUrl);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [modal, setModal] = useState<null | "name" | "password" | "delete" | "removePhoto" | "checkEmail" | "logout">(null);
  const [busy, setBusy] = useState(false);
  const [first, setFirst] = useState(user.firstName);
  const [last, setLast] = useState(user.lastName);
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [curErr, setCurErr] = useState<string | null>(null);
  const [why, setWhy] = useState("");
  const [whyMore, setWhyMore] = useState("");
  const [delErr, setDelErr] = useState<string | null>(null);
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  async function changePhoto(f: File) {
    if (!["image/jpeg", "image/png"].includes(f.type) || f.size > 5 * 1024 * 1024) {
      toast.show({ tone: "error", title: "Upload a JPEG or PNG image up to 5MB" });
      return;
    }
    setPhotoBusy(true);
    try {
      const a = await uploadFile(f, "IMAGE", () => {}, new AbortController().signal);
      await api("/api/account/photo", { method: "PUT", body: { assetId: a.id } });
      setPhoto(`/api/media/${a.id}`);
      toast.show({ title: "Changes Saved", body: "Your profile has been updated." });
      router.refresh();
    } catch (err) {
      toast.show({ tone: "error", title: "Couldn’t update your photo", body: err instanceof ApiClientError ? err.message : undefined });
    } finally {
      setPhotoBusy(false);
    }
  }

  async function removePhoto() {
    setBusy(true);
    await api("/api/account/photo", { method: "PUT", body: { assetId: null } }).catch(() => {});
    setPhoto(null);
    setBusy(false);
    setModal(null);
    toast.show({ title: "Changes Saved", body: "Your profile picture has been removed." });
    router.refresh();
  }

  async function saveName() {
    setBusy(true);
    try {
      await api("/api/account/profile", { method: "PATCH", body: { firstName: first, lastName: last } });
      toast.show({ title: "Changes Saved", body: "Your name has been updated." });
      setModal(null);
      router.refresh();
    } catch (err) {
      toast.show({ tone: "error", title: "Couldn’t save", body: err instanceof ApiClientError ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  async function savePassword() {
    setBusy(true);
    setCurErr(null);
    try {
      await api("/api/account/password", { body: { current: cur, password: pw, confirm: pw2 } });
      toast.show({ title: "Password Changed Successfully!", body: "Your new password has been saved. Other devices have been signed out." });
      setModal(null);
    } catch (err) {
      if (err instanceof ApiClientError && err.code === "WRONG_PASSWORD") setCurErr(err.message);
      else toast.show({ tone: "error", title: "Couldn’t change your password", body: err instanceof ApiClientError ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  async function forgot() {
    await api("/api/auth/password-reset/request", { body: { email: user.email, role: user.role } }).catch(() => {});
    setModal("checkEmail");
  }

  async function deleteAccount() {
    setBusy(true);
    setDelErr(null);
    try {
      await api("/api/account", { method: "DELETE", body: { reason: why || undefined, details: whyMore || undefined } });
      toast.show({ title: "Your Account Has been Deleted Successfully", body: "We’re sorry to see you go." });
      router.replace(signInHref);
      router.refresh();
    } catch (err) {
      setDelErr(err instanceof ApiClientError ? err.message : "Couldn’t delete your account.");
      setBusy(false);
    }
  }

  const nameChanged = !!first.trim() && !!last.trim() && (first !== user.firstName || last !== user.lastName);
  const pwOk = !!cur && checkPassword(pw, user.role).valid && pw === pw2;
  const instructor = user.role === "instructor";
  const field = "flex h-[42px] items-center rounded-control border border-line bg-surface px-3 text-sm";
  const action = "inline-flex h-[42px] min-w-[120px] items-center justify-center gap-1.5 rounded-control bg-primary px-4 text-[13px] font-semibold text-white no-underline hover:bg-primary-hover hover:text-white";
  const generalRow = (label: string, value: ReactNode, button: ReactNode, mono?: boolean) => (
    <div className="flex items-end gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="text-xs font-semibold">{label}</span>
        <div className={field + (mono ? " tracking-[0.2em]" : "")}><span className="truncate">{value}</span></div>
      </div>
      {button}
    </div>
  );
  async function logOut() {
    setBusy(true);
    await fetch("/api/auth/sign-out", { method: "POST" }).catch(() => {});
    router.replace(signInHref);
    router.refresh();
  }

  return (
    <div className="flex max-w-[720px] flex-col gap-7">
      <div className="flex flex-wrap items-center gap-4">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="Profile photo" className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-accent text-2xl font-bold text-price">{initials}</span>
        )}
        <div className="flex gap-2">
          <Button variant="outline" size="md" disabled={!photo} onClick={() => setModal("removePhoto")}>Remove</Button>
          <Button size="md" busy={photoBusy} busyLabel="Uploading…" onClick={() => fileInput.current?.click()}>Change Photo</Button>
          <input ref={fileInput} type="file" accept="image/jpeg,image/png" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void changePhoto(f); e.target.value = ""; }} />
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="m-0 text-xl font-semibold">General</h2>
        {generalRow("Full Name", `${user.firstName} ${user.lastName}`, (
          <button type="button" className={action} onClick={() => { setFirst(user.firstName); setLast(user.lastName); setModal("name"); }}>{!instructor && <EditIcon />}Edit</button>
        ))}
        {generalRow("Email Address", user.email, (
          <Link href={supportHref} className={action}>{!instructor && <MailIcon size={14} />}Contact Us</Link>
        ))}
        {generalRow("Password", "••••••••", (
          <button type="button" className={action} onClick={() => { setCur(""); setPw(""); setPw2(""); setCurErr(null); setModal("password"); }}>{!instructor && <LockIcon />}Change</button>
        ), true)}
      </section>

      {children}

      <section className={instructor ? "flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6" : "flex flex-col items-start gap-2"}>
        <div className="flex flex-col gap-1">
          <h2 className="m-0 text-xl font-semibold">Your data</h2>
          <p className="m-0 text-[13px] text-ink-3">Download a copy of your profile, activity{instructor ? ", courses and earnings" : ", courses and orders"} as a JSON file.</p>
        </div>
        <a href="/api/account/export" download className="inline-flex h-10 items-center gap-1.5 rounded-control border border-primary bg-white px-4 text-[13px] font-semibold text-primary no-underline hover:bg-surface"><DownloadIcon size={14} />Download my data</a>
      </section>

      {instructor ? (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-[#FECDCA] bg-[#FFFBFA] px-4 py-3.5">
          <span className="flex flex-col gap-0.5">
            <strong className="text-sm text-danger-text">Delete Account</strong>
            <span className="text-xs text-ink-3">Permanently delete your account, courses and earnings history.</span>
          </span>
          <button type="button" onClick={() => { setWhy(""); setWhyMore(""); setDelErr(null); setModal("delete"); }} className="h-[38px] rounded-control border-0 bg-danger-light px-3.5 text-[13px] font-semibold text-white hover:bg-danger">Delete Account</button>
        </section>
      ) : (
        <section className="flex flex-col items-start gap-2">
          <h2 className="m-0 text-xl font-semibold">Delete Account</h2>
          <p className="m-0 text-[13px] text-ink-3">Permanently delete your account and associated data. Once deleted, it’s gone forever.</p>
          <Button variant="danger" size="md" className="mt-1 h-10" onClick={() => { setWhy(""); setWhyMore(""); setDelErr(null); setModal("delete"); }}><TrashIcon />Delete</Button>
        </section>
      )}

      {instructor && (
        <button type="button" onClick={() => setModal("logout")} className="h-[38px] self-start rounded-control border border-line-input bg-white px-3.5 text-[13px] font-semibold text-danger hover:bg-danger-bg">Log out</button>
      )}
      <ConfirmDialog
        open={modal === "logout"}
        tone="danger"
        title="Log out?"
        body="Logging out will end your current session, and you’ll need to sign in again to access your account."
        confirmLabel="Log out"
        busyLabel="Logging out…"
        busy={busy}
        onConfirm={logOut}
        onCancel={() => setModal(null)}
      />

      <Dialog open={modal === "name"} title="Edit Name" onRequestClose={() => !busy && setModal(null)}>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-xs font-semibold">First Name<TextInput data-autofocus className="h-10 font-normal" value={first} onChange={(e) => setFirst(e.target.value)} /></label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold">Last Name<TextInput className="h-10 font-normal" value={last} onChange={(e) => setLast(e.target.value)} /></label>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <Button variant="outline" onClick={() => setModal(null)} disabled={busy}>Cancel</Button>
          <Button disabled={!nameChanged} busy={busy} busyLabel="Saving…" onClick={saveName}>Save</Button>
        </div>
      </Dialog>

      <Dialog open={modal === "password"} title="Change Password" description="Create a strong password you haven’t used before for this account." onRequestClose={() => !busy && setModal(null)} width={480}>
        <label className="flex flex-col gap-1.5 text-xs font-semibold">
          Current Password
          <PasswordInput data-autofocus autoComplete="current-password" placeholder="Enter your current password" value={cur} onChange={(e) => { setCur(e.target.value); setCurErr(null); }} invalid={!!curErr} />
          {curErr && <FieldMessage tone="error">{curErr}</FieldMessage>}
        </label>
        <button type="button" onClick={forgot} className="-mt-2 self-end border-0 bg-transparent p-0 text-xs font-semibold text-primary">Forgot Password?</button>
        <label className="flex flex-col gap-1.5 text-xs font-semibold">
          New Password
          <PasswordInput autoComplete="new-password" placeholder="Enter your new password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </label>
        {pw && <PasswordStrength password={pw} role={user.role} showErrors />}
        <label className="flex flex-col gap-1.5 text-xs font-semibold">
          Confirm Password
          <TextInput type="password" autoComplete="new-password" className="h-11 font-normal" placeholder="Retype your password" value={pw2} onChange={(e) => setPw2(e.target.value)} invalid={!!pw2 && pw2 !== pw} />
          {pw2 && pw2 !== pw && <FieldMessage tone="error">Passwords do not match.</FieldMessage>}
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <Button variant="outline" onClick={() => setModal(null)} disabled={busy}>Cancel</Button>
          <Button disabled={!pwOk} busy={busy} busyLabel="Updating…" onClick={savePassword}>Update Password</Button>
        </div>
      </Dialog>

      <Dialog open={modal === "checkEmail"} title="Check Your Email" description="We’ve sent a password reset link to your email. Follow the instructions in the email to set a new password." onRequestClose={() => setModal(null)}>
        <div className="grid grid-cols-2 gap-2.5">
          <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
          <a href="mailto:" className="flex h-11 items-center justify-center rounded-control bg-primary text-sm font-semibold text-white no-underline hover:text-white">Open Email</a>
        </div>
      </Dialog>

      <ConfirmDialog open={modal === "removePhoto"} title="Are you sure you want to remove your profile picture?" body="Removing your profile picture will revert it to the default state." confirmLabel="Remove Picture" tone="danger" busy={busy} busyLabel="Removing…" onCancel={() => setModal(null)} onConfirm={removePhoto} />

      <Dialog open={modal === "delete"} title="Delete your Lawdemy Account?" description={user.role === "learner" ? "This action will permanently delete your account and all associated data, including your course progress and certifications. Once deleted, this cannot be undone." : "This action will permanently delete your instructor account and profile. Once deleted, this cannot be undone."} onRequestClose={() => !busy && setModal(null)}>
        <label className="flex flex-col gap-1.5 text-xs font-semibold">
          Tell us why you’re leaving (Optional)
          <Select value={why} onChange={(e) => setWhy(e.target.value)} className="h-10 text-[13px] font-normal">
            <option value="">Select option</option>
            {LEAVE_REASONS.map((r) => <option key={r}>{r}</option>)}
          </Select>
        </label>
        {why === "Other" && <TextArea aria-label="Tell us more" rows={3} placeholder="Enter a description…" value={whyMore} onChange={(e) => setWhyMore(e.target.value)} className="text-[13px]" />}
        {delErr && <p role="alert" className="m-0 text-xs text-danger-text">{delErr}</p>}
        <div className="grid grid-cols-2 gap-2.5">
          <Button variant="outline" onClick={() => setModal(null)} disabled={busy}>Cancel</Button>
          <Button variant="danger" busy={busy} busyLabel="Deleting…" onClick={deleteAccount}>Delete Account</Button>
        </div>
      </Dialog>
    </div>
  );
}
