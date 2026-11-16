"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { apiFetch } from "@/lib/apiFetch";
import { MODULES, PCT_OPTIONS } from "@/lib/questionnaire-lab";
import type { QuestionnaireAcceptation } from "@/types";

interface ProspectOrigine {
  id: string;
  ref: string;
  createdAt?: string;
  notes?: string | null;
  assignedTo?: { prenom: string; nom: string } | null;
  createdBy?: { prenom: string; nom: string } | null;
}

function libelleReponse(kind: string, valeur: string): string {
  if (kind === "pct") {
    return PCT_OPTIONS.find((o) => o.value === valeur)?.label ?? valeur;
  }
  return (
    {
      oui: "Oui",
      non: "Non",
      risque_moyen: "Risque moyen",
      risque_eleve: "Risque élevé",
    }[valeur] ?? valeur
  );
}

// Fiche client : ce qui vient du prospect d'origine (historique, réponses
// du questionnaire LAB) et accès au questionnaire d'acceptation / maintien.
export function OriginePropect({
  clientId,
  prospect,
}: {
  clientId: string;
  prospect: ProspectOrigine | null | undefined;
}) {
  const [lab, setLab] = useState<QuestionnaireAcceptation | null>(null);
  const [acceptation, setAcceptation] = useState<{
    statut: string;
    decideeAt?: string | null;
  } | null>(null);

  useEffect(() => {
    if (prospect) {
      apiFetch<QuestionnaireAcceptation | null>(
        `/questionnaires/prospect/${prospect.id}`,
      )
        .then(setLab)
        .catch(() => setLab(null));
    }
    apiFetch<{ statut: string; decideeAt?: string | null } | null>(
      `/acceptations/client/${clientId}`,
    )
      .then(setAcceptation)
      .catch(() => setAcceptation(null));
  }, [clientId, prospect]);

  const reponses = (lab?.reponses ?? {}) as Record<string, string>;
  const aRisque = MODULES.flatMap((m) =>
    m.groups.flatMap((g) =>
      g.questions
        .filter((q) => {
          const v = reponses[q.id];
          return v && v !== "non" && v !== "0";
        })
        .map((q) => ({ module: m.title, q, v: reponses[q.id] })),
    ),
  );
  const nbReponses = Object.values(reponses).filter(Boolean).length;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Origine du dossier et questionnaires
        </p>
      </div>
      <div className="space-y-4 px-4 py-4 text-sm">
        {prospect ? (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-400">Prospect d’origine</dt>
              <dd>
                <Link
                  href={`/dashboard/prospects/${prospect.id}`}
                  className="font-medium text-blue-600 hover:text-blue-800"
                >
                  {prospect.ref} →
                </Link>
              </dd>
            </div>
            {prospect.createdAt && (
              <div>
                <dt className="text-xs text-slate-400">
                  Entré dans le pipeline
                </dt>
                <dd>
                  {new Date(prospect.createdAt).toLocaleDateString("fr-FR")}
                  {prospect.createdBy &&
                    ` par ${prospect.createdBy.prenom} ${prospect.createdBy.nom}`}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-slate-400">Suivi par</dt>
              <dd>
                {prospect.assignedTo
                  ? `${prospect.assignedTo.prenom} ${prospect.assignedTo.nom}`
                  : "—"}
              </dd>
            </div>
            {prospect.notes && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-slate-400">Notes du prospect</dt>
                <dd className="whitespace-pre-line text-slate-700">
                  {prospect.notes}
                </dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="text-xs text-slate-400">
            Pas de prospect d’origine enregistré.
          </p>
        )}

        <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-3">
          {prospect && (
            <Link
              href={`/dashboard/prospects/${prospect.id}/questionnaire`}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Voir le questionnaire LAB
              {lab
                ? ` (${lab.statut === "VALIDE" ? "validé" : lab.statut === "REFUSE" ? "refusé" : "en cours"})`
                : ""}
            </Link>
          )}
          <Link
            href={`/dashboard/clients/${clientId}/acceptation`}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Questionnaire d’acceptation / maintien de la mission
            {acceptation
              ? acceptation.statut === "ACCEPTEE"
                ? ` (accepté le ${acceptation.decideeAt ? new Date(acceptation.decideeAt).toLocaleDateString("fr-FR") : "—"})`
                : " (à compléter)"
              : " (non rempli)"}
          </Link>
        </div>

        {lab && (
          <div>
            <p className="mb-1 text-xs font-semibold text-slate-500">
              Questionnaire LAB : {nbReponses} réponse
              {nbReponses > 1 ? "s" : ""}
              {aRisque.length === 0
                ? " — aucun facteur de risque déclaré"
                : ` — ${aRisque.length} point${aRisque.length > 1 ? "s" : ""} d’attention`}
            </p>
            {aRisque.length > 0 && (
              <ul className="space-y-1">
                {aRisque.map(({ module, q, v }) => (
                  <li
                    key={q.id}
                    className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-900"
                  >
                    <span className="font-semibold">
                      {libelleReponse(q.kind, v)}
                    </span>{" "}
                    — {q.text}{" "}
                    <span className="text-amber-700">({module})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
