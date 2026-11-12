"use client";

import { useEffect, useState } from "react";
import type React from "react";
import Link from "next/link";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconCalendarEvent,
  IconClipboardCheck,
  IconLayoutDashboard,
  IconMap,
  IconSettings,
  IconSignature,
  IconUserSearch,
  IconUsers,
} from "@tabler/icons-react";

import { apiFetch } from "@/lib/apiFetch";
import { RiskBadge, OBLIGATION_TYPE_LABELS } from "@/lib/status";
import { useRole } from "@/hooks/useRole";
import {
  SOURCE_DOT_CLASSES,
  SOURCE_LABELS,
  echeanceEntiteLabel,
  echeanceHref,
} from "@/components/calendar-month-grid";
import type {
  Client,
  Prospect,
  Obligation,
  ScoreRisque,
  EcheanceCalendrier,
  SourceEcheance,
} from "@/types";

interface ClientWithScore extends Client {
  score?: ScoreRisque | null;
}

const KANBAN_LABELS: Record<string, string> = {
  PRISE_CONTACT: "Prise de contact",
  PREPARATION_LAB: "Préparation LAB",
  VALIDATION_LAB: "Validation LAB",
  LM_A_FAIRE: "LM à faire",
  LM_ENVOYEE: "LM envoyées",
};

const TAB_BY_SOURCE: Record<SourceEcheance, string> = {
  OBLIGATION: "obligations",
  PLANNING: "planning",
  MISSION: "missions",
};

function formatDate(date?: string | null) {
  if (!date) return "—";

  return new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString("fr-FR");
}

