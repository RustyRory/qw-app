"use client";

import { useState } from "react";
import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconAlertTriangle,
  IconCalendarEvent,
  IconChevronRight,
  IconClipboardCheck,
  IconLayoutDashboard,
  IconLogout,
  IconMap,
  IconMenu2,
  IconSettings,
  IconUserSearch,
  IconUsers,
  IconX,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import type { Role } from "@/types";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  iconClass?: string;
};

const NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Tableau de bord",
    icon: IconLayoutDashboard,
    exact: true,
    iconClass: "text-blue-400",
  },
  {
    href: "/dashboard/prospects",
    label: "Prospects",
    icon: IconUserSearch,
    iconClass: "text-violet-400",
  },
  {
    href: "/dashboard/clients",
    label: "Clients",
    icon: IconUsers,
    iconClass: "text-emerald-400",
  },
];

const CONFORMITE_NAV: NavItem[] = [
  {
    href: "/dashboard/cartographie",
    label: "Cartographie des risques",
    icon: IconMap,
    iconClass: "text-cyan-400",
  },
  {
    href: "/dashboard/obligations",
    label: "Obligations",
    icon: IconClipboardCheck,
    iconClass: "text-amber-400",
  },
  {
    href: "/dashboard/operations-sensibles",
    label: "Opérations sensibles",
    icon: IconAlertTriangle,
    iconClass: "text-rose-400",
  },
  {
    href: "/dashboard/planning",
    label: "Planning",
    icon: IconCalendarEvent,
    iconClass: "text-teal-400",
  },
];

const ADMIN_NAV: NavItem[] = [
  {
    href: "/dashboard/admin",
    label: "Administration",
    icon: IconSettings,
    iconClass: "text-fuchsia-400",
  },
];

const ROLE_LABELS: Record<Role, string> = {
  COLLABORATEUR: "Collaborateur",
  RESPONSABLE: "Responsable",
  EXPERT_COMPTABLE: "Expert-comptable",
  ADMIN: "Administrateur",
};

function isItemActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

function NavSection({
  items,
  pathname,
}: {
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div className="space-y-1">
      {items.map(({ href, label, icon: Icon, exact, iconClass }) => {
        const active = isItemActive(pathname, href, exact);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
              active
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 font-semibold text-white shadow-lg shadow-violet-950/20"
                : "text-slate-300 hover:bg-white/10 hover:text-white",
            )}
          >
            {active && (
              <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-white" />
            )}

            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg transition",
                active ? "bg-white/15" : "bg-white/5 group-hover:bg-white/10",
              )}
            >
              <Icon
                className={cn("size-4.5", active ? "text-white" : iconClass)}
              />
            </div>

            <span className="min-w-0 flex-1 truncate">{label}</span>

            <IconChevronRight
              className={cn(
                "size-4 shrink-0 transition",
                active
                  ? "translate-x-0 text-white/80"
                  : "-translate-x-1 text-slate-500 opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
              )}
            />
          </Link>
        );
      })}
    </div>
  );
}

