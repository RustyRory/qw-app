"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconLayoutDashboard,
  IconUsers,
  IconShieldCheck,
  IconSettings,
  IconLogout,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

const NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Vue globale",
    icon: IconLayoutDashboard,
    exact: true,
  },
  { href: "/dashboard/clients", label: "Clients", icon: IconUsers },
  { href: "/dashboard/scoring", label: "Scoring", icon: IconShieldCheck },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/dashboard/admin", label: "Administration", icon: IconSettings },
];

export function AppSidebar({
  role,
  onLogout,
}: {
  role: string | null;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const items = role === "admin" ? [...NAV, ...ADMIN_NAV] : [...NAV];

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-sm font-semibold text-sidebar-foreground">
          QW Conseil
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 p-2">
        {items.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-2">
        <div className="flex items-center gap-3 rounded-md px-3 py-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold uppercase text-sidebar-accent-foreground">
            {role?.[0] ?? "?"}
          </div>
          <p className="flex-1 truncate text-xs capitalize text-sidebar-foreground/70">
            {role}
          </p>
          <button
            onClick={onLogout}
            title="Se déconnecter"
            className="text-sidebar-foreground/50 transition-colors hover:text-sidebar-foreground"
          >
            <IconLogout className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
