"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconBuilding,
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconSearch,
  IconShieldCheck,
  IconUsers,
} from "@tabler/icons-react";

import { apiFetch } from "@/lib/apiFetch";

import type {
  Client,
  NiveauRisque,
  ScoreRisque,
  StatutClient,
  StatutKyc,
} from "@/types";

interface ClientRow {
  client: Client;
  score?: ScoreRisque | null;
}

const PAGE_SIZE = 8;

const STATUT_LABELS: Record<StatutClient, string> = {
  ACTIF: "Actif",
  INACTIF: "Inactif",
  RESILIE: "Résilié",
};

const KYC_LABELS: Record<StatutKyc, string> = {
  VALIDE: "Validé",
  COMPLET: "Complet",
  INCOMPLET: "Incomplet",
  EXPIRE: "Expiré",
};

const RISK_LABELS: Record<NiveauRisque, string> = {
  FAIBLE: "Faible",
  MOYEN: "Moyen",
  ELEVE: "Élevé",
};

const AVATAR_CLASSES: Record<NiveauRisque | "SANS_SCORE", string> = {
  FAIBLE: "from-emerald-500 to-teal-500",
  MOYEN: "from-amber-500 to-orange-500",
  ELEVE: "from-red-500 to-rose-500",
  SANS_SCORE: "from-blue-500 to-indigo-500",
};

function StatutBadge({ statut }: { statut: StatutClient }) {
  const classes: Record<StatutClient, string> = {
    ACTIF: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    INACTIF: "bg-slate-100 text-slate-600 ring-slate-200",
    RESILIE: "bg-red-100 text-red-700 ring-red-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${classes[statut]}`}
    >
      <span
        className={`size-1.5 rounded-full ${
          statut === "ACTIF"
            ? "bg-emerald-500"
            : statut === "INACTIF"
              ? "bg-slate-400"
              : "bg-red-500"
        }`}
      />

      {STATUT_LABELS[statut]}
    </span>
  );
}

function KycBadge({ statut }: { statut: StatutKyc }) {
  const classes: Record<StatutKyc, string> = {
    VALIDE: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    COMPLET: "bg-blue-100 text-blue-700 ring-blue-200",
    INCOMPLET: "bg-amber-100 text-amber-700 ring-amber-200",
    EXPIRE: "bg-red-100 text-red-700 ring-red-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${classes[statut]}`}
    >
      {KYC_LABELS[statut]}
    </span>
  );
}

function RisqueBadge({ niveau }: { niveau: NiveauRisque }) {
  const classes: Record<NiveauRisque, string> = {
    FAIBLE: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    MOYEN: "bg-amber-100 text-amber-700 ring-amber-200",
    ELEVE: "bg-red-100 text-red-700 ring-red-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${classes[niveau]}`}
    >
      {RISK_LABELS[niveau]}
    </span>
  );
}

