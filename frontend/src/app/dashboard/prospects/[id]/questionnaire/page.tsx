"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  IconArrowLeft,
  IconChevronDown,
  IconChevronRight,
} from "@tabler/icons-react";
import { apiFetch } from "@/lib/apiFetch";
import { isCodePostalDrom } from "@/lib/sirene";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import type {
  Prospect,
  QuestionnaireAcceptation,
  StatutQuestionnaire,
} from "@/types";

// Suggestions déduites des données du prospect (SIRENE), appliquées uniquement
// aux questions pas encore répondues — l'utilisateur reste libre de les corriger.
function suggestionsFromProspect(prospect: Prospect): Reponses {
  const suggestions: Reponses = {};

  if (isCodePostalDrom(prospect.codePostal)) {
    suggestions["D3_4"] = "oui";
  }

  const naf = prospect.codeNaf?.replace(/[^0-9A-Z]/gi, "").toUpperCase();
  if (naf === "9492Z") {
    suggestions["D1_3"] = "oui";
  }

  return suggestions;
}

// Indices affichés à côté de certaines questions à partir des données du
// prospect, sans jamais présélectionner de réponse : le NAF/pays est un
// indice pertinent mais pas une preuve suffisante pour cocher à la place
// du collaborateur (pas de table NAF↔question ni de liste GAFI/UE fiable
// embarquée ici).
function hintsFromProspect(prospect: Prospect): Record<string, string> {
  const hints: Record<string, string> = {};

  if (prospect.pays && prospect.pays !== "France") {
    const msg = `Pays du prospect : ${prospect.pays} — à vérifier dans la liste`;
    hints["D3_1_1"] = `${msg} GAFI / UE à haut risque.`;
    hints["D3_2_1"] = `${msg} des pays non coopératifs (UE / France).`;
  }

  return hints;
}

import {
  ALL_QUESTIONS,
  MODULES,
  PCT_OPTIONS,
  type QModule,
  type Question,
  type Reponses,
} from "@/lib/questionnaire-lab";

const STATUT_LABEL: Record<
  StatutQuestionnaire,
  { label: string; color: string; dot: string }
> = {
  EN_COURS: { label: "En cours", color: "text-amber-700", dot: "bg-amber-500" },
  VALIDE: { label: "Validé", color: "text-emerald-700", dot: "bg-emerald-500" },
  REFUSE: { label: "Refusé", color: "text-red-700", dot: "bg-red-500" },
};

