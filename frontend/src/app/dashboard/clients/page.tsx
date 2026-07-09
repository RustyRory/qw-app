"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { apiFetch } from "@/lib/apiFetch";
import { StatusBadge } from "@/lib/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Client } from "@/types";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  function load() {
    setLoading(true);
    setError(null);
    apiFetch<Client[]>("/clients")
      .then(setClients)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.raisonSociale.toLowerCase().includes(q) ||
      c.ref.toLowerCase().includes(q) ||
      (c.siret ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Clients</h1>
        <Button asChild size="sm">
          <Link href="/dashboard/clients/new">
            <IconPlus className="size-4" />
            Nouveau client
          </Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, réf. ou SIRET…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
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
                SIRET
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Statut
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                KYC
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Chargement…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  <p className="text-sm text-destructive">{error}</p>
                  <button
                    onClick={load}
                    className="mt-2 text-sm text-primary hover:underline"
                  >
                    Réessayer
                  </button>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Aucun client trouvé
                </td>
              </tr>
            ) : (
              filtered.map((client) => (
                <tr
                  key={client.id}
                  className="transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {client.ref}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {client.raisonSociale}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {client.siret ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={client.statut} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={client.kycStatut} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/clients/${client.id}`}
                      className="text-xs text-primary hover:underline"
                    >
                      Voir →
                    </Link>
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
