"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  IconAlertTriangle,
  IconCalendarEvent,
  IconChevronRight,
  IconClock,
  IconSearch,
} from "@tabler/icons-react";

import { apiFetch } from "@/lib/apiFetch";
import { StatusBadge } from "@/lib/status";

import type {
  Client,
  PlanningEtape,
  TypePlanningEtape,
} from "@/types";

interface PlanningRow extends PlanningEtape {
  client: Client;
}

const TYPE_LABELS: Record<TypePlanningEtape, string> = {
  REGLEMENTAIRE: "Réglementaire",
  MANUELLE: "Manuelle",
};

const TYPE_CLASSES: Record<TypePlanningEtape, string> = {
  REGLEMENTAIRE: "bg-blue-100 text-blue-700",
  MANUELLE: "bg-slate-100 text-slate-600",
};

function formatDate(date?: string | null) {
  if (!date) return "—";

  return new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString(
    "fr-FR",
  );
}

function getMonthKey(date?: string | null) {
  if (!date) return "sans-date";

  const value = new Date(`${date.slice(0, 10)}T00:00:00`);

  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

function getMonthLabel(monthKey: string) {
  if (monthKey === "sans-date") {
    return "Sans date d’échéance";
  }

  const [year, month] = monthKey.split("-");

  return new Date(Number(year), Number(month) - 1, 1)
    .toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    })
    .toUpperCase();
}

function getAssignedName(row: PlanningRow) {
  if (!row.assignedTo) return "Non assigné";

  return `${row.assignedTo.prenom} ${row.assignedTo.nom}`;
}