function OuiNonGroup({
  qid,
  value,
  onChange,
  disabled,
}: {
  qid: string;
  value: string | undefined;
  onChange: (id: string, val: string) => void;
  disabled?: boolean;
}) {
  // « Non » en premier : c'est la réponse la plus fréquente.
  const options = [
    { val: "non", label: "Non" },
    { val: "oui", label: "Oui" },
  ];
  return (
    <div className="flex items-center gap-4 mt-1.5">
      {options.map(({ val, label }) => (
        <label
          key={val}
          onClick={() => !disabled && onChange(qid, value === val ? "" : val)}
          className={`flex items-center gap-1.5 py-1 group ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        >
          <div
            className={`size-4 shrink-0 rounded-full border-2 flex items-center justify-center transition-all
              ${value === val ? "border-slate-800 bg-slate-800" : "border-slate-400 bg-white group-hover:border-slate-600"}`}
          >
            {value === val && (
              <div className="size-1.5 rounded-full bg-white" />
            )}
          </div>
          <span className="text-sm text-slate-700">{label}</span>
        </label>
      ))}
    </div>
  );
}

function SeuilGroup({
  qid,
  value,
  onChange,
  disabled,
}: {
  qid: string;
  value: string | undefined;
  onChange: (id: string, val: string) => void;
  disabled?: boolean;
}) {
  const options = [
    { val: "non", label: "Non", ring: "border-slate-800 bg-slate-800" },
    {
      val: "risque_moyen",
      label: "Risque moyen",
      ring: "border-amber-500 bg-amber-500",
    },
    {
      val: "risque_eleve",
      label: "Risque élevé",
      ring: "border-red-600 bg-red-600",
    },
  ];
  return (
    <div className="flex items-center gap-4 mt-1.5 flex-wrap">
      {options.map(({ val, label, ring }) => (
        <label
          key={val}
          onClick={() => !disabled && onChange(qid, value === val ? "" : val)}
          className={`flex items-center gap-1.5 py-1 group ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        >
          <div
            className={`size-4 shrink-0 rounded-full border-2 flex items-center justify-center transition-all
              ${value === val ? ring : "border-slate-400 bg-white group-hover:border-slate-600"}`}
          >
            {value === val && (
              <div className="size-1.5 rounded-full bg-white" />
            )}
          </div>
          <span className="text-sm text-slate-700">{label}</span>
        </label>
      ))}
    </div>
  );
}

function PctSelect({
  qid,
  value,
  onChange,
  disabled,
}: {
  qid: string;
  value: string | undefined;
  onChange: (id: string, val: string) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(qid, e.target.value)}
      disabled={disabled}
      className="mt-1.5 w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60"
    >
      <option value="">Sélectionner…</option>
      {PCT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function QuestionRow({
  question,
  value,
  onChange,
  disabled,
  hint,
}: {
  question: Question;
  value: string | undefined;
  onChange: (id: string, val: string) => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <p className="text-sm text-slate-800">{question.text}</p>
      {hint && (
        <p className="mt-0.5 text-xs font-medium text-blue-600">ℹ️ {hint}</p>
      )}
      {question.kind === "seuil" && (
        <p className="mt-0.5 text-xs text-slate-400">
          RM : {question.seuilRM} · RE : {question.seuilRE}
        </p>
      )}
      {question.kind === "oui_non" && (
        <OuiNonGroup
          qid={question.id}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      )}
      {question.kind === "seuil" && (
        <SeuilGroup
          qid={question.id}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      )}
      {question.kind === "pct" && (
        <PctSelect
          qid={question.id}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      )}
    </div>
  );
}

function ModulePanel({
  module,
  reponses,
  onChange,
  onBulkAction,
  isOpen,
  onToggle,
  disabled,
  hints,
}: {
  module: QModule;
  reponses: Reponses;
  onChange: (id: string, val: string) => void;
  onBulkAction: (module: QModule, mode: "oui" | "non" | "clear") => void;
  isOpen: boolean;
  onToggle: () => void;
  disabled?: boolean;
  hints?: Record<string, string>;
}) {
  const questions = module.groups.flatMap((g) => g.questions);
  const answered = questions.filter((q) => !!reponses[q.id]).length;
  const ref = useRef<HTMLDivElement>(null);

  // À l'ouverture d'un module, l'affiche en haut de l'écran (sinon le module
  // précédent, en se refermant, le laisse tout en bas de la page).
  useEffect(() => {
    if (!isOpen) return;
    const t = window.setTimeout(
      () => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      50,
    );
    return () => window.clearTimeout(t);
  }, [isOpen]);
  const total = questions.length;
  const complete = answered === total;

  return (
    <div
      ref={ref}
      className="scroll-mt-24 rounded-xl border bg-white overflow-hidden border-slate-200"
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        <span className="text-sm font-medium text-slate-800">
          {module.num}. {module.title}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {complete && (
            <span className="text-xs text-emerald-600 font-semibold">✓</span>
          )}
          {answered > 0 && !complete && (
            <span className="text-xs text-amber-600 font-medium">
              {answered}/{total}
            </span>
          )}
          {isOpen ? (
            <IconChevronDown className="size-4 text-slate-400" />
          ) : (
            <IconChevronRight className="size-4 text-slate-400" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-6">
          {!disabled && (
            <div className="flex flex-wrap items-center gap-2 -mb-1">
              <button
                type="button"
                onClick={() => onBulkAction(module, "non")}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                title="Répond « Non » à toutes les questions de ce module"
              >
                Tout cocher (Non)
              </button>
              <button
                type="button"
                onClick={() => onBulkAction(module, "oui")}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                title="Répond « Oui » (risque élevé) à toutes les questions de ce module"
              >
                Tout cocher (Oui)
              </button>
              {answered > 0 && (
                <button
                  type="button"
                  onClick={() => onBulkAction(module, "clear")}
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  title="Efface les réponses déjà saisies dans ce module"
                >
                  Tout décocher
                </button>
              )}
            </div>
          )}

          {module.groups.map((group, gi) => (
            <div key={gi} className="space-y-5">
              {group.label && (
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  {group.label}
                  {group.lien && (
                    <a
                      href={group.lien.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 normal-case tracking-normal font-semibold text-blue-600 hover:underline"
                    >
                      {group.lien.texte} ↗
                    </a>
                  )}
                </p>
              )}
              {group.questions.map((q) => (
                <QuestionRow
                  key={q.id}
                  question={q}
                  value={reponses[q.id]}
                  onChange={onChange}
                  disabled={disabled}
                  hint={hints?.[q.id]}
                />
              ))}
            </div>
          ))}

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
              Notes internes
            </p>
            <textarea
              value={reponses[`notes_${module.id}`] ?? ""}
              onChange={(e) => onChange(`notes_${module.id}`, e.target.value)}
              rows={3}
              disabled={disabled}
              placeholder="Précisions, contexte, éléments à tracer pour ce module…"
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuestionnairePage() {
  const { id } = useParams<{ id: string }>();
  const { can } = useRole();

  const [questionnaire, setQuestionnaire] =
    useState<QuestionnaireAcceptation | null>(null);
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [reponses, setReponses] = useState<Reponses>({});
  const [openModule, setOpenModule] = useState<string | null>("d1");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deciding, setDeciding] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiFetch<QuestionnaireAcceptation | null>(
        `/questionnaires/prospect/${id}`,
      ),
      apiFetch<Prospect>(`/prospects/${id}`),
    ])
      .then(([q, fetchedProspect]) => {
        setQuestionnaire(q);
        setProspect(fetchedProspect);
        const existing = (q?.reponses as Reponses | undefined) ?? {};
        // Les suggestions ne comblent que les questions pas encore répondues.
        setReponses({
          ...suggestionsFromProspect(fetchedProspect),
          ...existing,
        });
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const statut = questionnaire?.statut ?? "EN_COURS";
  const editable = statut === "EN_COURS";

  const totalQuestions = ALL_QUESTIONS.length;
  const answeredCount = ALL_QUESTIONS.filter((q) => !!reponses[q.id]).length;
  const progressPct = Math.round((answeredCount / totalQuestions) * 100);

  const hasRisqueEleve = ALL_QUESTIONS.some((q) => {
    const val = reponses[q.id];
    return q.kind === "seuil" ? val === "risque_eleve" : val === "oui";
  });

  const hints = prospect ? hintsFromProspect(prospect) : {};

  function handleChange(qid: string, val: string) {
    setReponses((prev) => ({ ...prev, [qid]: val }));
  }

  // Actions groupées à l'échelle d'un module (onglet) : répond « Oui » ou
  // « Non » à TOUTES les questions du module (réponses déjà saisies
  // comprises, pour pouvoir basculer directement de tout-Oui à tout-Non), ou
  // les remet à zéro.
  function handleModuleAction(module: QModule, mode: "oui" | "non" | "clear") {
    const moduleQuestions = module.groups.flatMap((g) => g.questions);
    if (
      mode === "clear" &&
      !confirm(`Effacer les réponses déjà saisies dans « ${module.title} » ?`)
    ) {
      return;
    }
    setReponses((prev) => {
      const next = { ...prev };
      for (const q of moduleQuestions) {
        if (mode === "clear") {
          delete next[q.id];
          continue;
        }
        if (mode === "non") {
          next[q.id] = q.kind === "pct" ? "0" : "non";
        } else {
          next[q.id] =
            q.kind === "pct"
              ? "gt20"
              : q.kind === "seuil"
                ? "risque_eleve"
                : "oui";
        }
      }
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      if (questionnaire) {
        const updated = await apiFetch<QuestionnaireAcceptation>(
          `/questionnaires/${questionnaire.id}/reponses`,
          {
            method: "PATCH",
            body: JSON.stringify({ reponses }),
          },
        );
        setQuestionnaire(updated);
      } else {
        const created = await apiFetch<QuestionnaireAcceptation>(
          "/questionnaires",
          {
            method: "POST",
            body: JSON.stringify({ prospectId: id, reponses }),
          },
        );
        setQuestionnaire(created);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleMarquerComplete() {
    if (!questionnaire) return;
    setDeciding(true);
    setError(null);
    try {
      const updated = await apiFetch<QuestionnaireAcceptation>(
        `/questionnaires/${questionnaire.id}/completer`,
        { method: "PATCH" },
      );
      setQuestionnaire(updated);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeciding(false);
    }
  }

  async function handleValider() {
    if (!questionnaire) return;
    setDeciding(true);
    setError(null);
    try {
      const updated = await apiFetch<QuestionnaireAcceptation>(
        `/questionnaires/${questionnaire.id}/valider`,
        {
          method: "PATCH",
        },
      );
      setQuestionnaire(updated);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeciding(false);
    }
  }

  async function handleRefuser() {
    if (!questionnaire) return;
    const motif = reponses["decision_commentaire"]?.trim();
    if (!motif) {
      setError(
        "Merci de renseigner un commentaire expliquant le refus avant de refuser le dossier.",
      );
      return;
    }
    setDeciding(true);
    setError(null);
    try {
      const updated = await apiFetch<QuestionnaireAcceptation>(
        `/questionnaires/${questionnaire.id}/refuser`,
        {
          method: "PATCH",
          body: JSON.stringify({ motif }),
        },
      );
      setQuestionnaire(updated);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeciding(false);
    }
  }

  async function handleReopen() {
    if (!questionnaire) return;
    if (
      !confirm(
        "Rouvrir ce questionnaire pour reprise annuelle ? La décision précédente sera archivée dans l'historique et devra être revalidée.",
      )
    ) {
      return;
    }
    setDeciding(true);
    setError(null);
    try {
      const updated = await apiFetch<QuestionnaireAcceptation>(
        `/questionnaires/${questionnaire.id}/rouvrir`,
        {
          method: "PATCH",
        },
      );
      setQuestionnaire(updated);
      setReponses((updated.reponses as Reponses | undefined) ?? {});
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeciding(false);
    }
  }

  function handleAnnuler() {
    if (confirm("Abandonner les modifications non enregistrées ?")) {
      setReponses((questionnaire?.reponses as Reponses | undefined) ?? {});
    }
  }

  const statutInfo = STATUT_LABEL[statut];

  return (
    <div className="min-h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b px-5 py-4 md:px-8 sticky top-0 md:top-0 z-10">
        <div className="flex items-center gap-3 mb-2">
          <Link
            href={
              prospect?.client
                ? `/dashboard/clients/${prospect.client.id}`
                : `/dashboard/prospects/${id}`
            }
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <IconArrowLeft className="size-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">
                Questionnaire LAB — Exposition aux risques
              </h1>
              <span className="flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${statutInfo.dot}`} />
                <span className={`text-xs font-semibold ${statutInfo.color}`}>
                  {statutInfo.label}
                </span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              5 modules — {totalQuestions} questions (D1 Caractéristiques, D2
              Activités et secteurs, D3 Exposition aux risques/Localisation, D4
              Nature de la mission, D5 Opérations particulières)
            </p>
            {prospect && (prospect.pays || prospect.codeNaf) && (
              <p className="mt-1 text-xs text-slate-400">
                Fiche prospect — {prospect.pays && <>Pays : {prospect.pays}</>}
                {prospect.pays && prospect.codeNaf && " · "}
                {prospect.codeNaf && <>NAF : {prospect.codeNaf}</>} (à
                rapprocher manuellement des modules D2/D3)
              </p>
            )}
          </div>
        </div>

        {/* Barre de progression */}
        {answeredCount > 0 && (
          <div className="ml-8">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-slate-500">
                {answeredCount}/{totalQuestions} questions
              </p>
              <p className="text-xs font-semibold text-slate-600">
                {progressPct}%
              </p>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mx-4 mt-4 md:mx-8 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {saved && (
        <div className="mx-4 mt-4 md:mx-8 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">
          ✓ Brouillon enregistré
        </div>
      )}
      {!editable && (
        <div className="mx-4 mt-4 md:mx-8 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-100 border border-slate-200 p-3 text-sm text-slate-600">
          <span>
            Ce questionnaire est {statutInfo.label.toLowerCase()} et n&apos;est
            plus modifiable.
          </span>
          {can.validerQuestionnaire && (
            <Button
              type="button"
              variant="outline"
              onClick={handleReopen}
              disabled={deciding}
              className="rounded-lg border-slate-300"
            >
              Rouvrir pour reprise annuelle
            </Button>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="size-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-4 py-4 md:px-8 md:py-6 space-y-4">
          <div className="flex flex-col gap-3">
            {MODULES.map((module) => (
              <ModulePanel
                key={module.id}
                module={module}
                reponses={reponses}
                onChange={handleChange}
                onBulkAction={handleModuleAction}
                isOpen={openModule === module.id}
                onToggle={() =>
                  setOpenModule((prev) =>
                    prev === module.id ? null : module.id,
                  )
                }
                disabled={!editable}
                hints={hints}
              />
            ))}
          </div>

          {/* Décision */}
          <div
            className={`rounded-xl border overflow-hidden ${
              hasRisqueEleve
                ? "border-red-200 bg-red-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="px-5 py-4 space-y-5">
              <p
                className={`text-xs font-bold uppercase tracking-widest ${
                  hasRisqueEleve ? "text-red-600" : "text-slate-400"
                }`}
              >
                Décision d&apos;acceptation
              </p>

              {/* Niveau diligences */}
              <div>
                <p className="text-sm text-slate-700 mb-2">
                  Niveau de diligences
                </p>
                <select
                  value={reponses["decision_diligences"] ?? "standard"}
                  onChange={(e) =>
                    handleChange("decision_diligences", e.target.value)
                  }
                  disabled={!editable}
                  className="w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60"
                >
                  <option value="standard">Standard</option>
                  <option value="renforcees">Renforcées</option>
                  <option value="renforcees_validation">
                    Renforcées + validation hiérarchique
                  </option>
                </select>
              </div>

              {/* Commentaire */}
              <div>
                <p className="text-sm text-slate-700 mb-2">
                  Commentaire {"/"} motif (obligatoire en cas de refus)
                </p>
                <textarea
                  value={reponses["decision_commentaire"] ?? ""}
                  onChange={(e) =>
                    handleChange("decision_commentaire", e.target.value)
                  }
                  rows={4}
                  disabled={!editable}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none disabled:opacity-60"
                />
              </div>

              {hasRisqueEleve ? (
                <p className="text-xs font-medium text-amber-700">
                  ⚠️ Risque élevé identifié dans le questionnaire :
                  contresignature de l&apos;expert-comptable requise
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  Si un risque élevé est identifié dans le questionnaire, la
                  contresignature de l&apos;expert-comptable sera requise.
                </p>
              )}

              {/* Boutons */}
              <div className="flex items-center gap-3 pt-1 flex-wrap">
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !editable}
                  className="rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold"
                >
                  {saving ? "Enregistrement…" : "Enregistrer le brouillon"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAnnuler}
                  disabled={!editable}
                  className="rounded-lg border-slate-200"
                >
                  Annuler
                </Button>

                {/* Le collab signale qu'il a fini de renseigner le
                    questionnaire : fait avancer le prospect en
                    VALIDATION_LAB et notifie RESPONSABLE/EXPERT_COMPTABLE.
                    Inutile pour ceux qui peuvent déjà valider directement. */}
                {!can.validerQuestionnaire && questionnaire && editable && (
                  <>
                    <span className="text-slate-300">|</span>
                    <Button
                      type="button"
                      onClick={handleMarquerComplete}
                      disabled={deciding}
                      className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    >
                      {deciding
                        ? "Envoi…"
                        : "Marquer comme complété → notifier le responsable"}
                    </Button>
                  </>
                )}

                {can.validerQuestionnaire && questionnaire && editable && (
                  <>
                    <span className="text-slate-300">|</span>
                    <Button
                      type="button"
                      onClick={handleValider}
                      disabled={deciding}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      Valider ✓
                    </Button>
                    <Button
                      type="button"
                      onClick={handleRefuser}
                      disabled={deciding}
                      variant="outline"
                      className="rounded-lg border-red-300 text-red-600 hover:bg-red-50"
                    >
                      Refuser ✗
                    </Button>
                  </>
                )}
                {can.validerQuestionnaire && !questionnaire && (
                  <span className="text-xs text-slate-400">
                    Enregistrez un premier brouillon pour pouvoir valider ou
                    refuser.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
