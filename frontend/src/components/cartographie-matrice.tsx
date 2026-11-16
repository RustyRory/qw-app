"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/apiFetch";

type Niveau = "FAIBLE" | "MODERE" | "ELEVE";

interface Dossier {
  type: "prospect" | "client";
  id: string;
  ref: string;
  nom: string;
}

interface Risque {
  numero: number;
  libelle: string;
  probabilite: number;
  impact: number;
  score: number;
  niveau: Niveau;
  vigilanceRenforcee: boolean;
  regle: string;
  deductible: boolean;
  dossiers: Dossier[];
}

interface Cartographie {
  risques: Risque[];
  dossiers: (Dossier & { risques: number[] })[];
}

// Libellé court affiché dans la matrice (le libellé complet est au survol
// et dans la liste).
const LIBELLE_COURT: Record<number, string> = {
  1: "Espèces",
  2: "Société récente / holding",
  3: "PPE",
  4: "Associations",
  5: "Secteurs sensibles",
  6: "Création, domiciliation",
  7: "Opérations exceptionnelles",
  8: "Tenue seule",
  9: "Pays à haut risque",
  10: "Paradis fiscaux",
  11: "Client non rencontré",
  12: "Apporteur inconnu",
  13: "Formation interne",
};
const court = (r: { numero: number; libelle: string }) =>
  LIBELLE_COURT[r.numero] ?? r.libelle;

const PROBABILITES = ["Rare", "Possible", "Probable", "Très probable"];
const IMPACTS = ["Mineur", "Modéré", "Grave", "Critique"];

function niveauDe(score: number): Niveau {
  return score >= 9 ? "ELEVE" : score >= 5 ? "MODERE" : "FAIBLE";
}

const CASE: Record<Niveau, string> = {
  FAIBLE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  MODERE: "border-amber-200 bg-amber-50 text-amber-700",
  ELEVE: "border-red-200 bg-red-50 text-red-700",
};

const LIBELLE_NIVEAU: Record<Niveau, string> = {
  FAIBLE: "Faible (1 à 4)",
  MODERE: "Modéré (5 à 8)",
  ELEVE: "Élevé (9 à 16)",
};

function lienDossier(d: Dossier) {
  return d.type === "client"
    ? `/dashboard/clients/${d.id}`
    : `/dashboard/prospects/${d.id}`;
}

// Matrice probabilité × impact : 4 lignes (probabilité, de haut en bas
// décroissante) × 4 colonnes (impact croissant).
function Matrice({
  contenu,
}: {
  contenu: (probabilite: number, impact: number) => React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[560px] grid-cols-[auto_repeat(4,minmax(0,1fr))] gap-2">
        {[4, 3, 2, 1].map((p) => (
          <div key={p} className="contents">
            <div className="flex items-center pr-2 text-xs font-medium text-slate-500">
              {p} · {PROBABILITES[p - 1]}
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`relative min-h-24 rounded-xl border p-2 ${CASE[niveauDe(p * i)]}`}
              >
                <span className="absolute bottom-1.5 right-2 font-mono text-xs opacity-70">
                  {p * i}
                </span>
                {contenu(p, i)}
              </div>
            ))}
          </div>
        ))}
        <div />
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="text-center text-xs font-medium text-slate-500"
          >
            {i} · {IMPACTS[i - 1]}
          </div>
        ))}
      </div>
      <p className="mt-1 text-center text-xs text-slate-400">
        Lignes : probabilité · Colonnes : impact
      </p>
    </div>
  );
}

