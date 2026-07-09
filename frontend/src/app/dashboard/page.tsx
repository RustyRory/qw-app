"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/apiFetch";
import { StatusBadge, RiskBadge } from "@/lib/status";
import type { Client, Prospect, Obligation, ScoreRisque } from "@/types";

interface ClientWithScore extends Client {
  score?: ScoreRisque | null;
}

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
      apiFetch<Obligation[]>("/obligations/en-retard"),
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
    { label: "Prospects actifs", value: prospectsActifs },
    { label: "Clients actifs", value: clientsActifs },
    { label: "Risque élevé", value: clientsRisqueEleve.length },
    { label: "Obligations en retard", value: obligationsEnRetard.length },
  ];

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">Tableau de bord</h1>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kpis.map(({ label, value }) => (
          <div key={label} className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold">
              {loading ? "—" : value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-medium">Clients à risque élevé</h2>
            <Link
              href="/dashboard/cartographie"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Voir la cartographie →
            </Link>
          </div>
          <div className="divide-y">
            {loading ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Chargement…
              </div>
            ) : clientsRisqueEleve.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Aucun client à risque élevé
              </div>
            ) : (
              clientsRisqueEleve.slice(0, 5).map((client) => (
                <Link
                  key={client.id}
                  href={`/dashboard/clients/${client.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {client.raisonSociale}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {client.ref}
                    </p>
                  </div>
                  {client.score && (
                    <span className="text-xs text-muted-foreground">
                      {client.score.score}
                    </span>
                  )}
                  <RiskBadge level="ELEVE" />
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-medium">Obligations en retard</h2>
            <Link
              href="/dashboard/obligations"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Voir tout →
            </Link>
          </div>
          <div className="divide-y">
            {loading ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Chargement…
              </div>
            ) : obligationsEnRetard.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Aucune obligation en retard
              </div>
            ) : (
              obligationsEnRetard.slice(0, 5).map((obligation) => (
                <div
                  key={obligation.id}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <span className="text-sm font-medium">{obligation.type}</span>
                  <StatusBadge status={obligation.statut} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-medium">Prospects en pipeline</h2>
          <Link
            href="/dashboard/prospects"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Voir le Kanban →
          </Link>
        </div>
        <div className="flex flex-wrap gap-2 p-4">
          {loading ? (
            <span className="text-sm text-muted-foreground">Chargement…</span>
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
                <div
                  key={statut}
                  className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
                >
                  <StatusBadge status={statut} />
                  <span className="text-muted-foreground">{count}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