function MobileNav({
  pathname,
  role,
  onLogout,
}: {
  pathname: string;
  role: Role | null;
  onLogout: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
  }

  const mainItems: NavItem[] = [NAV[0], NAV[1], NAV[2], CONFORMITE_NAV[3]];

  const secondaryItems: NavItem[] = [
    CONFORMITE_NAV[0],
    CONFORMITE_NAV[1],
    CONFORMITE_NAV[2],
    ...(role === "ADMIN" ? ADMIN_NAV : []),
  ];

  return (
    <>
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
          />

          <div className="absolute bottom-20 left-3 right-3 max-h-[70vh] overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">
                  Navigation
                </p>

                <h2 className="mt-1 font-semibold text-white">
                  Autres rubriques
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex size-9 items-center justify-center rounded-xl bg-white/10 text-slate-300 transition hover:bg-white/20 hover:text-white"
              >
                <IconX className="size-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
              {secondaryItems.map(
                ({ href, label, icon: Icon, exact, iconClass }) => {
                  const active = isItemActive(pathname, href, exact);

                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "flex min-w-0 items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition",
                        active
                          ? "border-violet-400/40 bg-violet-500/20 font-semibold text-white"
                          : "border-white/5 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-xl",
                          active ? "bg-violet-500/30" : "bg-white/5",
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-5",
                            active ? "text-white" : iconClass,
                          )}
                        />
                      </div>

                      <span className="min-w-0 flex-1 truncate">{label}</span>
                    </Link>
                  );
                },
              )}

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="flex min-w-0 items-center gap-3 rounded-2xl border border-red-400/10 bg-red-500/10 px-3 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                  <IconLogout className="size-5" />
                </div>

                <span>Déconnexion</span>
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white">
                {role?.[0] ?? "?"}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {role ? ROLE_LABELS[role] : "Utilisateur"}
                </p>

                <p className="text-xs text-slate-400">Session active</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/80 bg-white/95 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden">
        <div className="grid h-[72px] grid-cols-5 px-1">
          {mainItems.map(({ href, label, icon: Icon, exact, iconClass }) => {
            const active = isItemActive(pathname, href, exact);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-medium transition",
                  active ? "text-violet-700" : "text-slate-500",
                )}
              >
                {active && (
                  <span className="absolute top-0 h-1 w-8 rounded-b-full bg-gradient-to-r from-violet-600 to-indigo-600" />
                )}

                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-xl transition",
                    active ? "bg-violet-100 shadow-sm" : "bg-transparent",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-5 transition",
                      active ? "scale-110 text-violet-700" : iconClass,
                    )}
                  />
                </div>

                <span className="max-w-full truncate px-0.5">
                  {label === "Tableau de bord" ? "Accueil" : label}
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className={cn(
              "relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-medium transition",
              menuOpen ? "text-violet-700" : "text-slate-500",
            )}
          >
            {menuOpen && (
              <span className="absolute top-0 h-1 w-8 rounded-b-full bg-gradient-to-r from-violet-600 to-indigo-600" />
            )}

            <div
              className={cn(
                "flex size-9 items-center justify-center rounded-xl transition",
                menuOpen ? "bg-violet-100" : "bg-transparent",
              )}
            >
              {menuOpen ? (
                <IconX className="size-5 text-violet-700" />
              ) : (
                <IconMenu2 className="size-5 text-slate-600" />
              )}
            </div>

            <span>Menu</span>
          </button>
        </div>
      </nav>
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
    <>
      <aside className="hidden w-72 shrink-0 flex-col overflow-hidden border-r border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white shadow-2xl md:flex">
        <div className="relative border-b border-white/10 px-5 py-5">
          <div className="pointer-events-none absolute -left-10 -top-14 size-36 rounded-full bg-violet-500/20 blur-3xl" />

          <Link href="/dashboard" className="relative flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-black text-white shadow-lg shadow-violet-950/40">
              QW
            </div>

            <div>
              <p className="text-base font-bold text-white">QW Conseils</p>

              <p className="text-xs text-slate-400">Espace conformité</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          <section>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Principal
            </p>

            <NavSection items={NAV} pathname={pathname} />
          </section>

          <section>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Conformité
            </p>

            <NavSection items={CONFORMITE_NAV} pathname={pathname} />
          </section>

          {role === "ADMIN" && (
            <section>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Administration
              </p>

              <NavSection items={ADMIN_NAV} pathname={pathname} />
            </section>
          )}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold uppercase text-white shadow-lg">
                {role?.[0] ?? "?"}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {role ? ROLE_LABELS[role] : "Utilisateur"}
                </p>

                <div className="mt-1 flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-400" />

                  <p className="text-xs text-slate-400">Connecté</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout}
                title="Se déconnecter"
                className="flex size-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-500/15 hover:text-red-300"
              >
                <IconLogout className="size-4.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <MobileNav pathname={pathname} role={role} onLogout={onLogout} />
    </>
  );
}
