"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconLayoutDashboard,
  IconUsers,
  IconUserSearch,
  IconMap,
  IconClipboardCheck,
  IconAlertTriangle,
  IconCalendarEvent,
  IconSettings,
  IconLogout,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

const NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Tableau de bord",
    icon: IconLayoutDashboard,
    exact: true,
  },
  { href: "/dashboard/prospects", label: "Prospects", icon: IconUserSearch },
  { href: "/dashboard/clients", label: "Clients", icon: IconUsers },
];

const CONFORMITE_NAV: NavItem[] = [
  {
    href: "/dashboard/cartographie",
    label: "Cartographie des risques",
    icon: IconMap,
  },
  {
    href: "/dashboard/obligations",
    label: "Obligations",
    icon: IconClipboardCheck,
  },
  {
    href: "/dashboard/operations-sensibles",
    label: "Opérations sensibles",
    icon: IconAlertTriangle,
  },
  { href: "/dashboard/planning", label: "Planning", icon: IconCalendarEvent },
];

const ADMIN_NAV: NavItem[] = [
  {
    href: "/dashboard/admin",
    label: "Administration",
    icon: IconSettings,
  },
];

function NavSection({
  items,
  pathname,
}: {
  items: NavItem[];
  pathname: string;
}) {
  return (
    <>
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
    </>
  );
}

export function AppSidebar({
  role,
  onLogout,
}: {
  role: Role | null;
  onLogout: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-sm font-semibold text-sidebar-foreground">
          QW Conseil
        </span>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto p-2">
        <div className="space-y-0.5">
          <NavSection items={NAV} pathname={pathname} />
        </div>

        <div>
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-sidebar-foreground/40">
            Conformité
          </p>
          <div className="space-y-0.5">
            <NavSection items={CONFORMITE_NAV} pathname={pathname} />
          </div>
        </div>

        {role === "ADMIN" && (
          <div>
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-sidebar-foreground/40">
              Administration
            </p>
            <div className="space-y-0.5">
              <NavSection items={ADMIN_NAV} pathname={pathname} />
            </div>
          </div>
        )}
      </nav>

      <div className="border-t p-2">
        <div className="flex items-center gap-3 rounded-md px-3 py-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold uppercase text-sidebar-accent-foreground">
            {role?.[0] ?? "?"}
          </div>
          <p className="flex-1 truncate text-xs text-sidebar-foreground/70">
            {role ?? "—"}
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
