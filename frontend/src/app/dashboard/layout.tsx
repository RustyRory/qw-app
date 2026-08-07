"use client";

import { Toaster } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { NotificationBell } from "@/components/layout/NotificationBell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready, role, logout } = useAuth();
  const notifications = useNotifications();

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col md:flex-row overflow-hidden bg-background">
      <Toaster position="top-right" richColors />
      <AppSidebar role={role} onLogout={logout} notifications={notifications} />
      <div className="fixed right-4 top-4 z-50 rounded-xl bg-white shadow-md md:hidden">
        <NotificationBell {...notifications} dark={false} />
      </div>
      <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>
    </div>
  );
}
