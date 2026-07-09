"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/apiFetch";
import { StatusBadge } from "@/lib/status";
import type { Client, PlanningEtape } from "@/types";

interface Row extends PlanningEtape {
  client: Client;
}

export default function PlanningGlobalPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Client[]>("/clients")
      .then(async (clients) => {
        const perClient = await Promise.all(
          clients.map(async (client) => {
            const etapes = await apiFetch<PlanningEtape[]>(
              `/planning/client/${client.id}`,
            ).catch(() => []);
            return etapes.map((e) => ({ ...e, client }));
          }),
        );
        setRows(
          perClient
            .flat()
            .filter((e) => e.statut !== "FAIT" && e.statut !== "ANNULEE")
            .sort((a, b) => {
              if (!a.dateEcheance) return 1;
              if (!b.dateEcheance) return -1;
              return (
                new Date(a.dateEcheance).getTime() -
                new Date(b.dateEcheance).getTime()
              );
            }),
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-semibold">Planning cabinet</h1>
      <p className="text-sm text-muted-foreground">
        Étapes à faire ou en cours, tous clients confondus, triées par échéance.
      </p>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Statut
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Étape
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Client
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Échéance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Chargement…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Aucune étape planifiée
                </td>
              </tr>
            ) : (
              rows.map((e) => (
                <tr key={e.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <StatusBadge status={e.statut} />
                  </td>
                  <td className="px-4 py-3 font-medium">{e.titre}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/clients/${e.client.id}?tab=planning`}
                      className="hover:underline"
                    >
                      {e.client.raisonSociale}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {e.dateEcheance
                      ? new Date(e.dateEcheance).toLocaleDateString("fr-FR")
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
