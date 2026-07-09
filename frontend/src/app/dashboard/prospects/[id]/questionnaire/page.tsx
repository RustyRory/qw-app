"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { apiFetch } from "@/lib/apiFetch";
import { useAuth } from "@/hooks/useAuth";
import { StatusBadge } from "@/lib/status";
import { Button } from "@/components/ui/button";
import type { QuestionnaireAcceptation } from "@/types";

export default function QuestionnairePage() {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuth();
  const [questionnaire, setQuestionnaire] =
    useState<QuestionnaireAcceptation | null>(null);
  const [reponsesText, setReponsesText] = useState("{}");
  const [motifRefus, setMotifRefus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch<QuestionnaireAcceptation | null>(`/questionnaires/prospect/${id}`)
      .then((q) => {
        setQuestionnaire(q);
        if (q?.reponses) setReponsesText(JSON.stringify(q.reponses, null, 2));
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleCreate() {
    setSaving(true);
    setError(null);
    try {
      const q = await apiFetch<QuestionnaireAcceptation>("/questionnaires", {
        method: "POST",
        body: JSON.stringify({ prospectId: id }),
      });
      setQuestionnaire(q);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveReponses() {
    if (!questionnaire) return;
    setSaving(true);
    setError(null);
    try {
      const reponses = JSON.parse(reponsesText);
      await apiFetch(`/questionnaires/${questionnaire.id}/reponses`, {
        method: "PATCH",
        body: JSON.stringify({ reponses }),
      });
      load();
    } catch (err) {
      setError(
        err instanceof SyntaxError ? "JSON invalide" : (err as Error).message,
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleValidate() {
    if (!questionnaire) return;
    setSaving(true);
    try {
      await apiFetch(`/questionnaires/${questionnaire.id}/valider`, {
        method: "PATCH",
      });
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRefuse() {
    if (!questionnaire) return;
    setSaving(true);
    try {
      await apiFetch(`/questionnaires/${questionnaire.id}/refuser`, {
        method: "PATCH",
        body: JSON.stringify({ motif: motifRefus }),
      });
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const canDecide =
    role === "RESPONSABLE" || role === "EXPERT_COMPTABLE" || role === "ADMIN";
  const readOnly = questionnaire && questionnaire.statut !== "EN_COURS";

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/prospects/${id}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <IconArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-semibold">
          Questionnaire d&apos;acceptation
        </h1>
        {questionnaire && <StatusBadge status={questionnaire.statut} />}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : !questionnaire ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Aucun questionnaire n&apos;a encore été créé pour ce prospect.
          </p>
          <Button size="sm" onClick={handleCreate} disabled={saving}>
            Créer le questionnaire
          </Button>
        </div>
      ) : (
        <div className="max-w-2xl space-y-4">
          <p className="text-xs text-muted-foreground">
            Réponses stockées en JSON (structure détaillée à définir avec le
            design final — voir workflow-frontend.md §5 pour les 61 questions
            réparties en 10 sections).
          </p>
          <textarea
            value={reponsesText}
            onChange={(e) => setReponsesText(e.target.value)}
            disabled={!!readOnly}
            rows={14}
            className="w-full rounded-md border border-input bg-transparent p-3 font-mono text-xs shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60"
          />
          {!readOnly && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleSaveReponses} disabled={saving}>
                Enregistrer le brouillon
              </Button>
              {canDecide && (
                <>
                  <Button size="sm" onClick={handleValidate} disabled={saving}>
                    Valider ✓
                  </Button>
                  <div className="flex items-center gap-2">
                    <input
                      placeholder="Motif de refus"
                      value={motifRefus}
                      onChange={(e) => setMotifRefus(e.target.value)}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleRefuse}
                      disabled={saving || !motifRefus}
                    >
                      Refuser ✗
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
          {readOnly && questionnaire.validatedBy && (
            <p className="text-xs text-muted-foreground">
              {questionnaire.statut === "VALIDE" ? "Validé" : "Refusé"} par{" "}
              {questionnaire.validatedBy.prenom} {questionnaire.validatedBy.nom}{" "}
              le{" "}
              {questionnaire.validatedAt &&
                new Date(questionnaire.validatedAt).toLocaleDateString("fr-FR")}
              {questionnaire.motifRefus && ` — ${questionnaire.motifRefus}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
