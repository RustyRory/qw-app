"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Activity,
  AlertTriangle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import { RiskBadge } from "@/lib/status";
import type {
  Client,
  Prospect,
  Obligation,
  ScoreRisque,
  AuditLog,
} from "@/types";

interface ClientWithScore extends Client {
  score?: ScoreRisque | null;
}

interface ObligationWithClient extends Obligation {
  client: Client;
}

const PIPELINE_STAGES: { statut: Prospect["statutKanban"]; label: string }[] = [
  { statut: "PRISE_CONTACT", label: "Prise de contact" },
  { statut: "DECOUVERTE", label: "Découverte" },
  { statut: "OPPORTUNITE", label: "Opportunité" },
  { statut: "LAB", label: "LAB à effectuer" },
  { statut: "PREPARATION", label: "Préparation client" },
];

const ACTION_LABEL: Record<string, string> = {
  CREATE: "a créé",
  UPDATE: "a modifié",
  DELETE: "a supprimé",
  VALIDATE: "a validé",
  READ: "a consulté",
  LOGIN: "s'est connecté",
};

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
}

function initials(prenom: string, nom: string): string {
  return `${prenom[0] ?? ""}${nom[0] ?? ""}`.toUpperCase();
}

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [clientsRisqueEleve, setClientsRisqueEleve] = useState<
    ClientWithScore[]
  >([]);
  const [obligationsEnRetard, setObligationsEnRetard] = useState<
    ObligationWithClient[]
  >([]);
  const [activite, setActivite] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([
      apiFetch<Client[]>("/clients"),
      apiFetch<Prospect[]>("/prospects"),
    ])
      .then(async ([clientsData, prospectsData]) => {
        setClients(clientsData);
        setProspects(prospectsData);

        const perClient = await Promise.all(
          clientsData.map(async (client) => {
            const [score, obligations] = await Promise.all([
              apiFetch<ScoreRisque | null>(
                `/scoring/client/${client.id}/courant`,
              ).catch(() => null),
              apiFetch<Obligation[]>(`/obligations/client/${client.id}`).catch(
                () => [],
              ),
            ]);
            return { client, score, obligations };
          }),
        );

        setClientsRisqueEleve(
          perClient
            .filter((c) => c.score?.niveau === "ELEVE")
            .map((c) => ({ ...c.client, score: c.score })),
        );

        setObligationsEnRetard(
          perClient
            .flatMap((c) =>
              c.obligations
                .filter((o) => o.statut === "EN_RETARD")
                .map((o) => ({ ...o, client: c.client })),
            )
            .sort(
              (a, b) =>
                new Date(a.dateEcheance ?? 0).getTime() -
                new Date(b.dateEcheance ?? 0).getTime(),
            ),
        );

        apiFetch<AuditLog[]>("/audit")
          .then((logs) => setActivite(logs.slice(0, 10)))
          .catch(() => setActivite([]));
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
      border: "border-l-blue-400",
      icon: TrendingUp,
      iconColor: "text-blue-500",
    },
    {
      label: "Clients actifs",
      value: clientsActifs,
      border: "border-l-green-400",
      icon: Activity,
      iconColor: "text-green-500",
    },
    {
      label: "Risque élevé",
      value: clientsRisqueEleve.length,
      border: "border-l-red-400",
      icon: AlertTriangle,
      iconColor: "text-red-500",
    },
    {
      label: "Obligations en retard",
      value: obligationsEnRetard.length,
      border: "border-l-amber-400",
      icon: Clock,
      iconColor: "text-amber-500",
    },
  ];

  const moisAnnee = new Date().toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">
          Tableau de bord
        </h1>
        <span className="text-sm capitalize text-muted-foreground">
          {moisAnnee}
        </span>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded border border-border border-l-4 bg-card p-4 ${kpi.border}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {loading ? "—" : kpi.value}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {kpi.label}
                </div>
              </div>
              <kpi.icon size={18} className={kpi.iconColor} />
            </div>
          </div>
        ))}
      </div>

      {/* Clients à risque élevé + Obligations en retard */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded border border-red-200 bg-red-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-red-800">
              Clients à risque élevé
            </h2>
            <Link
              href="/dashboard/cartographie"
              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
            >
              Voir cartographie <ArrowRight size={10} />
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-red-800/60">Chargement…</p>
          ) : clientsRisqueEleve.length === 0 ? (
            <p className="text-sm text-red-800/60">
              Aucun client à risque élevé
            </p>
          ) : (
            <div className="space-y-2">
              {clientsRisqueEleve.slice(0, 5).map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between border-b border-red-100 py-1.5 last:border-0"
                >
                  <Link
                    href={`/dashboard/clients/${client.id}`}
                    className="text-sm font-medium text-foreground hover:text-primary"
                  >
                    {client.raisonSociale}
                  </Link>
                  <div className="flex items-center gap-2">
                    {client.score && (
                      <span className="font-mono text-xs text-muted-foreground">
                        {client.score.score} / 150
                      </span>
                    )}
                    <RiskBadge level="ELEVE" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded border border-amber-200 bg-amber-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-800">
              Obligations en retard
            </h2>
            <Link
              href="/dashboard/obligations"
              className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800"
            >
              Voir tout <ArrowRight size={10} />
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-amber-800/60">Chargement…</p>
          ) : obligationsEnRetard.length === 0 ? (
            <p className="text-sm text-amber-800/60">
              Aucune obligation en retard
            </p>
          ) : (
            <div className="space-y-2">
              {obligationsEnRetard.slice(0, 5).map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between border-b border-amber-100 py-1.5 last:border-0"
                >
                  <div>
                    <Link
                      href={`/dashboard/clients/${o.client.id}?tab=obligations`}
                      className="text-sm font-medium text-foreground hover:text-primary"
                    >
                      {o.client.raisonSociale}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {o.type}
                    </div>
                  </div>
                  <span className="ml-2 flex-shrink-0 font-mono text-[11px] text-amber-700">
                    {o.dateEcheance &&
                      new Date(o.dateEcheance).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Prospects en pipeline */}
      <div className="mb-4 rounded border border-green-200 bg-green-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-green-800">
            Prospects en pipeline
          </h2>
          <Link
            href="/dashboard/prospects"
            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800"
          >
            Voir Kanban <ArrowRight size={10} />
          </Link>
        </div>
        {loading ? (
          <p className="text-sm text-green-800/60">Chargement…</p>
        ) : (
          <div className="flex flex-wrap items-center gap-6">
            {PIPELINE_STAGES.map((stage, i) => (
              <div key={stage.statut} className="flex items-center gap-2">
                <span className="text-sm text-green-900">{stage.label}</span>
                <span className="flex size-5 items-center justify-center rounded-full bg-green-200 text-xs font-semibold text-green-800">
                  {
                    prospects.filter((p) => p.statutKanban === stage.statut)
                      .length
                  }
                </span>
                {i < PIPELINE_STAGES.length - 1 && (
                  <span className="text-green-300">›</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activité récente */}
      {activite.length > 0 && (
        <div className="rounded border border-purple-200 bg-purple-50 p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-purple-800">
            Activité récente — audit trail (10 derniers logs)
          </h2>
          <div className="space-y-1.5">
            {activite.map((log) => (
              <div key={log.id} className="flex items-center gap-2 text-sm">
                <div className="flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-purple-200 text-[10px] font-bold text-purple-800">
                  {log.utilisateur
                    ? initials(log.utilisateur.prenom, log.utilisateur.nom)
                    : "?"}
                </div>
                <span className="font-medium text-foreground">
                  {log.utilisateur
                    ? `${log.utilisateur.prenom} ${log.utilisateur.nom}`
                    : "Système"}
                </span>
                <span className="text-muted-foreground">
                  {ACTION_LABEL[log.action] ?? log.action}
                </span>
                <span className="font-medium text-foreground">
                  {log.ressource}
                </span>
                <span className="ml-auto flex-shrink-0 text-xs text-muted-foreground">
                  {timeAgo(log.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
