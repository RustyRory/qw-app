"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconPlus } from "@tabler/icons-react";
import { apiFetch } from "@/lib/apiFetch";
import { StatusBadge } from "@/lib/status";
import { Button } from "@/components/ui/button";
import type { Prospect, StatutKanban } from "@/types";

const COLUMNS: StatutKanban[] = [
  "PRISE_CONTACT",
  "DECOUVERTE",
  "OPPORTUNITE",
  "LAB",
  "PREPARATION",
];

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    apiFetch<Prospect[]>("/prospects")
      .then(setProspects)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const archived = prospects.filter(
    (p) => p.statutKanban === "CONVERTI" || p.statutKanban === "REFUSE",
  );

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Prospects</h1>
        <Button asChild size="sm">
          <Link href="/dashboard/prospects/new">
            <IconPlus className="size-4" />
            Nouveau prospect
          </Link>
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-6 text-center text-sm text-muted-foreground">
          Chargement…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {COLUMNS.map((statut) => {
              const items = prospects.filter((p) => p.statutKanban === statut);
              return (
                <div key={statut} className="rounded-lg border bg-card">
                  <div className="border-b px-3 py-2">
                    <StatusBadge status={statut} />
                    <span className="ml-2 text-xs text-muted-foreground">
                      {items.length}
                    </span>
                  </div>
                  <div className="space-y-2 p-2">
                    {items.length === 0 ? (
                      <p className="p-2 text-center text-xs text-muted-foreground">
                        Vide
                      </p>
                    ) : (
                      items.map((p) => (
                        <Link
                          key={p.id}
                          href={`/dashboard/prospects/${p.id}`}
                          className="block rounded-md border bg-background p-2 text-sm transition-colors hover:bg-muted/50"
                        >
                          <p className="truncate font-medium">{p.nom}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {p.ref}
                          </p>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {archived.length > 0 && (
            <div className="rounded-lg border bg-card">
              <div className="border-b px-4 py-2 text-sm font-medium text-muted-foreground">
                Archivés (convertis / refusés)
              </div>
              <div className="divide-y">
                {archived.map((p) => (
                  <Link
                    key={p.id}
                    href={`/dashboard/prospects/${p.id}`}
                    className="flex items-center justify-between px-4 py-2 text-sm transition-colors hover:bg-muted/50"
                  >
                    <span>
                      {p.nom} — {p.ref}
                    </span>
                    <StatusBadge status={p.statutKanban} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
