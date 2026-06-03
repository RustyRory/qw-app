"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/apiFetch";
import { StatusBadge } from "@/lib/status";
import type { Client } from "@/types";

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Client[]>("/clients")
      .then(setClients)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const enCours = clients.filter((c) => c.statut === "en_cours").length;
  const valides = clients.filter((c) => c.statut === "valide").length;
  const rejetes = clients.filter((c) => c.statut === "rejete").length;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">Tableau de bord</h1>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total clients", value: clients.length, color: "" },
          { label: "En cours", value: enCours, color: "text-yellow-600" },
          { label: "Validés", value: valides, color: "text-green-600" },
          { label: "Rejetés", value: rejetes, color: "text-red-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`mt-1 text-2xl font-semibold ${color}`}>
              {loading ? "—" : value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-medium">Clients récents</h2>
          <Link
            href="/dashboard/clients"
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
          ) : clients.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Aucun client
            </div>
          ) : (
            clients.slice(0, 10).map((client) => (
              <Link
                key={client.id}
                href={`/dashboard/clients/${client.id}`}
                className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {client.prenom} {client.nom}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {client.email ?? client.reference}
                  </p>
                </div>
                <StatusBadge status={client.statut} />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
