"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/apiFetch";
import { RiskBadge } from "@/lib/status";
import type { Client, Prospect, Obligation, ScoreRisque } from "@/types";

interface ClientWithScore extends Client {
  score?: ScoreRisque | null;
}

const KANBAN_LABELS: Record<string, string> = {
  PRISE_CONTACT: "Prise de contact",
  DECOUVERTE: "Découverte",
  OPPORTUNITE: "Opportunité",
  LAB: "LAB à effectuer",
  PREPARATION: "Préparation client",
};

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [obligationsEnRetard, setObligationsEnRetard] = useState<Obligation[]>(
    [],
  );
  const [clientsRisqueEleve, setClientsRisqueEleve] = useState<
    ClientWithScore[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([
      apiFetch<Client[]>("/clients"),
      apiFetch<Prospect[]>("/prospects"),
      apiFetch<Obligation[]>("/obligations/en-retard").catch(() => []),
    ])
      .then(async ([clientsData, prospectsData, obligationsData]) => {
        setClients(clientsData);
        setProspects(prospectsData);
        setObligationsEnRetard(obligationsData);
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
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const clientsActifs = clients.filter((c) => c.statut === "ACTIF").length;
  const prospectsActifs = prospects.filter(
    (p) => p.statutKanban !== "CONVERTI" && p.statutKanban !== "REFUSE",
  ).length;

  const kpis = [
    {
      label: "Prospects actifs",
      value: prospectsActifs,
      colorLeft: "border-l-blue-500",
      colorText: "text-blue-600",
      icon: "↗",
    },
    {
      label: "Clients actifs",
      value: clientsActifs,
      colorLeft: "border-l-emerald-500",
      colorText: "text-emerald-600",
      icon: "⚡",
    },
    {
      label: "Risque Élevé",
      value: clientsRisqueEleve.length,
      colorLeft: "border-l-red-500",
      colorText: "text-red-600",
      icon: "⚠",
    },
    {
      label: "Obligations en retard",
      value: obligationsEnRetard.length,
      colorLeft: "border-l-amber-500",
      colorText: "text-amber-600",
      icon: "🕐",
    },
  ];

  return (
    <div className="min-h-full bg-slate-50">
      {/* ── Hero header ── */}
      <div
        className="px-5 pt-6 pb-8 md:px-8"
        style={{
          background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
        }}
      >
        <p className="text-blue-200 text-xs font-medium uppercase tracking-widest mb-1">
          {new Date().toLocaleDateString("fr-FR", {
            month: "long",
            year: "numeric",
          })}
        </p>
        <h1 className="text-white text-2xl font-bold">Tableau de bord</h1>
        <p className="text-blue-100 text-sm mt-0.5">
          Vue d&apos;ensemble du cabinet
        </p>
      </div>

      <div className="px-4 -mt-4 space-y-4 pb-4 md:px-8 md:space-y-6">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* KPIs — 2×2 mobile, 4×1 desktop */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {kpis.map(({ label, value, colorLeft, colorText, icon }) => (
            <div
              key={label}
              className={`bg-white rounded-2xl border-l-4 ${colorLeft} p-4 shadow-sm border border-white`}
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
                <span className={`text-lg ${colorText} opacity-60`}>
                  {icon}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Clients à risque élevé + Obligations */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Clients à risque élevé */}
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
                        background: "linear-gradient(135deg, #ef4444, #b91c1c)",
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
                        {o.type}
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
                "DECOUVERTE",
                "OPPORTUNITE",
                "LAB",
                "PREPARATION",
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
