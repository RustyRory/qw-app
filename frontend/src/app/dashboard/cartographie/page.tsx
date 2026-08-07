"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  IconAlertTriangle,
  IconChartDots,
  IconChevronDown,
  IconChevronRight,
  IconChevronUp,
  IconDownload,
  IconMapPin,
  IconSearch,
  IconSelector,
  IconShieldCheck,
} from "@tabler/icons-react";

import { apiFetch } from "@/lib/apiFetch";
import { RiskBadge } from "@/lib/status";

import type { Client, NiveauRisque, Prospect, ScoreRisque } from "@/types";

type EntityKind = "client" | "prospect";

interface RiskRow {
  kind: EntityKind;
  id: string;
  ref: string;
  nom: string;
  secteur: string | null;
  ville: string | null;
  score: ScoreRisque | null;
}

type SortKey = "ref" | "nom" | "type" | "secteur" | "score" | "niveau" | "date";

type SortDir = "asc" | "desc";

const NIVEAU_ORDER: Record<NiveauRisque, number> = {
  FAIBLE: 0,
  MOYEN: 1,
  ELEVE: 2,
};

const ENTITY_LABELS: Record<EntityKind, string> = {
  client: "Client",
  prospect: "Prospect",
};

const ENTITY_BADGE_CLASS: Record<EntityKind, string> = {
  client: "bg-blue-100 text-blue-700",
  prospect: "bg-violet-100 text-violet-700",
};

const RISK_LEVELS: NiveauRisque[] = ["FAIBLE", "MOYEN", "ELEVE"];

const RISK_LABELS: Record<NiveauRisque, string> = {
  FAIBLE: "Faible",
  MOYEN: "Moyen",
  ELEVE: "Élevé",
};

const CARD_STYLES: Record<
  NiveauRisque,
  {
    container: string;
    title: string;
    value: string;
    iconContainer: string;
    icon: string;
    progress: string;
  }
> = {
  FAIBLE: {
    container: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
    title: "text-emerald-700",
    value: "text-emerald-800",
    iconContainer: "bg-emerald-100",
    icon: "text-emerald-700",
    progress: "bg-emerald-500",
  },

  MOYEN: {
    container: "border-amber-200 bg-gradient-to-br from-amber-50 to-white",
    title: "text-amber-700",
    value: "text-amber-800",
    iconContainer: "bg-amber-100",
    icon: "text-amber-700",
    progress: "bg-amber-500",
  },

  ELEVE: {
    container: "border-red-200 bg-gradient-to-br from-red-50 to-white",
    title: "text-red-700",
    value: "text-red-800",
    iconContainer: "bg-red-100",
    icon: "text-red-700",
    progress: "bg-red-500",
  },
};

