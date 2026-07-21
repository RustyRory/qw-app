"use client";

import { useEffect, useState, useCallback } from "react";
import { IconCheck } from "@tabler/icons-react";
import { apiFetch } from "@/lib/apiFetch";
import { RiskBadge } from "@/lib/status";
import type { ScoreRisque, NiveauRisque } from "@/types";

const NIVEAU_COLOR: Record<NiveauRisque, string> = {
  ELEVE: "text-red-600",
  MOYEN: "text-amber-600",
  FAIBLE: "text-emerald-600",
};

const BAR_COLOR: Record<NiveauRisque, string> = {
  ELEVE: "bg-red-500",
  MOYEN: "bg-amber-500",
  FAIBLE: "bg-emerald-500",
};

// Score de risque : calculé automatiquement pour les clients (données réelles :
// PPE, screening, bénéficiaires effectifs, CA) comme pour les prospects
// (réponses du questionnaire d'acceptation) — plus de saisie manuelle, voir
// ScoringService.recalculateForClient/recalculateForProspect côté backend.
export function ScoringPanel({
  entityType,
  entityId,
}: {
  entityType: "client" | "prospect";
  entityId: string;
}) {
  const [scores, setScores] = useState<ScoreRisque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<ScoreRisque[]>(`/scoring/${entityType}/${entityId}`)
      .then(setScores)
      .catch((err: Error) => {
        setError(err.message);
        setScores([]);
      })
      .finally(() => setLoading(false));
  }, [entityType, entityId]);

  useEffect(() => {
    load();
  }, [load]);

  const latest = scores[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-100 bg-slate-50/80">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          Score de risque
        </p>
        <span className="text-xs font-medium text-slate-400">
          Calcul automatique
        </span>
      </div>

      {error && (
        <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="px-4 py-6 text-center text-sm text-slate-400">
          Chargement du scoring…
        </div>
      ) : latest ? (
        <div className="px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <p className={`text-2xl font-bold ${NIVEAU_COLOR[latest.niveau]}`}>
              {latest.score}
              <span className="text-sm font-normal text-slate-400"> / 100</span>
            </p>
            <RiskBadge level={latest.niveau} />
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${BAR_COLOR[latest.niveau]}`}
              style={{ width: `${Math.min(latest.score, 100)}%` }}
            />
          </div>

          <div className="mt-4 space-y-1.5">
            {latest.reponses.criteres
              .filter((c) => c.declenche)
              .map((c) => (
                <div
                  key={c.code}
                  className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700"
                >
                  <IconCheck className="size-3.5 shrink-0" />
                  {c.label}
                </div>
              ))}
            {latest.reponses.criteres.every((c) => !c.declenche) && (
              <p className="text-xs text-slate-400">
                Aucun facteur de risque détecté.
              </p>
            )}
          </div>

          <p className="mt-4 text-xs text-slate-400">
            Calculé le {new Date(latest.createdAt).toLocaleDateString("fr-FR")}
            {scores.length > 1 && ` • ${scores.length} évaluations`}
          </p>
        </div>
      ) : (
        <div className="px-4 py-6 text-center text-sm text-slate-400">
          {entityType === "prospect"
            ? "Aucun score — répondez au questionnaire d'acceptation pour calculer le score automatiquement."
            : "Aucun score — sera calculé automatiquement à la prochaine mise à jour du dossier (PPE, screening, bénéficiaires, CA…)."}
        </div>
      )}
    </div>
  );
}