export default function PlanningGlobalPage() {
  const [rows, setRows] = useState<PlanningRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
  const timeoutId = window.setTimeout(() => {
    setLoading(true);
    setError(null);

    apiFetch<Client[]>("/clients")
      .then(async (clients) => {
        const perClient = await Promise.all(
          clients.map(async (client) => {
            const etapes = await apiFetch<PlanningEtape[]>(
              `/planning/client/${client.id}`,
            ).catch(() => []);

            return etapes.map((etape) => ({
              ...etape,
              client,
            }));
          }),
        );

        setRows(
          perClient
            .flat()
            .filter(
              (etape) =>
                etape.statut !== "FAIT" &&
                etape.statut !== "ANNULEE",
            )
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
      .catch((err: Error) => {
        setError(err.message);
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, 0);

  return () => window.clearTimeout(timeoutId);
}, []);

  const filteredRows = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return rows;

    return rows.filter((row) => {
      const assignedName = getAssignedName(row).toLowerCase();

      return (
        row.titre.toLowerCase().includes(value) ||
        row.client.raisonSociale.toLowerCase().includes(value) ||
        row.client.ref.toLowerCase().includes(value) ||
        TYPE_LABELS[row.type].toLowerCase().includes(value) ||
        assignedName.includes(value)
      );
    });
  }, [rows, search]);

  const groupedRows = useMemo(() => {
    return filteredRows.reduce<Record<string, PlanningRow[]>>(
      (groups, row) => {
        const key = getMonthKey(row.dateEcheance);

        if (!groups[key]) {
          groups[key] = [];
        }

        groups[key].push(row);
        return groups;
      },
      {},
    );
  }, [filteredRows]);

  const monthEntries = Object.entries(groupedRows).sort(
    ([monthA], [monthB]) => {
      if (monthA === "sans-date") return 1;
      if (monthB === "sans-date") return -1;

      return monthA.localeCompare(monthB);
    },
  );

  const aFaireCount = rows.filter(
    (row) => row.statut === "A_FAIRE",
  ).length;

  const enCoursCount = rows.filter(
    (row) => row.statut === "EN_COURS",
  ).length;

  return (
    <div className="min-h-full bg-slate-50 p-4 pb-20 sm:p-6 md:p-8 md:pb-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-700 to-cyan-600 px-5 py-6 shadow-lg sm:px-7 sm:py-8">
          <div className="pointer-events-none absolute -right-14 -top-16 size-56 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 size-56 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white">
                <IconCalendarEvent className="size-6" />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-100">
                  Organisation
                </p>

                <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                  Planning cabinet
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50">
                  Consultez les étapes à effectuer, les échéances à venir et
                  les responsables assignés.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/15 pt-5 sm:gap-4">
              <div className="rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm sm:p-4">
                <p className="text-[10px] font-bold uppercase text-emerald-100 sm:text-xs">
                  Total actif
                </p>

                <p className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                  {loading ? "—" : rows.length}
                </p>
              </div>

              <div className="rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm sm:p-4">
                <p className="text-[10px] font-bold uppercase text-emerald-100 sm:text-xs">
                  À faire
                </p>

                <p className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                  {loading ? "—" : aFaireCount}
                </p>
              </div>

              <div className="rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm sm:p-4">
                <p className="text-[10px] font-bold uppercase text-emerald-100 sm:text-xs">
                  En cours
                </p>

                <p className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                  {loading ? "—" : enCoursCount}
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
            placeholder="Rechercher une étape, un client ou un responsable..."
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          />
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400 shadow-sm">
            Chargement du planning…
          </div>
        ) : monthEntries.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400 shadow-sm">
            Aucune étape planifiée
          </div>
        ) : (
          monthEntries.map(([monthKey, monthRows]) => (
            <section key={monthKey} className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-100 px-5 py-4">
                <IconCalendarEvent className="size-5 text-emerald-600" />

                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">
                  {getMonthLabel(monthKey)}
                </h2>

                <span className="ml-auto rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                  {monthRows.length} étape
                  {monthRows.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Ordinateur */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[900px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-5 py-4 text-left font-semibold text-slate-500">
                          Statut
                        </th>

                        <th className="px-5 py-4 text-left font-semibold text-slate-500">
                          Étape
                        </th>

                        <th className="px-5 py-4 text-left font-semibold text-slate-500">
                          Client
                        </th>

                        <th className="px-5 py-4 text-left font-semibold text-slate-500">
                          Type
                        </th>

                        <th className="px-5 py-4 text-left font-semibold text-slate-500">
                          Échéance
                        </th>

                        <th className="px-5 py-4 text-left font-semibold text-slate-500">
                          Assigné
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {monthRows.map((row) => (
                        <tr
                          key={row.id}
                          className="transition hover:bg-emerald-50/30"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              {row.statut === "A_FAIRE" && (
                                <IconAlertTriangle className="size-5 text-amber-500" />
                              )}

                              {row.statut === "EN_COURS" && (
                                <IconClock className="size-5 text-blue-500" />
                              )}

                              <StatusBadge status={row.statut} />
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-900">
                              {row.titre}
                            </p>

                            {row.description && (
                              <p className="mt-1 max-w-xs truncate text-xs text-slate-400">
                                {row.description}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <Link
                              href={`/dashboard/clients/${row.client.id}?tab=planning`}
                              className="font-medium text-slate-700 hover:text-emerald-700 hover:underline"
                            >
                              {row.client.raisonSociale}
                            </Link>

                            <p className="mt-1 font-mono text-xs text-slate-400">
                              {row.client.ref}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold uppercase ${
                                TYPE_CLASSES[row.type]
                              }`}
                            >
                              {TYPE_LABELS[row.type]}
                            </span>
                          </td>

                          <td className="px-5 py-4 font-mono text-slate-500">
                            {formatDate(row.dateEcheance)}
                          </td>

                          <td className="px-5 py-4 text-slate-500">
                            {getAssignedName(row)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile */}
                <div className="divide-y divide-slate-100 md:hidden">
                  {monthRows.map((row) => (
                    <Link
                      key={row.id}
                      href={`/dashboard/clients/${row.client.id}?tab=planning`}
                      className="block p-4 transition hover:bg-emerald-50/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">
                            {row.titre}
                          </p>

                          <p className="mt-1 truncate text-sm text-emerald-700">
                            {row.client.raisonSociale}
                          </p>
                        </div>

                        <IconChevronRight className="size-5 shrink-0 text-slate-300" />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatusBadge status={row.statut} />

                        <span
                          className={`rounded-lg px-2 py-1 text-xs font-semibold uppercase ${
                            TYPE_CLASSES[row.type]
                          }`}
                        >
                          {TYPE_LABELS[row.type]}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-slate-400">
                            Échéance
                          </p>

                          <p className="mt-1 text-slate-600">
                            {formatDate(row.dateEcheance)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-400">
                            Assigné à
                          </p>

                          <p className="mt-1 truncate text-slate-600">
                            {getAssignedName(row)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}