export default function ClientsPage() {
  const router = useRouter();

  const [rows, setRows] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState<
    "Tous" | StatutClient
  >("Tous");
  const [filterKyc, setFilterKyc] = useState<"Tous" | StatutKyc>(
    "Tous",
  );
  const [filterRisque, setFilterRisque] = useState<
    "Tous" | NiveauRisque
  >("Tous");

  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    setError(null);

    apiFetch<Client[]>("/clients")
      .then(async (clients) => {
        const withScores = await Promise.all(
          clients.map(async (client) => {
            const score = await apiFetch<ScoreRisque | null>(
              `/scoring/client/${client.id}/courant`,
            ).catch(() => null);

            return {
              client,
              score,
            };
          }),
        );

        setRows(withScores);
      })
      .catch((err: Error) => {
        setError(err.message);
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows
      .filter(({ client }) => {
        if (!query) return true;

        return (
          client.raisonSociale.toLowerCase().includes(query) ||
          client.ref.toLowerCase().includes(query) ||
          (client.siret ?? "").toLowerCase().includes(query) ||
          (client.ville ?? "").toLowerCase().includes(query)
        );
      })
      .filter(({ client }) => {
        if (filterStatut === "Tous") return true;

        return client.statut === filterStatut;
      })
      .filter(({ client }) => {
        if (filterKyc === "Tous") return true;

        return client.kycStatut === filterKyc;
      })
      .filter(({ score }) => {
        if (filterRisque === "Tous") return true;

        return score?.niveau === filterRisque;
      })
      .sort((a, b) =>
        a.client.raisonSociale.localeCompare(
          b.client.raisonSociale,
          "fr",
        ),
      );
  }, [
    rows,
    search,
    filterStatut,
    filterKyc,
    filterRisque,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE),
  );

  const currentPage = Math.min(page, totalPages);

  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const activeCount = rows.filter(
    ({ client }) => client.statut === "ACTIF",
  ).length;

  const validKycCount = rows.filter(
    ({ client }) => client.kycStatut === "VALIDE",
  ).length;

  const mediumRiskCount = rows.filter(
    ({ score }) => score?.niveau === "MOYEN",
  ).length;

  const highRiskCount = rows.filter(
    ({ score }) => score?.niveau === "ELEVE",
  ).length;

  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 pb-24 sm:p-6 md:p-8 md:pb-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-800 via-indigo-700 to-violet-700 px-5 py-6 text-white shadow-xl sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-violet-300/20 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-inner backdrop-blur-sm">
                  <IconUsers className="size-6" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">
                    Portefeuille
                  </p>

                  <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                    Clients
                  </h1>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
                    Consultez les dossiers clients, leur statut KYC et
                    leur niveau de risque.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  router.push("/dashboard/clients/new")
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-indigo-800 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50 sm:w-auto"
              >
                <IconPlus className="size-5" />
                Nouveau client
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/15 pt-5 lg:grid-cols-4">
              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-blue-100 sm:text-xs">
                  Total clients
                </p>

                <p className="mt-1 text-2xl font-bold sm:text-3xl">
                  {loading ? "—" : rows.length}
                </p>
              </div>

              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-blue-100 sm:text-xs">
                  Clients actifs
                </p>

                <p className="mt-1 text-2xl font-bold sm:text-3xl">
                  {loading ? "—" : activeCount}
                </p>
              </div>

              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-blue-100 sm:text-xs">
                  KYC validés
                </p>

                <p className="mt-1 text-2xl font-bold sm:text-3xl">
                  {loading ? "—" : validKycCount}
                </p>
              </div>

              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-blue-100 sm:text-xs">
                  Risques élevés
                </p>

                <p className="mt-1 text-2xl font-bold sm:text-3xl">
                  {loading ? "—" : highRiskCount}
                </p>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Cartes statistiques */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                  Portefeuille
                </p>

                <p className="mt-2 text-3xl font-bold text-blue-800">
                  {loading ? "—" : rows.length}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Dossiers clients enregistrés
                </p>
              </div>

              <div className="flex size-11 items-center justify-center rounded-xl bg-blue-100">
                <IconBuilding className="size-6 text-blue-700" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  KYC validés
                </p>

                <p className="mt-2 text-3xl font-bold text-emerald-800">
                  {loading ? "—" : validKycCount}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Dossiers conformes et validés
                </p>
              </div>

              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-100">
                <IconShieldCheck className="size-6 text-emerald-700" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                Risque moyen
              </p>

              <p className="mt-2 text-3xl font-bold text-amber-800">
                {loading ? "—" : mediumRiskCount}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Dossiers nécessitant une vigilance
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-5 shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                Risque élevé
              </p>

              <p className="mt-2 text-3xl font-bold text-red-800">
                {loading ? "—" : highRiskCount}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Dossiers prioritaires à surveiller
              </p>
            </div>
          </div>
        </div>

        {/* Recherche et filtres */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_180px]">
            <div className="relative">
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                placeholder="Rechercher par nom, référence, SIRET ou ville..."
                value={search}
                onChange={(event) =>
                  changeSearch(event.target.value)
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <select
              value={filterStatut}
              onChange={(event) => {
                setFilterStatut(
                  event.target.value as
                    | "Tous"
                    | StatutClient,
                );
                setPage(1);
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            >
              <option value="Tous">Tous les statuts</option>
              <option value="ACTIF">Actifs</option>
              <option value="INACTIF">Inactifs</option>
              <option value="RESILIE">Résiliés</option>
            </select>

            <select
              value={filterKyc}
              onChange={(event) => {
                setFilterKyc(
                  event.target.value as "Tous" | StatutKyc,
                );
                setPage(1);
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            >
              <option value="Tous">Tous les KYC</option>
              <option value="VALIDE">Validés</option>
              <option value="COMPLET">Complets</option>
              <option value="INCOMPLET">Incomplets</option>
              <option value="EXPIRE">Expirés</option>
            </select>

            <select
              value={filterRisque}
              onChange={(event) => {
                setFilterRisque(
                  event.target.value as
                    | "Tous"
                    | NiveauRisque,
                );
                setPage(1);
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            >
              <option value="Tous">Tous les risques</option>
              <option value="FAIBLE">Faible</option>
              <option value="MOYEN">Moyen</option>
              <option value="ELEVE">Élevé</option>
            </select>
          </div>
        </div>

        {/* Liste */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center gap-3 border-b border-slate-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 px-5 py-5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-100">
              <IconBuilding className="size-5 text-indigo-700" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Portefeuille clients
              </h2>

              <p className="text-xs text-slate-500">
                {loading
                  ? "Chargement..."
                  : `${filtered.length} client${
                      filtered.length > 1 ? "s" : ""
                    } trouvé${filtered.length > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1000px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Réf.
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Raison sociale
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    SIRET
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Statut
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    KYC
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Risque
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Score
                  </th>

                  <th className="w-16 px-5 py-4" />
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      Chargement des clients…
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      Aucun client trouvé
                    </td>
                  </tr>
                ) : (
                  paginated.map(({ client, score }) => (
                    <tr
                      key={client.id}
                      onClick={() =>
                        router.push(
                          `/dashboard/clients/${client.id}`,
                        )
                      }
                      className="cursor-pointer transition hover:bg-indigo-50/40"
                    >
                      <td className="px-5 py-4 font-mono text-xs text-slate-400">
                        {client.ref}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {client.raisonSociale}
                        </p>

                        {client.ville && (
                          <p className="mt-1 text-xs text-slate-400">
                            {client.ville}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 font-mono text-xs text-slate-500">
                        {client.siret ?? "—"}
                      </td>

                      <td className="px-5 py-4">
                        <StatutBadge statut={client.statut} />
                      </td>

                      <td className="px-5 py-4">
                        <KycBadge statut={client.kycStatut} />
                      </td>

                      <td className="px-5 py-4">
                        {score ? (
                          <RisqueBadge niveau={score.niveau} />
                        ) : (
                          <span className="text-xs text-slate-400">
                            Non évalué
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 font-mono text-sm text-slate-600">
                        {score ? `${score.score}/150` : "—"}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <IconChevronRight className="ml-auto size-5 text-slate-300" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="grid gap-4 bg-slate-50 p-4 md:hidden">
            {loading ? (
              <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-400">
                Chargement des clients…
              </div>
            ) : paginated.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-400">
                Aucun client trouvé
              </div>
            ) : (
              paginated.map(({ client, score }) => {
                const avatarClass =
                  AVATAR_CLASSES[
                    score?.niveau ?? "SANS_SCORE"
                  ];

                return (
                  <Link
                    key={client.id}
                    href={`/dashboard/clients/${client.id}`}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500" />

                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold uppercase text-white shadow-sm ${avatarClass}`}
                        >
                          {client.raisonSociale
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="break-words font-semibold leading-5 text-slate-900">
                                {client.raisonSociale}
                              </p>

                              <p className="mt-1 font-mono text-xs text-slate-400">
                                {client.ref}
                              </p>
                            </div>

                            <IconChevronRight className="size-5 shrink-0 text-slate-300" />
                          </div>

                          <p className="mt-3 break-all font-mono text-xs text-slate-500">
                            SIRET : {client.siret ?? "Non renseigné"}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <StatutBadge statut={client.statut} />
                            <KycBadge statut={client.kycStatut} />

                            {score ? (
                              <RisqueBadge niveau={score.niveau} />
                            ) : (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                                Sans scoring
                              </span>
                            )}
                          </div>

                          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                            <p className="text-xs text-slate-400">
                              {client.ville ?? client.pays}
                            </p>

                            <p className="font-mono text-xs font-semibold text-indigo-700">
                              {score ? `${score.score}/150` : "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {!loading && filtered.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-400">
                {filtered.length} client
                {filtered.length !== 1 ? "s" : ""} affiché
                {filtered.length !== 1 ? "s" : ""} sur {rows.length}
              </p>

              <div className="flex max-w-full items-center gap-1 overflow-x-auto">
                <button
                  type="button"
                  onClick={() =>
                    setPage((value) =>
                      Math.max(1, value - 1),
                    )
                  }
                  disabled={currentPage === 1}
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-30"
                >
                  <IconChevronLeft className="size-4" />
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1,
                ).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold transition ${
                      pageNumber === currentPage
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm"
                        : "border border-slate-200 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setPage((value) =>
                      Math.min(totalPages, value + 1),
                    )
                  }
                  disabled={currentPage === totalPages}
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-30"
                >
                  <IconChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}