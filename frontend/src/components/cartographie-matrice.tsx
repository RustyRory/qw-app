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

type DossierPlace = Dossier & {
  probabilite: number;
  impact: number;
  score: number;
  niveau: Niveau;
  vigilanceRenforcee: boolean;
  risques: number[];
};

interface Cartographie {
  risques: Risque[];
  dossiers: DossierPlace[];
}

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
  const [vue, setVue] = useState<"risques" | "dossiers">("risques");
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
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 text-sm">
          {(
            [
              ["risques", "Risques du cabinet"],
              ["dossiers", "Dossiers placés"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setVue(v)}
              className={`rounded-lg px-3 py-1.5 font-medium ${vue === v ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              {label}
            </button>
          ))}
        </div>
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
        {vue === "risques" ? (
          <Matrice
            contenu={(p, i) => (
              <div className="flex flex-wrap gap-1.5">
                {data.risques
                  .filter((r) => r.probabilite === p && r.impact === i)
                  .map((r) => (
                    <button
                      key={r.numero}
                      type="button"
                      onClick={() => setSelection(r.numero)}
                      title={`${r.libelle} — ${r.dossiers.length} dossier(s)`}
                      className={`relative flex size-8 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-800 shadow-sm hover:ring-2 hover:ring-indigo-300 ${selection === r.numero ? "ring-2 ring-indigo-500" : ""}`}
                    >
                      {r.numero}
                      {r.dossiers.length > 0 && (
                        <span className="absolute -right-1.5 -top-1.5 rounded-full bg-indigo-600 px-1 text-[10px] text-white">
                          {r.dossiers.length}
                        </span>
                      )}
                    </button>
                  ))}
              </div>
            )}
          />
        ) : (
          <Matrice
            contenu={(p, i) => {
              const ici = data.dossiers.filter(
                (d) => d.probabilite === p && d.impact === i,
              );
              return (
                <ul className="space-y-0.5 pr-4 text-xs">
                  {ici.slice(0, 6).map((d) => (
                    <li key={d.id} className="truncate">
                      <Link
                        href={lienDossier(d)}
                        className="font-medium text-slate-800 hover:underline"
                        title={`${d.ref} — risques ${d.risques.join(", ") || "aucun"}`}
                      >
                        {d.vigilanceRenforcee && "⚑ "}
                        {d.nom}
                      </Link>
                    </li>
                  ))}
                  {ici.length > 6 && (
                    <li className="text-slate-500">
                      + {ici.length - 6} autres
                    </li>
                  )}
                </ul>
              );
            }}
          />
        )}
      </div>

      {vue === "risques" && (
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
                  Probabilité {risqueSel.probabilite} × impact{" "}
                  {risqueSel.impact} = {risqueSel.score} ·{" "}
                  {LIBELLE_NIVEAU[risqueSel.niveau]}
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
                          {d.ref} ·{" "}
                          {d.type === "client" ? "client" : "prospect"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Cliquez sur un risque pour voir les dossiers concernés et la
                règle de rattachement.
              </p>
            )}
          </div>
        </div>
      )}

      {vue === "dossiers" && (
        <p className="text-xs text-slate-500">
          Chaque dossier est placé sur la case de son risque le plus élevé parmi
          les 13 risques de la cartographie (Rare × Mineur s’il n’en présente
          aucun). ⚑ = vigilance renforcée obligatoire (PPE, pays à haut risque).
          Le niveau de risque du dossier reste celui du scoring.
        </p>
      )}
    </div>
  );
}
