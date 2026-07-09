"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/apiFetch";
import { RiskBadge } from "@/lib/status";
import type { Client, ScoreRisque, NiveauRisque } from "@/types";

interface ClientWithScore {
  client: Client;
  score: ScoreRisque | null;
}

export default function CartographiePage() {
  const [rows, setRows] = useState<ClientWithScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Client[]>("/clients")
      .then(async (clients) => {
        const withScores = await Promise.all(
          clients.map(async (client) => {
            const score = await apiFetch<ScoreRisque | null>(
              `/scoring/client/${client.id}/courant`,
            ).catch(() => null);
            return { client, score };
          }),
        );
        setRows(withScores);
      })
      .finally(() => setLoading(false));
  }, []);

  const counts: Record<NiveauRisque, number> = {
    FAIBLE: rows.filter((r) => r.score?.niveau === "FAIBLE").length,
    MOYEN: rows.filter((r) => r.score?.niveau === "MOYEN").length,
    ELEVE: rows.filter((r) => r.score?.niveau === "ELEVE").length,
  };

  const sorted = [...rows].sort(
    (a, b) => (b.score?.score ?? -1) - (a.score?.score ?? -1),
  );

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-semibold">Cartographie des risques</h1>

      <div className="grid grid-cols-3 gap-4">
        {(["FAIBLE", "MOYEN", "ELEVE"] as NiveauRisque[]).map((niveau) => (
          <div key={niveau} className="rounded-lg border bg-card p-4">
            <RiskBadge level={niveau} />
            <p className="mt-2 text-2xl font-semibold">
              {loading ? "—" : counts[niveau]}
            </p>
            <p className="text-xs text-muted-foreground">clients</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Réf.
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Raison sociale
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Score
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Niveau
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Dernière éval.
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Chargement…
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Aucun client
                </td>
              </tr>
            ) : (
              sorted.map(({ client, score }) => (
                <tr
                  key={client.id}
                  className="transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {client.ref}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/dashboard/clients/${client.id}`}
                      className="hover:underline"
                    >
                      {client.raisonSociale}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {score ? `${score.score} / 150` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {score ? <RiskBadge level={score.niveau} /> : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {score
                      ? new Date(score.createdAt).toLocaleDateString("fr-FR")
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