export function CartographieMatrice() {
  const [data, setData] = useState<Cartographie | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<number | null>(null);

  useEffect(() => {
    apiFetch<Cartographie>("/cartographie")
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }
  if (!data) {
    return (
      <p className="py-10 text-center text-sm text-slate-400">Chargement…</p>
    );
  }

  const risqueSel = data.risques.find((r) => r.numero === selection) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Cliquez sur un risque pour voir sa règle et les dossiers concernés.
        </p>
        <div className="flex flex-wrap gap-3 text-xs">
          {(["FAIBLE", "MODERE", "ELEVE"] as Niveau[]).map((n) => (
            <span key={n} className="flex items-center gap-1.5">
              <span className={`size-3 rounded border ${CASE[n]}`} />
              {LIBELLE_NIVEAU[n]}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <Matrice
          contenu={(p, i) => (
            <div className="flex flex-wrap gap-1.5 pb-4">
              {data.risques
                .filter((r) => r.probabilite === p && r.impact === i)
                .map((r) => (
                  <button
                    key={r.numero}
                    type="button"
                    onClick={() => setSelection(r.numero)}
                    title={r.libelle}
                    className={`rounded-lg border border-slate-300 bg-white px-2 py-1 text-left text-[11px] font-medium leading-tight text-slate-800 shadow-sm hover:ring-2 hover:ring-indigo-300 ${selection === r.numero ? "ring-2 ring-indigo-500" : ""}`}
                  >
                    {court(r)}
                  </button>
                ))}
            </div>
          )}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ol className="space-y-1.5 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
          {data.risques.map((r) => (
            <li key={r.numero}>
              <button
                type="button"
                onClick={() => setSelection(r.numero)}
                className={`flex w-full items-start gap-2 rounded-lg px-2 py-1 text-left hover:bg-slate-50 ${selection === r.numero ? "bg-indigo-50" : ""}`}
              >
                <span className="w-5 shrink-0 font-mono text-xs font-semibold text-slate-500">
                  {r.numero}
                </span>
                <span className="flex-1">
                  {r.libelle}
                  {r.vigilanceRenforcee && (
                    <span className="ml-1.5 rounded bg-red-50 px-1.5 text-xs font-semibold text-red-700">
                      vigilance renforcée
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-slate-500">
                  {r.deductible ? `${r.dossiers.length} dossier(s)` : "—"}
                </span>
              </button>
            </li>
          ))}
        </ol>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
          {risqueSel ? (
            <div className="space-y-3">
              <p className="font-semibold text-slate-900">
                {risqueSel.numero}. {risqueSel.libelle}
              </p>
              <p className="text-xs text-slate-500">
                Probabilité {risqueSel.probabilite} × impact {risqueSel.impact}{" "}
                = {risqueSel.score} · {LIBELLE_NIVEAU[risqueSel.niveau]}
              </p>
              <p className="text-xs text-slate-600">
                <span className="font-semibold">Rattachement : </span>
                {risqueSel.regle}
              </p>
              {risqueSel.dossiers.length === 0 ? (
                <p className="text-xs text-slate-400">
                  {risqueSel.deductible
                    ? "Aucun dossier concerné actuellement."
                    : "Pas de rattachement automatique pour ce risque."}
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {risqueSel.dossiers.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between py-1.5"
                    >
                      <Link
                        href={lienDossier(d)}
                        className="font-medium text-blue-700 hover:underline"
                      >
                        {d.nom}
                      </Link>
                      <span className="font-mono text-xs text-slate-400">
                        {d.ref} · {d.type === "client" ? "client" : "prospect"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Cliquez sur un risque pour voir les dossiers concernés et la règle
              de rattachement.
            </p>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Tous les dossiers ({data.dossiers.length})
          </p>
          {risqueSel && (
            <button
              type="button"
              onClick={() => setSelection(null)}
              className="text-xs font-medium text-blue-700 hover:underline"
            >
              Ne plus surligner « {court(risqueSel)} »
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-500">
              <tr className="border-b border-slate-100">
                <th className="px-4 py-2 font-medium">Dossier</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Risques concernés</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...data.dossiers]
                .sort(
                  (a, b) =>
                    b.risques.length - a.risques.length ||
                    a.nom.localeCompare(b.nom, "fr"),
                )
                .map((d) => {
                  const surligne =
                    selection !== null && d.risques.includes(selection);
                  return (
                    <tr
                      key={`${d.type}-${d.id}`}
                      className={surligne ? "bg-indigo-50" : undefined}
                    >
                      <td className="px-4 py-2">
                        <Link
                          href={lienDossier(d)}
                          className="font-medium text-blue-700 hover:underline"
                        >
                          {d.nom}
                        </Link>
                        <span className="ml-2 font-mono text-xs text-slate-400">
                          {d.ref}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-500">
                        {d.type === "client" ? "Client" : "Prospect"}
                      </td>
                      <td className="px-4 py-2">
                        {d.risques.length === 0 ? (
                          <span className="text-xs text-slate-400">
                            Aucun risque identifié
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {d.risques.map((n) => {
                              const r = data.risques.find(
                                (x) => x.numero === n,
                              );
                              return (
                                <button
                                  key={n}
                                  type="button"
                                  onClick={() => setSelection(n)}
                                  title={r?.libelle}
                                  className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${r ? CASE[r.niveau] : ""} border`}
                                >
                                  {r ? court(r) : n}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
