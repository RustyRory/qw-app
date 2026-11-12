"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconArrowLeft, IconRestore } from "@tabler/icons-react";

import { apiFetch } from "@/lib/apiFetch";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import type { Prospect } from "@/types";

type ProspectArchive = Prospect & { deletedAt?: string | null };

function formatDate(iso?: string | null) {
  return iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";
}

// Prospects archivés (refusés depuis plus de 7 jours, ou supprimés) :
// consultation et réactivation (responsable, expert-comptable, admin).
export default function ProspectsArchivesPage() {
  const router = useRouter();
  const { role } = useRole();
  const peutReactiver = role !== null && role !== "COLLABORATEUR";
  const [prospects, setProspects] = useState<ProspectArchive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<ProspectArchive[]>("/prospects/archives")
      .then(setProspects)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function reactiver(p: ProspectArchive) {
    if (
      !window.confirm(
        `Réactiver « ${p.nom} » ? Il reviendra dans le pipeline en « Prise de contact ».`,
      )
    ) {
      return;
    }
    setBusyId(p.id);
    setError(null);
    try {
      await apiFetch(`/prospects/${p.id}/reactiver`, { method: "POST" });
      router.push(`/dashboard/prospects/${p.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-full bg-slate-50 pb-20 md:pb-8">
      <header className="border-b bg-white px-4 py-4 sm:px-6 md:px-8">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <Link
            href="/dashboard/prospects"
            aria-label="Retour aux prospects"
            className="flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
          >
            <IconArrowLeft className="size-4" />
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-600">
              Prospects
            </p>
            <h1 className="text-xl font-bold text-slate-900">Archivés</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-3 px-4 py-6 sm:px-6 md:px-8">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {loading ? (
          <p className="py-10 text-center text-sm text-slate-400">
            Chargement…
          </p>
        ) : prospects.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white py-10 text-center text-sm text-slate-400">
            Aucun prospect archivé
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {prospects.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800">
                    {p.nom}{" "}
                    <span className="font-mono text-xs font-normal text-slate-400">
                      {p.ref}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Archivé le {formatDate(p.deletedAt)}
                    {p.motifRefus ? ` · Motif : ${p.motifRefus}` : ""}
                  </p>
                </div>
                {peutReactiver && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === p.id}
                    onClick={() => reactiver(p)}
                    className="rounded-xl"
                  >
                    <IconRestore className="size-4" />
                    {busyId === p.id ? "Réactivation…" : "Réactiver"}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
