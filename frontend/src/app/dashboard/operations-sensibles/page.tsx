"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/apiFetch";
import { StatusBadge } from "@/lib/status";
import type { Client, OperationSensible } from "@/types";

interface Row extends OperationSensible {
  client: Client;
}

export default function OperationsSensiblesGlobalPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Client[]>("/clients")
      .then(async (clients) => {
        const perClient = await Promise.all(
          clients.map(async (client) => {
            const ops = await apiFetch<OperationSensible[]>(
              `/operations-sensibles/client/${client.id}`,
            ).catch(() => []);
            return ops.map((op) => ({ ...op, client }));
          }),
        );
        setRows(
          perClient
            .flat()
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            ),
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    SIGNALEE: rows.filter((r) => r.statut === "SIGNALEE").length,
    EN_ANALYSE: rows.filter((r) => r.statut === "EN_ANALYSE").length,
    CLASSEE: rows.filter((r) => r.statut === "CLASSEE").length,
    TRACFIN_DECLARE: rows.filter((r) => r.statut === "TRACFIN_DECLARE").length,
  };

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-semibold">Opérations sensibles</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(
          [
            ["Signalées", counts.SIGNALEE],
            ["En analyse", counts.EN_ANALYSE],
            ["Classées", counts.CLASSEE],
            ["TRACFIN déclaré", counts.TRACFIN_DECLARE],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold">
              {loading ? "—" : value}
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Date
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Client
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Type
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Montant
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
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Chargement…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Aucune opération sensible
                </td>
              </tr>
            ) : (
              rows.map((op) => (
                <tr key={op.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(op.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/dashboard/clients/${op.client.id}?tab=operations`}
                      className="hover:underline"
                    >
                      {op.client.raisonSociale}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{op.type}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {op.montant != null
                      ? `${op.montant} ${op.devise ?? ""}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={op.statut} />
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
