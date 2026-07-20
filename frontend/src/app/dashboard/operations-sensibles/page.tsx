"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  IconAlertHexagon,
  IconExternalLink,
  IconFileCheck,
  IconSearch,
} from "@tabler/icons-react";

import { apiFetch } from "@/lib/apiFetch";
import { StatusBadge } from "@/lib/status";
import { useAuth } from "@/hooks/useAuth";

import type {
  Client,
  OperationSensible,
  StatutOperationSensible,
  TypeOperationSensible,
} from "@/types";

interface OperationWithClient {
  operation: OperationSensible;
  client: Client;
}

const TYPE_LABELS: Record<TypeOperationSensible, string> = {
  SANS_JUSTIFICATION: "Sans justification",
  COMPLEXE: "Opération complexe",
  SANS_OBJET_LICITE: "Sans objet licite",
  INHABITUELLE: "Opération inhabituelle",
  ECONOMIE_VIRTUELLE: "Économie virtuelle",
  ESPECES: "Espèces",
  AUTRE: "Autre",
};

const STATUS_CARDS: {
  status: StatutOperationSensible;
  label: string;
}[] = [
  { status: "SIGNALEE", label: "Signalées" },
  { status: "EN_ANALYSE", label: "En analyse" },
  { status: "CLASSEE", label: "Classées" },
  { status: "TRACFIN_DECLARE", label: "TRACFIN" },
];

