import { ToastViewport } from "@/components/ui/Toast";

// Staff console (PRD 11). Sign-in and 2FA render bare; the console pages add the sidebar.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <ToastViewport />
      {children}
    </div>
  );
}