export default function CartographiePage() {
  const [rows, setRows] = useState<RiskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [riskFilter, setRiskFilter] = useState<
    "TOUS" | NiveauRisque | "SANS_SCORE"
  >("TOUS");

  const [typeFilter, setTypeFilter] = useState<"TOUS" | EntityKind>("TOUS");
  const [sectorFilter, setSectorFilter] = useState("TOUS");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDir(key === "score" || key === "date" ? "desc" : "asc");
  }

  function renderSortIcon(key: SortKey) {
    if (sortKey !== key) {
      return <IconSelector className="size-3.5 text-slate-300" />;
    }

    return sortDir === "asc" ? (
      <IconChevronUp className="size-3.5 text-blue-600" />
    ) : (
      <IconChevronDown className="size-3.5 text-blue-600" />
    );
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    Promise.all([
      apiFetch<Client[]>("/clients"),
      apiFetch<Prospect[]>("/prospects"),
    ])
      .then(async ([clients, prospects]) => {
        const clientRows = await Promise.all(
          clients.map(async (client): Promise<RiskRow> => {
            const score = await apiFetch<ScoreRisque | null>(
              `/scoring/client/${client.id}/courant`,
            ).catch(() => null);

            return {
              kind: "client",
              id: client.id,
              ref: client.ref,
              nom: client.raisonSociale,
              secteur: client.activitePrincipale ?? null,
              ville: client.ville ?? null,
              score,
            };
          }),
        );

        const prospectRows = await Promise.all(
          prospects.map(async (prospect): Promise<RiskRow> => {
            const score = await apiFetch<ScoreRisque | null>(
              `/scoring/prospect/${prospect.id}/courant`,
            ).catch(() => null);

            return {
              kind: "prospect",
              id: prospect.id,
              ref: prospect.ref,
              nom: prospect.nom,
              secteur: prospect.activite ?? null,
              ville: prospect.ville ?? null,
              score,
            };
          }),
        );

        setRows([...clientRows, ...prospectRows]);
      })
      .catch((err: Error) => {
        setError(err.message);
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo<Record<NiveauRisque, number>>(
    () => ({
      FAIBLE: rows.filter(({ score }) => score?.niveau === "FAIBLE").length,

      MOYEN: rows.filter(({ score }) => score?.niveau === "MOYEN").length,

      ELEVE: rows.filter(({ score }) => score?.niveau === "ELEVE").length,
    }),
    [rows],
  );

  const withoutScoreCount = rows.filter(({ score }) => score === null).length;

  const totalScoredClients = counts.FAIBLE + counts.MOYEN + counts.ELEVE;

  const sectors = useMemo(() => {
    const values = rows
      .map(({ secteur }) => secteur?.trim())
      .filter((value): value is string => Boolean(value));

    return [...new Set(values)].sort((a, b) => a.localeCompare(b, "fr"));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...rows]
      .filter(({ score }) => {
        if (riskFilter === "TOUS") return true;

        if (riskFilter === "SANS_SCORE") {
          return score === null;
        }

        return score?.niveau === riskFilter;
      })
      .filter(({ kind }) => {
        if (typeFilter === "TOUS") return true;

        return kind === typeFilter;
      })
      .filter(({ secteur }) => {
        if (sectorFilter === "TOUS") return true;

        return secteur === sectorFilter;
      })
      .filter((row) => {
        if (!normalizedSearch) return true;

        return (
          row.ref.toLowerCase().includes(normalizedSearch) ||
          row.nom.toLowerCase().includes(normalizedSearch) ||
          row.secteur?.toLowerCase().includes(normalizedSearch) ||
          row.ville?.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;

        switch (sortKey) {
          case "ref":
            return dir * a.ref.localeCompare(b.ref, "fr");

          case "nom":
            return dir * a.nom.localeCompare(b.nom, "fr");

          case "type":
            return (
              dir *
              ENTITY_LABELS[a.kind].localeCompare(ENTITY_LABELS[b.kind], "fr")
            );

          case "secteur":
            return dir * (a.secteur ?? "").localeCompare(b.secteur ?? "", "fr");

          case "niveau":
            return (
              dir *
              ((a.score ? NIVEAU_ORDER[a.score.niveau] : -1) -
                (b.score ? NIVEAU_ORDER[b.score.niveau] : -1))
            );

          case "date":
            return (
              dir *
              (new Date(a.score?.createdAt ?? 0).getTime() -
                new Date(b.score?.createdAt ?? 0).getTime())
            );

          case "score":
          default:
            return dir * ((a.score?.score ?? -1) - (b.score?.score ?? -1));
        }
      });
  }, [rows, riskFilter, typeFilter, sectorFilter, search, sortKey, sortDir]);

  function getPercentage(niveau: NiveauRisque) {
    if (totalScoredClients === 0) return 0;

    return Math.round((counts[niveau] / totalScoredClients) * 100);
  }

  function handleExportPdf() {
    window.print();
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 pb-20 sm:p-6 md:p-8 md:pb-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-800 to-violet-700 px-5 py-6 shadow-xl sm:px-7 sm:py-8">
          <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-violet-300/20 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-inner">
                  <IconChartDots className="size-6 text-white" />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">
                    Analyse des risques
                  </p>

                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Cartographie des risques
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                    Visualisez la répartition du portefeuille selon le niveau de
                    risque de chaque client et prospect.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportPdf}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-blue-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50 sm:w-auto"
              >
                <IconDownload className="size-5" />
                Exporter PDF
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/15 pt-5 lg:grid-cols-4">
              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase text-blue-100">
                  Dossiers évalués
                </p>

                <p className="mt-1 text-3xl font-bold text-white">
                  {loading ? "—" : totalScoredClients}
                </p>
              </div>

              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase text-blue-100">
                  Risque faible
                </p>

                <p className="mt-1 text-3xl font-bold text-white">
                  {loading ? "—" : counts.FAIBLE}
                </p>
              </div>

              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase text-blue-100">
                  Risque élevé
                </p>

                <p className="mt-1 text-3xl font-bold text-white">
                  {loading ? "—" : counts.ELEVE}
                </p>
              </div>

              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase text-blue-100">
                  Sans scoring
                </p>

                <p className="mt-1 text-3xl font-bold text-white">
                  {loading ? "—" : withoutScoreCount}
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

        {/* Cartes de risque */}
        <div className="grid gap-4 sm:grid-cols-3">
          {RISK_LEVELS.map((niveau) => {
            const styles = CARD_STYLES[niveau];
            const percentage = getPercentage(niveau);

            return (
              <button
                key={niveau}
                type="button"
                onClick={() =>
                  setRiskFilter((current) =>
                    current === niveau ? "TOUS" : niveau,
                  )
                }
                className={`rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md ${styles.container} ${
                  riskFilter === niveau ? "ring-2 ring-blue-500/20" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p
                      className={`text-xs font-bold uppercase tracking-wide ${styles.title}`}
                    >
                      Risque {RISK_LABELS[niveau]}
                    </p>

                    <p className={`mt-2 text-3xl font-bold ${styles.value}`}>
                      {loading ? "—" : counts[niveau]}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {percentage}% des dossiers évalués
                    </p>
                  </div>

                  <div
                    className={`flex size-11 items-center justify-center rounded-xl ${styles.iconContainer}`}
                  >
                    {niveau === "FAIBLE" ? (
                      <IconShieldCheck className={`size-6 ${styles.icon}`} />
                    ) : niveau === "MOYEN" ? (
                      <IconMapPin className={`size-6 ${styles.icon}`} />
                    ) : (
                      <IconAlertTriangle className={`size-6 ${styles.icon}`} />
                    )}
                  </div>
                </div>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className={`h-full rounded-full ${styles.progress}`}
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Filtres */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <select
              value={riskFilter}
              onChange={(event) =>
                setRiskFilter(
                  event.target.value as "TOUS" | NiveauRisque | "SANS_SCORE",
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="TOUS">Tous les niveaux</option>
              <option value="FAIBLE">Risque faible</option>
              <option value="MOYEN">Risque moyen</option>
              <option value="ELEVE">Risque élevé</option>
              <option value="SANS_SCORE">Sans scoring</option>
            </select>

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as "TOUS" | EntityKind)
              }
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="TOUS">Clients et prospects</option>
              <option value="client">Clients uniquement</option>
              <option value="prospect">Prospects uniquement</option>
            </select>

            <select
              value={sectorFilter}
              onChange={(event) => setSectorFilter(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="TOUS">Tous les secteurs</option>

              {sectors.map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>

            <div className="relative md:col-span-3">
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un client, un prospect, une référence, un secteur..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        {/* Tableau */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100">
                <IconChartDots className="size-5 text-blue-700" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Portefeuille analysé
                </h2>

                <p className="text-xs text-slate-500">
                  {loading
                    ? "Chargement..."
                    : `${filteredRows.length} dossier${
                        filteredRows.length > 1 ? "s" : ""
                      } affiché${filteredRows.length > 1 ? "s" : ""}`}
                </p>
              </div>
            </div>
          </div>

          {/* Ordinateur */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[950px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-4 text-left font-semibold text-slate-500">
                    <button
                      type="button"
                      onClick={() => handleSort("ref")}
                      className="inline-flex items-center gap-1 transition hover:text-slate-700"
                    >
                      Réf.
                      {renderSortIcon("ref")}
                    </button>
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-slate-500">
                    <button
                      type="button"
                      onClick={() => handleSort("nom")}
                      className="inline-flex items-center gap-1 transition hover:text-slate-700"
                    >
                      Nom / Raison sociale
                      {renderSortIcon("nom")}
                    </button>
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-slate-500">
                    <button
                      type="button"
                      onClick={() => handleSort("type")}
                      className="inline-flex items-center gap-1 transition hover:text-slate-700"
                    >
                      Type
                      {renderSortIcon("type")}
                    </button>
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-slate-500">
                    <button
                      type="button"
                      onClick={() => handleSort("secteur")}
                      className="inline-flex items-center gap-1 transition hover:text-slate-700"
                    >
                      Secteur
                      {renderSortIcon("secteur")}
                    </button>
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-slate-500">
                    <button
                      type="button"
                      onClick={() => handleSort("score")}
                      className="inline-flex items-center gap-1 transition hover:text-slate-700"
                    >
                      Score
                      {renderSortIcon("score")}
                    </button>
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-slate-500">
                    <button
                      type="button"
                      onClick={() => handleSort("niveau")}
                      className="inline-flex items-center gap-1 transition hover:text-slate-700"
                    >
                      Niveau
                      {renderSortIcon("niveau")}
                    </button>
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-slate-500">
                    <button
                      type="button"
                      onClick={() => handleSort("date")}
                      className="inline-flex items-center gap-1 transition hover:text-slate-700"
                    >
                      Dernière évaluation
                      {renderSortIcon("date")}
                    </button>
                  </th>

                  <th className="w-16 px-5 py-4" />
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center text-slate-400"
                    >
                      Chargement…
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center text-slate-400"
                    >
                      Aucun client ou prospect trouvé
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr
                      key={`${row.kind}-${row.id}`}
                      className="transition hover:bg-blue-50/30"
                    >
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">
                        {row.ref}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {row.nom}
                        </p>

                        {row.ville && (
                          <p className="mt-1 text-xs text-slate-400">
                            {row.ville}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ENTITY_BADGE_CLASS[row.kind]}`}
                        >
                          {ENTITY_LABELS[row.kind]}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {row.secteur ?? "—"}
                      </td>

                      <td className="px-5 py-4 font-mono font-medium text-slate-700">
                        {row.score ? `${row.score.score}/100` : "—"}
                      </td>

                      <td className="px-5 py-4">
                        {row.score ? (
                          <RiskBadge level={row.score.niveau} />
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                            Non évalué
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {row.score
                          ? new Date(row.score.createdAt).toLocaleDateString(
                              "fr-FR",
                            )
                          : "—"}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          href={
                            row.kind === "client"
                              ? `/dashboard/clients/${row.id}`
                              : `/dashboard/prospects/${row.id}`
                          }
                          title="Voir le dossier"
                          className="inline-flex size-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-blue-100 hover:text-blue-700"
                        >
                          <IconChevronRight className="size-5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="divide-y divide-slate-100 md:hidden">
            {loading ? (
              <div className="p-10 text-center text-sm text-slate-400">
                Chargement…
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-400">
                Aucun client ou prospect trouvé
              </div>
            ) : (
              filteredRows.map((row) => (
                <Link
                  key={`${row.kind}-${row.id}`}
                  href={
                    row.kind === "client"
                      ? `/dashboard/clients/${row.id}`
                      : `/dashboard/prospects/${row.id}`
                  }
                  className="block p-4 transition hover:bg-blue-50/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {row.nom}
                      </p>

                      <p className="mt-1 font-mono text-xs text-slate-400">
                        {row.ref}
                      </p>
                    </div>

                    <IconChevronRight className="size-5 shrink-0 text-slate-300" />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ENTITY_BADGE_CLASS[row.kind]}`}
                    >
                      {ENTITY_LABELS[row.kind]}
                    </span>

                    {row.score ? (
                      <RiskBadge level={row.score.niveau} />
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                        Sans scoring
                      </span>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-400">Secteur</p>

                      <p className="mt-1 truncate text-slate-600">
                        {row.secteur ?? "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Score</p>

                      <p className="mt-1 font-mono text-slate-600">
                        {row.score ? `${row.score.score}/100` : "—"}
                      </p>
                    </div>

                    <div className="col-span-2">
                      <p className="text-xs text-slate-400">
                        Dernière évaluation
                      </p>

                      <p className="mt-1 text-slate-600">
                        {row.score
                          ? new Date(row.score.createdAt).toLocaleDateString(
                              "fr-FR",
                            )
                          : "Aucune évaluation"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
