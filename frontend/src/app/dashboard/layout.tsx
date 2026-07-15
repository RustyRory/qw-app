"use client";

import { useAuth } from "@/hooks/useAuth";
import { IconLogout } from "@tabler/icons-react";
import { AppSidebar } from "@/components/layout/AppSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready, role, logout } = useAuth();

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
<div className="flex h-screen flex-col md:flex-row overflow-hidden bg-background">     
   <AppSidebar role={role} onLogout={logout} />
   <div className="fixed right-4 top-4 z-50 md:hidden">
  
</div>
      <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>
    </div>
  );
}
