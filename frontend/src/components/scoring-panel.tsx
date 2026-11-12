"use client";

import { useEffect, useState, useCallback } from "react";
import { IconAlertTriangle, IconCheck, IconPencil } from "@tabler/icons-react";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
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
  const { role } = useRole();
  const peutAjuster = role === "EXPERT_COMPTABLE" || role === "ADMIN";
  const [ajustOpen, setAjustOpen] = useState(false);
  const [ajustNiveau, setAjustNiveau] = useState<NiveauRisque | "">("");
  const [justification, setJustification] = useState("");
  const [saving, setSaving] = useState(false);

  async function enregistrerAjustement(niveau: NiveauRisque | null) {
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/scoring/${entityType}/${entityId}/ajustement`, {
        method: "PATCH",
        body: JSON.stringify({ niveau, justification: justification.trim() }),
      });
      setAjustOpen(false);
      setJustification("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

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

          {(latest.reponses.eleveDOffice?.length ?? 0) > 0 && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
              <p className="flex items-center gap-1.5 font-semibold">
                <IconAlertTriangle className="size-3.5" />
                Risque ÉLEVÉ d’office (vigilance renforcée)
              </p>
              <ul className="mt-1 list-disc pl-5">
                {latest.reponses.eleveDOffice!.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          {latest.reponses.ajustementManuel && (
            <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-900">
              <p className="font-semibold">
                Niveau ajusté manuellement
                {latest.reponses.niveauCalcule &&
                  ` (calculé : ${latest.reponses.niveauCalcule})`}
              </p>
              <p className="mt-0.5 whitespace-pre-line">
                {latest.reponses.ajustementManuel.justification}
              </p>
              {latest.reponses.ajustementManuel.par && (
                <p className="mt-0.5 text-indigo-600">
                  par {latest.reponses.ajustementManuel.par}
                  {latest.reponses.ajustementManuel.le &&
                    ` le ${new Date(latest.reponses.ajustementManuel.le).toLocaleDateString("fr-FR")}`}
                </p>
              )}
            </div>
          )}

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

          {peutAjuster && !ajustOpen && (
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setAjustNiveau(latest.niveau);
                  setAjustOpen(true);
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 hover:text-indigo-900"
              >
                <IconPencil className="size-3.5" />
                Ajuster le niveau
              </button>
              {latest.reponses.ajustementManuel && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => enregistrerAjustement(null)}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                  Revenir au niveau calculé
                </button>
              )}
            </div>
          )}

          {ajustOpen && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (ajustNiveau) enregistrerAjustement(ajustNiveau);
              }}
              className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
            >
              <select
                value={ajustNiveau}
                onChange={(e) => setAjustNiveau(e.target.value as NiveauRisque)}
                aria-label="Niveau de risque"
                className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm"
              >
                <option value="FAIBLE">Faible</option>
                <option value="MOYEN">Moyen</option>
                <option value="ELEVE">Élevé</option>
              </select>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                required
                rows={3}
                placeholder="Justification (obligatoire, conservée dans le dossier)"
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
              />
              {(latest.reponses.eleveDOffice?.length ?? 0) > 0 && (
                <p className="text-xs text-red-700">
                  Le niveau restera ÉLEVÉ tant qu’un critère « d’office » est
                  présent.
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setAjustOpen(false)}
                  className="rounded-lg"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving || !justification.trim()}
                  className="rounded-lg"
                >
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </Button>
              </div>
            </form>
          )}
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
