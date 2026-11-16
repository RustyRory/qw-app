"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";

type Reponse = {
  reponse?: "oui" | "non" | null;
  niveau?: "E" | "M" | "F" | null;
  observation?: string | null;
};

interface Question {
  id: string;
  texte: string;
  type: "oui_non" | "oui_non_risque";
  attendu: "oui" | "non";
}

interface Section {
  id: string;
  titre: string;
  intro?: string;
  maintienSeulement?: boolean;
  questions: Question[];
}

interface Acceptation {
  id: string;
  statut: "EN_COURS" | "ACCEPTEE";
  reponses: Record<string, Reponse>;
  decideeAt?: string | null;
  decideePar?: { prenom: string; nom: string } | null;
  updatedAt?: string;
}

const NIVEAUX: { val: "E" | "M" | "F"; label: string; cls: string }[] = [
  { val: "F", label: "Faible", cls: "border-emerald-500 bg-emerald-500" },
  { val: "M", label: "Moyen", cls: "border-amber-500 bg-amber-500" },
  { val: "E", label: "Élevé", cls: "border-red-600 bg-red-600" },
];

function Choix({
  actif,
  label,
  cls = "border-slate-800 bg-slate-800",
  onClick,
  disabled,
}: {
  actif: boolean;
  label: string;
  cls?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex items-center gap-1.5 py-1 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span
        className={`flex size-4 items-center justify-center rounded-full border-2 ${actif ? cls : "border-slate-400 bg-white"}`}
      >
        {actif && <span className="size-1.5 rounded-full bg-white" />}
      </span>
      {label}
    </button>
  );
}

// Questionnaire d'acceptation de la mission (et de maintien annuel pour un
// client) : rempli par le collaborateur, décision réservée à
// l'expert-comptable.
export function AcceptationForm({
  cible,
  cibleId,
}: {
  cible: "prospect" | "client";
  cibleId: string;
}) {
  const { role } = useRole();
  const estEC = role === "EXPERT_COMPTABLE" || role === "ADMIN";
  const peutRouvrir = estEC || role === "RESPONSABLE";
  const [catalogue, setCatalogue] = useState<Section[]>([]);
  const [acceptation, setAcceptation] = useState<Acceptation | null>(null);
  const [reponses, setReponses] = useState<Record<string, Reponse>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<Section[]>("/acceptations/catalogue")
      .then(setCatalogue)
      .catch(() => setCatalogue([]));
    apiFetch<Acceptation | null>(`/acceptations/${cible}/${cibleId}`)
      .then((a) => {
        setAcceptation(a);
        setReponses(a?.reponses ?? {});
      })
      .catch(() => setAcceptation(null));
  }, [cible, cibleId]);

  useEffect(() => {
    load();
  }, [load]);

  const verrouille = acceptation?.statut === "ACCEPTEE";
  const sections = catalogue.filter(
    (s) => cible === "client" || !s.maintienSeulement,
  );
  const questions = sections.flatMap((s) => s.questions);
  const sansReponse = questions.filter((q) => !reponses[q.id]?.reponse).length;

  function maj(id: string, patch: Partial<Reponse>) {
    setReponses((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function action(fn: () => Promise<void>, message: string) {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await fn();
      setInfo(message);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const enregistrer = () =>
    action(async () => {
      await apiFetch(`/acceptations/${cible}/${cibleId}`, {
        method: "PUT",
        body: JSON.stringify({ reponses }),
      });
    }, "Réponses enregistrées.");

  const accepter = () =>
    action(
      async () => {
        await apiFetch(`/acceptations/${cible}/${cibleId}`, {
          method: "PUT",
          body: JSON.stringify({ reponses }),
        });
        const a = await apiFetch<Acceptation>(
          `/acceptations/${cible}/${cibleId}`,
        );
        await apiFetch(`/acceptations/${a.id}/accepter`, { method: "PATCH" });
      },
      cible === "client"
        ? "Maintien de la mission décidé."
        : "Mission acceptée.",
    );

  const rouvrir = () =>
    action(async () => {
      await apiFetch(`/acceptations/${acceptation!.id}/rouvrir`, {
        method: "PATCH",
      });
    }, "Questionnaire rouvert pour la revue annuelle.");

  return (
    <div className="space-y-4">
      {verrouille && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">
            {cible === "client"
              ? "Maintien de la mission décidé"
              : "Mission acceptée"}
            {acceptation?.decideeAt &&
              ` le ${new Date(acceptation.decideeAt).toLocaleDateString("fr-FR")}`}
            {acceptation?.decideePar &&
              ` par ${acceptation.decideePar.prenom} ${acceptation.decideePar.nom}`}
          </p>
          {peutRouvrir && (
            <button
              type="button"
              disabled={busy}
              onClick={rouvrir}
              className="mt-2 text-xs font-semibold text-emerald-800 underline"
            >
              Rouvrir (revue annuelle de maintien)
            </button>
          )}
        </div>
      )}

      {sections.map((section) => (
        <section
          key={section.id}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
            <p className="text-sm font-semibold text-slate-800">
              {section.titre}
            </p>
            {section.intro && (
              <p className="mt-0.5 text-xs text-slate-500">{section.intro}</p>
            )}
          </div>
          <div className="divide-y divide-slate-100">
            {section.questions.map((q) => {
              const r = reponses[q.id] ?? {};
              const atypique = r.reponse && r.reponse !== q.attendu;
              return (
                <div key={q.id} className="space-y-1.5 px-5 py-3">
                  <p className="text-sm text-slate-800">{q.texte}</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <Choix
                      label="Non"
                      actif={r.reponse === "non"}
                      disabled={verrouille}
                      onClick={() => maj(q.id, { reponse: "non" })}
                    />
                    <Choix
                      label="Oui"
                      actif={r.reponse === "oui"}
                      disabled={verrouille}
                      onClick={() => maj(q.id, { reponse: "oui" })}
                    />
                    {q.type === "oui_non_risque" && (
                      <span className="flex items-center gap-3 border-l border-slate-200 pl-4">
                        <span className="text-xs text-slate-400">Risque :</span>
                        {NIVEAUX.map((n) => (
                          <Choix
                            key={n.val}
                            label={n.label}
                            cls={n.cls}
                            actif={r.niveau === n.val}
                            disabled={verrouille}
                            onClick={() => maj(q.id, { niveau: n.val })}
                          />
                        ))}
                      </span>
                    )}
                  </div>
                  {atypique && (
                    <p className="text-xs font-medium text-amber-700">
                      Réponse à justifier auprès de l’expert-comptable.
                    </p>
                  )}
                  <input
                    type="text"
                    value={r.observation ?? ""}
                    disabled={verrouille}
                    onChange={(e) => maj(q.id, { observation: e.target.value })}
                    placeholder="Observations (facultatif)"
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:bg-slate-50"
                  />
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {info && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {info}
        </div>
      )}

      {!verrouille && catalogue.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            {sansReponse > 0
              ? `${sansReponse} question${sansReponse > 1 ? "s" : ""} sans réponse.`
              : "Toutes les questions ont une réponse."}{" "}
            L’acceptation de la mission ne se délègue pas : elle est décidée par
            l’expert-comptable.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={busy}
              onClick={enregistrer}
              className="rounded-xl"
            >
              Enregistrer
            </Button>
            {estEC && (
              <Button
                disabled={busy || sansReponse > 0}
                onClick={accepter}
                className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {cible === "client"
                  ? "Je décide de maintenir la mission"
                  : "Je décide d’accepter la mission"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
