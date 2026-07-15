"use client";

import { useEffect, useMemo, useState } from "react";
import {
  IconAlertTriangle,
  IconClockExclamation,
  IconSearch,
} from "@tabler/icons-react";

import { apiFetch } from "@/lib/apiFetch";
import { StatusBadge } from "@/lib/status";

import type { Obligation, TypeObligation } from "@/types";

const TYPE_LABELS: Record<TypeObligation, string> = {
  KYC_VERIFICATION: "Vérification KYC",
  EVALUATION_RISQUE: "Évaluation du risque",
  MISE_A_JOUR_DOCS: "Mise à jour des documents",
  VALIDATION_RELATION: "Validation de la relation",
  LETTRE_MISSION: "Lettre de mission",
};

function formatDate(date?: string | null) {
  if (!date) return "—";

  return new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString(
    "fr-FR",
  );
}

export default function ObligationsGlobalPage() {
  const [items, setItems] = useState<Obligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);

    apiFetch<Obligation[]>("/obligations/en-retard")
      .then(setItems)
      .catch((err: Error) => {
        setError(err.message);
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = useMemo(() => {
    const value = search.trim().toLowerCase();

    return [...items]
      .filter((obligation) => {
        if (!value) return true;

        const typeLabel =
          TYPE_LABELS[obligation.type]?.toLowerCase() ?? "";

        const date = obligation.dateEcheance
          ? formatDate(obligation.dateEcheance)
          : "";

        return (
          typeLabel.includes(value) ||
          date.toLowerCase().includes(value) ||
          obligation.statut.toLowerCase().includes(value)
        );
      })
      .sort((a, b) => {
        if (!a.dateEcheance) return 1;
        if (!b.dateEcheance) return -1;

        return (
          new Date(a.dateEcheance).getTime() -
          new Date(b.dateEcheance).getTime()
        );
      });
  }, [items, search]);

  return (
    <div className="min-h-full bg-slate-50 p-4 pb-20 sm:p-6 md:p-8 md:pb-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-700 via-orange-600 to-yellow-500 px-5 py-6 shadow-lg sm:px-7 sm:py-8">
          <div className="pointer-events-none absolute -right-14 -top-14 size-52 rounded-full bg-yellow-200/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 size-56 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white">
                <IconClockExclamation className="size-6" />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-100">
                  Conformité
                </p>

                <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                  Obligations réglementaires
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-50">
                  Consultez les obligations en retard et surveillez les
                  échéances réglementaires du cabinet.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/15 pt-5">
              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <IconAlertTriangle className="size-6 text-white" />

                  <div>
                    <p className="text-xs font-semibold uppercase text-amber-100">
                      En retard
                    </p>

                    <p className="mt-1 text-3xl font-bold text-white">
                      {loading ? "—" : items.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase text-amber-100">
                  Résultats affichés
                </p>

                <p className="mt-1 text-3xl font-bold text-white">
                  {loading ? "—" : filteredItems.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Recherche */}
        <div className="relative rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <IconSearch className="pointer-events-none absolute left-7 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher une obligation ou une date..."
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
          />
        </div>

        {/* Tableau */}
        <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-5 py-4">
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-100">
              <IconAlertTriangle className="size-5 text-amber-700" />
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-amber-800">
                Obligations en retard
              </h2>

              <p className="mt-0.5 text-xs text-amber-700/70">
                Triées par date d’échéance
              </p>
            </div>
          </div>

          {/* Ordinateur */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-200 bg-amber-50/70">
                  <th className="px-5 py-4 text-left font-semibold text-amber-800">
                    Obligation
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-amber-800">
                    Échéance
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-amber-800">
                    Statut
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-amber-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-5 py-12 text-center text-slate-400"
                    >
                      Chargement…
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-5 py-12 text-center text-slate-400"
                    >
                      Aucune obligation en retard
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((obligation) => (
                    <tr
                      key={obligation.id}
                      className="transition hover:bg-amber-50/40"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {TYPE_LABELS[obligation.type] ??
                            obligation.type}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Obligation réglementaire
                        </p>
                      </td>

                      <td className="px-5 py-4 font-mono text-slate-500">
                        {formatDate(obligation.dateEcheance)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={obligation.statut} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="divide-y divide-amber-100 md:hidden">
            {loading ? (
              <div className="p-10 text-center text-sm text-slate-400">
                Chargement…
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-400">
                Aucune obligation en retard
              </div>
            ) : (
              filteredItems.map((obligation) => (
                <article key={obligation.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {TYPE_LABELS[obligation.type] ??
                          obligation.type}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Obligation réglementaire
                      </p>
                    </div>

                    <StatusBadge status={obligation.statut} />
                  </div>

                  <div className="mt-4 rounded-xl bg-amber-50 p-3">
                    <p className="text-xs font-medium text-amber-700">
                      Date d’échéance
                    </p>

                    <p className="mt-1 font-mono text-sm font-semibold text-amber-900">
                      {formatDate(obligation.dateEcheance)}
                    </p>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}