export default function DashboardPage() {
  const { ready, role, can } = useRole();

  const peutCreerProspectClient =
    role === "COLLABORATEUR" || role === "RESPONSABLE" || role === "ADMIN";

  const [clients, setClients] = useState<Client[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [obligationsEnRetard, setObligationsEnRetard] = useState<Obligation[]>(
    [],
  );
  const [echeances, setEcheances] = useState<EcheanceCalendrier[]>([]);
  const [clientsRisqueEleve, setClientsRisqueEleve] = useState<
    ClientWithScore[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([
      apiFetch<Client[]>("/clients"),
      apiFetch<Prospect[]>("/prospects"),
      apiFetch<Obligation[]>("/obligations/en-retard").catch(() => []),
      apiFetch<EcheanceCalendrier[]>("/planning/calendrier").catch(() => []),
    ])
      .then(
        async ([
          clientsData,
          prospectsData,
          obligationsData,
          echeancesData,
        ]) => {
          setClients(clientsData);
          setProspects(prospectsData);
          setObligationsEnRetard(obligationsData);
          setEcheances(echeancesData);

          if (can.voirCartographie) {
            const scored = await Promise.all(
              clientsData.map(async (client) => {
                const score = await apiFetch<ScoreRisque | null>(
                  `/scoring/client/${client.id}/courant`,
                ).catch(() => null);
                return { ...client, score };
              }),
            );
            setClientsRisqueEleve(
              scored.filter((c) => c.score?.niveau === "ELEVE"),
            );
          }
        },
      )
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ready, can.voirCartographie]);

  const clientsActifs = clients.filter((c) => c.statut === "ACTIF").length;
  const prospectsActifs = prospects.filter(
    (p) => p.statutKanban !== "CONVERTI" && p.statutKanban !== "REFUSE",
  ).length;

  const prochainesEcheances = [...echeances]
    .filter((e) => e.dateEcheance)
    .sort((a, b) => (a.dateEcheance! < b.dateEcheance! ? -1 : 1))
    .slice(0, 5);

  const kpis: {
    label: string;
    value: number;
    href: string;
    colorLeft: string;
    colorText: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      label: "Prospects actifs",
      value: prospectsActifs,
      href: "/dashboard/prospects",
      colorLeft: "border-l-violet-500",
      colorText: "text-violet-600",
      icon: IconUserSearch,
    },
    {
      label: "Clients actifs",
      value: clientsActifs,
      href: "/dashboard/clients",
      colorLeft: "border-l-emerald-500",
      colorText: "text-emerald-600",
      icon: IconUsers,
    },
    ...(can.voirCartographie
      ? [
          {
            label: "Risque élevé",
            value: clientsRisqueEleve.length,
            href: "/dashboard/cartographie",
            colorLeft: "border-l-red-500",
            colorText: "text-red-600",
            icon: IconAlertTriangle,
          },
        ]
      : []),
    {
      label: "Obligations en retard",
      value: obligationsEnRetard.length,
      href: "/dashboard/obligations",
      colorLeft: "border-l-amber-500",
      colorText: "text-amber-600",
      icon: IconClipboardCheck,
    },
  ];

  const quickActions: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    bg: string;
    text: string;
  }[] = [
    ...(peutCreerProspectClient
      ? [
          {
            href: "/dashboard/prospects/new",
            label: "Nouveau prospect",
            icon: IconUserSearch,
            bg: "bg-violet-100",
            text: "text-violet-700",
          },
        ]
      : []),
    ...(can.voirCartographie
      ? [
          {
            href: "/dashboard/cartographie",
            label: "Cartographie des risques",
            icon: IconMap,
            bg: "bg-cyan-100",
            text: "text-cyan-700",
          },
        ]
      : []),
    {
      href: "/dashboard/planning",
      label: "Planning & échéances",
      icon: IconCalendarEvent,
      bg: "bg-teal-100",
      text: "text-teal-700",
    },
    {
      href: "/dashboard/operations-sensibles",
      label: "Opérations sensibles",
      icon: IconAlertTriangle,
      bg: "bg-rose-100",
      text: "text-rose-700",
    },
    {
      href: "/dashboard/obligations",
      label: "Obligations",
      icon: IconClipboardCheck,
      bg: "bg-amber-100",
      text: "text-amber-700",
    },
    ...(role === "ADMIN"
      ? [
          {
            href: "/dashboard/admin/users",
            label: "Gestion des utilisateurs",
            icon: IconSettings,
            bg: "bg-fuchsia-100",
            text: "text-fuchsia-700",
          },
        ]
      : []),
    {
      href: "/dashboard/profil",
      label: "Ma signature",
      icon: IconSignature,
      bg: "bg-indigo-100",
      text: "text-indigo-700",
    },
  ];

  return (
    <div className="min-h-full bg-slate-50">
      {/* ── Hero header ── */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-800 via-indigo-700 to-violet-700 px-5 pt-6 pb-8 shadow-lg md:px-8 md:pt-8 md:pb-10">
        <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-violet-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-blue-300/20 blur-3xl" />

        <div className="relative flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-inner backdrop-blur-sm">
            <IconLayoutDashboard className="size-6 text-white" />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">
              {new Date().toLocaleDateString("fr-FR", {
                month: "long",
                year: "numeric",
              })}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
              Tableau de bord
            </h1>
            <p className="mt-1 text-sm text-blue-100">
              Vue d&apos;ensemble du cabinet
            </p>
          </div>
        </div>
      </section>

      <div className="relative px-4 -mt-4 space-y-4 pb-4 md:px-8 md:space-y-6">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* KPIs — 2×2 mobile, 4×1 desktop */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {kpis.map(
            ({ label, value, href, colorLeft, colorText, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className={`group bg-white rounded-2xl border-l-4 ${colorLeft} p-4 shadow-sm border border-white transition hover:-translate-y-0.5 hover:shadow-md`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-2xl font-bold ${colorText}`}>
                      {loading ? "—" : value}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-tight">
                      {label}
                    </p>
                  </div>
                  <Icon
                    className={`size-5 ${colorText} opacity-60 transition group-hover:opacity-100`}
                  />
                </div>
              </Link>
            ),
          )}
        </div>

        {/* Navigation rapide */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-700">
              Navigation rapide
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map(({ href, label, icon: Icon, bg, text }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${bg}`}
                >
                  <Icon className={`size-5 ${text}`} />
                </div>
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">
                  {label}
                </p>
                <IconArrowRight className="size-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
              </Link>
            ))}
          </div>
        </div>

        {/* Clients à risque élevé + Prochaines échéances + Obligations */}
        <div
          className={`grid grid-cols-1 gap-4 ${
            can.voirCartographie ? "lg:grid-cols-3" : "md:grid-cols-2"
          }`}
        >
          {/* Clients à risque élevé */}
          {can.voirCartographie && (
            <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-red-50 bg-red-50/50">
                <h2 className="text-xs font-bold uppercase tracking-widest text-red-600">
                  Clients à risque élevé
                </h2>
                <Link
                  href="/dashboard/cartographie"
                  className="text-xs text-red-500 font-medium hover:text-red-700"
                >
                  Voir cartographie →
                </Link>
              </div>
              <div className="divide-y divide-slate-50">
                {loading ? (
                  <div className="p-6 text-center text-sm text-slate-400">
                    Chargement…
                  </div>
                ) : clientsRisqueEleve.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-400">
                    Aucun client à risque élevé
                  </div>
                ) : (
                  clientsRisqueEleve.slice(0, 5).map((client) => (
                    <Link
                      key={client.id}
                      href={`/dashboard/clients/${client.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                    >
                      <div
                        className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{
                          background:
                            "linear-gradient(135deg, #ef4444, #b91c1c)",
                        }}
                      >
                        {client.raisonSociale?.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {client.raisonSociale}
                        </p>
                        <p className="text-xs text-slate-400 font-mono">
                          {client.ref}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {client.score && (
                          <span className="text-xs text-slate-400">
                            {client.score.score}/100
                          </span>
                        )}
                        <RiskBadge level="ELEVE" />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Prochaines échéances */}
          <div className="bg-white rounded-2xl shadow-sm border border-teal-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-teal-50 bg-teal-50/50">
              <h2 className="text-xs font-bold uppercase tracking-widest text-teal-600">
                Prochaines échéances
              </h2>
              <Link
                href="/dashboard/planning"
                className="text-xs text-teal-600 font-medium hover:text-teal-800"
              >
                Voir le calendrier →
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {loading ? (
                <div className="p-6 text-center text-sm text-slate-400">
                  Chargement…
                </div>
              ) : prochainesEcheances.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-400">
                  Aucune échéance à venir
                </div>
              ) : (
                prochainesEcheances.map((item) => (
                  <Link
                    key={`${item.source}-${item.id}`}
                    href={echeanceHref(item, TAB_BY_SOURCE[item.source])}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                  >
                    <span
                      className={`size-2 shrink-0 rounded-full ${SOURCE_DOT_CLASSES[item.source]}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {item.titre}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {SOURCE_LABELS[item.source]} ·{" "}
                        {echeanceEntiteLabel(item)}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">
                      {formatDate(item.dateEcheance)}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Obligations en retard */}
          <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-amber-50 bg-amber-50/50">
              <h2 className="text-xs font-bold uppercase tracking-widest text-amber-600">
                Obligations en retard
              </h2>
              <Link
                href="/dashboard/obligations"
                className="text-xs text-amber-500 font-medium hover:text-amber-700"
              >
                Voir tout →
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {loading ? (
                <div className="p-6 text-center text-sm text-slate-400">
                  Chargement…
                </div>
              ) : obligationsEnRetard.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-400">
                  Aucune obligation en retard
                </div>
              ) : (
                obligationsEnRetard.slice(0, 5).map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {OBLIGATION_TYPE_LABELS[o.type] ?? o.type}
                      </p>
                      {o.dateEcheance && (
                        <p className="text-xs text-red-500 mt-0.5">
                          {new Date(o.dateEcheance).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-red-600 shrink-0 ml-2">
                      EN RETARD
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Pipeline prospects */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-emerald-50/30">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-700">
              Prospects en pipeline
            </h2>
            <Link
              href="/dashboard/prospects"
              className="text-xs text-emerald-600 font-medium hover:text-emerald-800"
            >
              Voir Kanban →
            </Link>
          </div>
          <div className="px-4 py-3 flex flex-wrap gap-x-4 gap-y-2">
            {loading ? (
              <p className="text-sm text-slate-400">Chargement…</p>
            ) : (
              [
                "PRISE_CONTACT",
                "PREPARATION_LAB",
                "VALIDATION_LAB",
                "LM_A_FAIRE",
                "LM_ENVOYEE",
              ].map((statut) => {
                const count = prospects.filter(
                  (p) => p.statutKanban === statut,
                ).length;
                return (
                  <div key={statut} className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">
                      {KANBAN_LABELS[statut]}
                    </span>
                    <span className="flex size-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                      {count}
                    </span>
                    <span className="text-slate-300 hidden sm:inline">›</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
