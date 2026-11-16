"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { useRole } from "@/hooks/useRole";
import type { ScreeningStatut } from "@/types";

type StatutCorrespondance = "A_VERIFIER" | "HOMONYME" | "CONFIRMEE";

interface Correspondance {
  id: string;
  personneControlee: string;
  idRegistre: number;
  nomRegistre: string;
  natureRegistre: string;
  motifs?: string | null;
  registreDu: string;
  statut: StatutCorrespondance;
  commentaire?: string | null;
  decidePar?: { prenom: string; nom: string } | null;
  decideAt?: string | null;
  createdAt: string;
}

const STATUT_DOSSIER: Record<ScreeningStatut, { label: string; cls: string }> =
  {
    NON_EFFECTUE: {
      label: "Contrôle en attente",
      cls: "bg-slate-100 text-slate-600",
    },
    OK: {
      label: "Aucune correspondance",
      cls: "bg-emerald-50 text-emerald-700",
    },
    ALERTE: { label: "Alerte", cls: "bg-red-50 text-red-700" },
  };

const STATUT_CORRESPONDANCE: Record<
  StatutCorrespondance,
  { label: string; cls: string }
> = {
  A_VERIFIER: { label: "À vérifier", cls: "bg-amber-50 text-amber-700" },
  HOMONYME: { label: "Homonyme", cls: "bg-slate-100 text-slate-600" },
  CONFIRMEE: { label: "Confirmée", cls: "bg-red-50 text-red-700" },
};

const date = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-FR") : "—";

// Contrôle automatique sur le registre national des gels d'avoirs (DG
// Trésor) : la personne contrôlée, son représentant légal et ses
// bénéficiaires effectifs sont comparés au registre à chaque modification
// et chaque nuit. Une correspondance éventuelle est tranchée par un
// responsable ou l'expert-comptable (homonyme / confirmée).
export function ScreeningPanel({
  cible,
  cibleId,
  statut,
  dateControle,
  registreDu,
  onChange,
}: {
  cible: "prospect" | "client";
  cibleId: string;
  statut: ScreeningStatut;
  dateControle?: string | null;
  registreDu?: string | null;
  onChange?: () => void;
}) {
  const { role } = useRole();
  const peutTrancher =
    role === "RESPONSABLE" || role === "EXPERT_COMPTABLE" || role === "ADMIN";
  const [liste, setListe] = useState<Correspondance[]>([]);
  const [commentaires, setCommentaires] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<Correspondance[]>(`/screening/${cible}/${cibleId}`)
      .then(setListe)
      .catch(() => setListe([]));
  }, [cible, cibleId]);

  useEffect(() => {
    load();
  }, [load, statut, dateControle]);

  async function relancer() {
    setBusy(true);
    setError(null);
    try {
      const l = await apiFetch<Correspondance[]>(
        `/screening/${cible}/${cibleId}/controler`,
        { method: "POST" },
      );
      setListe(l);
      onChange?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function decider(c: Correspondance, s: "HOMONYME" | "CONFIRMEE") {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/screening/correspondances/${c.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          statut: s,
          commentaire: commentaires[c.id] ?? "",
        }),
      });
      load();
      onChange?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const s = STATUT_DOSSIER[statut];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Registre des gels d’avoirs
        </p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}
        >
          {s.label}
        </span>
      </div>
      <div className="space-y-3 px-4 py-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-500">
            {statut === "NON_EFFECTUE"
              ? "Le contrôle se lance automatiquement dès que le dossier est enregistré."
              : `Dernier contrôle le ${date(dateControle)} · registre DG Trésor publié le ${date(registreDu)}.`}{" "}
            Contrôle refait chaque nuit (dossier, représentant légal,
            bénéficiaires effectifs).
          </p>
          <button
            type="button"
            onClick={relancer}
            disabled={busy}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            {busy ? "Contrôle…" : "[Relancer le contrôle]"}
          </button>
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        {liste.length > 0 && (
          <ul className="space-y-2">
            {liste.map((c) => {
              const st = STATUT_CORRESPONDANCE[c.statut];
              return (
                <li
                  key={c.id}
                  className={`space-y-2 rounded-xl border p-3 ${c.statut === "A_VERIFIER" ? "border-amber-200 bg-amber-50/40" : "border-slate-200"}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">
                        {c.personneControlee}
                      </p>
                      <p className="text-xs text-slate-500">
                        Inscrit au registre : <strong>{c.nomRegistre}</strong> (
                        {c.natureRegistre === "PERSONNE_MORALE"
                          ? "personne morale"
                          : "personne physique"}
                        , n° {c.idRegistre})
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${st.cls}`}
                    >
                      {st.label}
                    </span>
                  </div>
                  {c.motifs && (
                    <details className="text-xs text-slate-600">
                      <summary className="cursor-pointer text-slate-500">
                        Motifs de l’inscription
                      </summary>
                      <p className="mt-1 whitespace-pre-line">{c.motifs}</p>
                    </details>
                  )}
                  {c.statut === "A_VERIFIER" ? (
                    peutTrancher ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={commentaires[c.id] ?? ""}
                          onChange={(e) =>
                            setCommentaires((prev) => ({
                              ...prev,
                              [c.id]: e.target.value,
                            }))
                          }
                          placeholder="Justification (date de naissance, nationalité… comparées) — obligatoire"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={busy || !commentaires[c.id]?.trim()}
                            onClick={() => decider(c, "HOMONYME")}
                            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            Ce n’est pas la même personne (homonyme)
                          </button>
                          <button
                            type="button"
                            disabled={busy || !commentaires[c.id]?.trim()}
                            onClick={() => decider(c, "CONFIRMEE")}
                            className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            C’est la même personne
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-700">
                        À trancher par un responsable ou l’expert-comptable.
                      </p>
                    )
                  ) : (
                    <p className="text-xs text-slate-500">
                      {c.commentaire}
                      {c.decidePar &&
                        ` — ${c.decidePar.prenom} ${c.decidePar.nom}, le ${date(c.decideAt)}`}
                    </p>
                  )}
                  {c.statut === "CONFIRMEE" && (
                    <p className="text-xs font-semibold text-red-700">
                      Gel des avoirs : ne pas réaliser d’opération pour ce
                      client et déclarer sans délai à la DG Trésor.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