export default function OperationsSensiblesPage() {
  const { role } = useAuth();

  const [rows, setRows] = useState<OperationWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<
    "TOUS" | StatutOperationSensible
  >("TOUS");

  const [search, setSearch] = useState("");

  const canManage =
    role === "RESPONSABLE" ||
    role === "EXPERT_COMPTABLE" ||
    role === "ADMIN";

  async function loadOperations() {
    setLoading(true);
    setError(null);

    try {
      const clients = await apiFetch<Client[]>("/clients");

      const results = await Promise.all(
        clients.map(async (client) => {
          const operations = await apiFetch<OperationSensible[]>(
            `/operations-sensibles/client/${client.id}`,
          ).catch(() => []);

          return operations.map((operation) => ({
            operation,
            client,
          }));
        }),
      );

      setRows(results.flat());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les opérations sensibles.",
      );

      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOperations();
  }, []);

  const counts = useMemo<Record<StatutOperationSensible, number>>(
    () => ({
      SIGNALEE: rows.filter(
        ({ operation }) => operation.statut === "SIGNALEE",
      ).length,

      EN_ANALYSE: rows.filter(
        ({ operation }) => operation.statut === "EN_ANALYSE",
      ).length,

      CLASSEE: rows.filter(
        ({ operation }) => operation.statut === "CLASSEE",
      ).length,

      TRACFIN_DECLARE: rows.filter(
        ({ operation }) =>
          operation.statut === "TRACFIN_DECLARE",
      ).length,
    }),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...rows]
      .filter(({ operation }) => {
        if (statusFilter === "TOUS") return true;

        return operation.statut === statusFilter;
      })
      .filter(({ operation, client }) => {
        if (!normalizedSearch) return true;

        const typeLabel =
          TYPE_LABELS[operation.type]?.toLowerCase() ?? "";

        return (
          client.raisonSociale
            .toLowerCase()
            .includes(normalizedSearch) ||
          client.ref.toLowerCase().includes(normalizedSearch) ||
          typeLabel.includes(normalizedSearch) ||
          operation.description
            .toLowerCase()
            .includes(normalizedSearch)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.operation.createdAt).getTime() -
          new Date(a.operation.createdAt).getTime(),
      );
  }, [rows, statusFilter, search]);

  async function handleClasser(id: string) {
    const confirmed = window.confirm(
      "Voulez-vous vraiment classer cette opération ?",
    );

    if (!confirmed) return;

    setActionLoading(id);
    setError(null);

    try {
      await apiFetch(`/operations-sensibles/${id}/classer`, {
        method: "PATCH",
      });

      await loadOperations();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de classer cette opération.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleTracfin(id: string) {
    const today = new Date().toISOString().slice(0, 10);

    const date = window.prompt(
      "Date de la déclaration TRACFIN au format AAAA-MM-JJ :",
      today,
    );

    if (!date) return;

    setActionLoading(id);
    setError(null);

    try {
      await apiFetch(`/operations-sensibles/${id}/tracfin`, {
        method: "PATCH",
        body: JSON.stringify({ date }),
      });

      await loadOperations();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de déclarer cette opération à TRACFIN.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  function formatAmount(
    amount?: number | null,
    devise?: string | null,
  ) {
    if (amount === null || amount === undefined) return "—";

    try {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: devise || "EUR",
        maximumFractionDigits: 2,
      }).format(Number(amount));
    } catch {
      return `${Number(amount).toLocaleString("fr-FR")} ${
        devise || "EUR"
      }`;
    }
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 pb-20 sm:p-6 md:p-8 md:pb-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-800 via-rose-700 to-orange-600 px-5 py-6 shadow-lg sm:px-7 sm:py-8">
          <div className="pointer-events-none absolute -right-14 -top-16 size-56 rounded-full bg-orange-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 size-56 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white">
                  <IconAlertHexagon className="size-6" />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-100">
                    Vigilance LCB-FT
                  </p>

                  <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                    Opérations sensibles
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-red-50">
                    Analysez les opérations signalées et suivez leur
                    traitement jusqu’au classement ou à la déclaration
                    TRACFIN.
                  </p>
                </div>
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as
                      | "TOUS"
                      | StatutOperationSensible,
                  )
                }
                className="h-11 w-full rounded-xl border border-white/20 bg-white px-4 text-sm font-medium text-slate-700 shadow-lg outline-none sm:w-auto"
              >
                <option value="TOUS">Toutes les opérations</option>
                <option value="SIGNALEE">Signalées</option>
                <option value="EN_ANALYSE">En analyse</option>
                <option value="CLASSEE">Classées</option>
                <option value="TRACFIN_DECLARE">
                  TRACFIN déclaré
                </option>
              </select>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/15 pt-5 lg:grid-cols-4">
              {STATUS_CARDS.map(({ status, label }) => (
                <button
                  key={status}
                  type="button"
                  onClick={() =>
                    setStatusFilter((current) =>
                      current === status ? "TOUS" : status,
                    )
                  }
                  className={`rounded-xl border p-3 text-left backdrop-blur-sm transition hover:bg-white/20 sm:p-4 ${
                    statusFilter === status
                      ? "border-white/50 bg-white/25"
                      : "border-white/20 bg-white/10"
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide text-red-100 sm:text-xs">
                    {label}
                  </p>

                  <p className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                    {loading ? "—" : counts[status]}
                  </p>
                </button>
              ))}
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
            placeholder="Rechercher un client, une référence ou un type..."
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"
          />
        </div>

        {/* Tableau */}
        <div className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-red-200 bg-red-50 px-5 py-4">
            <div className="flex size-9 items-center justify-center rounded-xl bg-red-100">
              <IconAlertHexagon className="size-5 text-red-700" />
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-red-700">
                Tableau global des opérations sensibles
              </h2>

              <p className="mt-0.5 text-xs text-red-600/70">
                {loading
                  ? "Chargement..."
                  : `${filteredRows.length} opération${
                      filteredRows.length > 1 ? "s" : ""
                    } affichée${
                      filteredRows.length > 1 ? "s" : ""
                    }`}
              </p>
            </div>
          </div>

          {/* Ordinateur */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[950px] text-sm">
              <thead>
                <tr className="border-b border-red-200 bg-red-50/70">
                  <th className="px-5 py-4 text-left font-semibold text-red-700">
                    Date
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-red-700">
                    Client
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-red-700">
                    Type
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-red-700">
                    Montant
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-red-700">
                    Statut
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-red-700">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-red-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-slate-400"
                    >
                      Chargement…
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-slate-400"
                    >
                      Aucune opération sensible trouvée
                    </td>
                  </tr>
                ) : (
                  filteredRows.map(({ operation, client }) => {
                    const closed =
                      operation.statut === "CLASSEE" ||
                      operation.statut === "TRACFIN_DECLARE";

                    const busy = actionLoading === operation.id;

                    return (
                      <tr
                        key={operation.id}
                        className="transition hover:bg-red-50/30"
                      >
                        <td className="px-5 py-4 font-mono text-xs text-slate-500">
                          {new Date(
                            operation.createdAt,
                          ).toLocaleDateString("fr-FR")}
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">
                            {client.raisonSociale}
                          </p>

                          <p className="mt-1 font-mono text-xs text-slate-400">
                            {client.ref}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {TYPE_LABELS[operation.type] ??
                            operation.type}
                        </td>

                        <td className="px-5 py-4 font-mono font-medium text-slate-700">
                          {formatAmount(
                            operation.montant,
                            operation.devise,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={operation.statut} />
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/dashboard/clients/${client.id}?tab=operations`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
                            >
                              <IconExternalLink className="size-4" />
                              Voir
                            </Link>

                            {canManage && !closed && (
                              <>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() =>
                                    handleClasser(operation.id)
                                  }
                                  className="text-xs font-semibold text-amber-700 hover:underline disabled:opacity-50"
                                >
                                  {busy ? "Traitement…" : "Classer"}
                                </button>

                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() =>
                                    handleTracfin(operation.id)
                                  }
                                  className="text-xs font-semibold text-red-700 hover:underline disabled:opacity-50"
                                >
                                  TRACFIN
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="divide-y divide-red-100 md:hidden">
            {loading ? (
              <div className="p-10 text-center text-sm text-slate-400">
                Chargement…
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-400">
                Aucune opération sensible trouvée
              </div>
            ) : (
              filteredRows.map(({ operation, client }) => {
                const closed =
                  operation.statut === "CLASSEE" ||
                  operation.statut === "TRACFIN_DECLARE";

                const busy = actionLoading === operation.id;

                return (
                  <article key={operation.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {client.raisonSociale}
                        </p>

                        <p className="mt-1 font-mono text-xs text-slate-400">
                          {client.ref}
                        </p>
                      </div>

                      <StatusBadge status={operation.statut} />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-slate-400">
                          Type
                        </p>

                        <p className="mt-1 text-slate-600">
                          {TYPE_LABELS[operation.type] ??
                            operation.type}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Montant
                        </p>

                        <p className="mt-1 font-mono font-medium text-slate-700">
                          {formatAmount(
                            operation.montant,
                            operation.devise,
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Date
                        </p>

                        <p className="mt-1 text-slate-600">
                          {new Date(
                            operation.createdAt,
                          ).toLocaleDateString("fr-FR")}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Description
                        </p>

                        <p className="mt-1 line-clamp-2 text-slate-600">
                          {operation.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-red-100 pt-3">
                      <Link
                        href={`/dashboard/clients/${client.id}?tab=operations`}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
                      >
                        <IconExternalLink className="size-4" />
                        Voir le client
                      </Link>

                      {canManage && !closed && (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              handleClasser(operation.id)
                            }
                            className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 disabled:opacity-50"
                          >
                            Classer
                          </button>

                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              handleTracfin(operation.id)
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
                          >
                            <IconFileCheck className="size-4" />
                            TRACFIN
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <div className="border-t border-red-200 bg-red-50 px-5 py-3 text-xs text-red-600">
            Les actions de classement et de déclaration sont réservées aux
            responsables, experts-comptables et administrateurs.
          </div>
        </div>
      </div>
    </div>
  );
}