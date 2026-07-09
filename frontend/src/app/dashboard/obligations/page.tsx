"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { StatusBadge } from "@/lib/status";
import type { Obligation } from "@/types";

export default function ObligationsGlobalPage() {
  const [items, setItems] = useState<Obligation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Obligation[]>("/obligations/en-retard")
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-semibold">Obligations réglementaires</h1>
      <p className="text-sm text-muted-foreground">
        Obligations actuellement en retard, tous clients confondus.
      </p>

      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Type
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Échéance
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Statut
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Chargement…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Aucune obligation en retard
                </td>
              </tr>
            ) : (
              items.map((o) => (
                <tr key={o.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{o.type}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {o.dateEcheance
                      ? new Date(o.dateEcheance).toLocaleDateString("fr-FR")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.statut} />
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
