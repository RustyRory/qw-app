"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft, IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

type Reponse = "oui" | "non" | "sans_objet" | null;
type Reponses = Record<string, Reponse | string>;

type Question = { id: string; text: string; hasNA?: boolean };
type Section = { id: string; num: number; title: string; questions: Question[] };

const SECTIONS: Section[] = [
  {
    id: "s1", num: 1, title: "Identification du client",
    questions: [
      { id: "q1_1", text: "L'identité du client a-t-elle été vérifiée sur pièce officielle en cours de validité ?" },
      { id: "q1_2", text: "Le Kbis (PM) ou la CNI/passeport (PP) a-t-il été collecté et vérifié ?" },
      { id: "q1_3", text: "Le représentant légal a-t-il été identifié et son pouvoir d'engager vérifié ?" },
      { id: "q1_4", text: "Un justificatif de domicile de moins de 3 mois a-t-il été obtenu ?" },
      { id: "q1_5", text: "Les statuts constitutifs (PM) ont-ils été collectés ?", hasNA: true },
      { id: "q1_6", text: "Le registre des Bénéficiaires Effectifs (RBE) a-t-il été consulté ?", hasNA: true },
      { id: "q1_7", text: "Les données RBE sont-elles cohérentes avec les déclarations du client ?", hasNA: true },
    ],
  },
  {
    id: "s2", num: 2, title: "Nature de la relation d'affaires",
    questions: [
      { id: "q2_1", text: "La nature et le périmètre de la mission sont-ils clairement définis ?" },
      { id: "q2_2", text: "La mission est-elle dans le périmètre habituel et les compétences du cabinet ?" },
      { id: "q2_3", text: "Les honoraires sont-ils cohérents avec la mission et la taille de l'entreprise ?" },
      { id: "q2_4", text: "Le mode de règlement des honoraires est-il exclusivement par virement bancaire identifié ?" },
      { id: "q2_5", text: "Y a-t-il un conflit d'intérêts potentiel avec un autre client du cabinet ?" },
      { id: "q2_6", text: "Le client comprend-il et accepte-t-il les obligations LCB-FT de la relation ?" },
    ],
  },
  {
    id: "s3", num: 3, title: "Origine des fonds",
    questions: [
      { id: "q3_1", text: "L'origine des fonds affectés à la mission est-elle connue et documentée ?" },
      { id: "q3_2", text: "La source du patrimoine du client a-t-elle été expliquée et vérifiée ?", hasNA: true },
      { id: "q3_3", text: "Les flux financiers sont-ils cohérents avec l'activité déclarée ?" },
      { id: "q3_4", text: "Des transactions en espèces importantes (>1 000 €) ont-elles été détectées ?" },
      { id: "q3_5", text: "Des paiements proviennent-ils de tiers non identifiés ou de comptes tiers ?" },
    ],
  },
  {
    id: "s4", num: 4, title: "Zone géographique / pays à risque",
    questions: [
      { id: "q4_1", text: "Le siège social est-il situé en France ou dans un pays de l'UE ?" },
      { id: "q4_2", text: "Les activités sont-elles exercées principalement en France ?" },
      { id: "q4_3", text: "Le client a-t-il des filiales ou partenaires dans des pays listés par le GAFI ?" },
      { id: "q4_4", text: "Le client effectue-t-il des transactions avec des pays sous embargo européen ou ONU ?" },
      { id: "q4_5", text: "Des flux financiers importants sont-ils dirigés vers ou reçus de pays à risque ?" },
      { id: "q4_6", text: "Le client opère-t-il dans des zones géographiques à forte criminalité financière ?" },
    ],
  },
  {
    id: "s5", num: 5, title: "Activité et secteur",
    questions: [
      { id: "q5_1", text: "L'activité principale est-elle cohérente avec le code NAF/APE déclaré ?" },
      { id: "q5_2", text: "Le secteur est-il sensible (crypto, jeux, immobilier, art, armement, change, forex) ?" },
      { id: "q5_3", text: "Le chiffre d'affaires déclaré est-il cohérent avec l'effectif et la nature de l'activité ?" },
      { id: "q5_4", text: "L'activité génère-t-elle des flux transfrontaliers importants sans justification économique claire ?" },
      { id: "q5_5", text: "L'activité présente-t-elle des variations de CA difficiles à expliquer ?" },
    ],
  },
  {
    id: "s6", num: 6, title: "PPE et sanctions",
    questions: [
      { id: "q6_1", text: "Le client exerce-t-il ou a-t-il exercé des fonctions publiques importantes ?" },
      { id: "q6_2", text: "Un membre de sa famille proche ou un associé est-il une PPE ?" },
      { id: "q6_3", text: "Une autorisation hiérarchique a-t-elle été obtenue (si PPE) ?", hasNA: true },
      { id: "q6_4", text: "Vérifié contre la liste de gel des avoirs (Direction du Trésor) ?" },
      { id: "q6_5", text: "Vérifié contre les listes de sanctions européennes, OFAC et ONU ?" },
      { id: "q6_6", text: "Les bénéficiaires effectifs ont-ils également été screenés ?" },
      { id: "q6_7", text: "Le résultat global du screening est-il négatif (aucune correspondance) ?" },
    ],
  },
  {
    id: "s7", num: 7, title: "Structure de détention / UBO",
    questions: [
      { id: "q7_1", text: "Tous les bénéficiaires effectifs détenant >25% ont-ils été identifiés ?" },
      { id: "q7_2", text: "Leur pièce d'identité a-t-elle été collectée ?" },
      { id: "q7_3", text: "La chaîne de détention est-elle simple et transparente (moins de 3 niveaux de holding) ?" },
      { id: "q7_4", text: "Existe-t-il des filiales ou participations dans des paradis fiscaux ou pays à risque ?" },
      { id: "q7_5", text: "Des actions au porteur, trusts ou structures fiduciaires sont-ils impliqués ?" },
      { id: "q7_6", text: "Des entités anonymes (fondations, fonds) figurent-elles dans la chaîne de propriété ?" },
    ],
  },
  {
    id: "s8", num: 8, title: "Mode de fonctionnement bancaire",
    questions: [
      { id: "q8_1", text: "Le client dispose-t-il d'un compte bancaire dans un établissement identifié en France ou dans l'UE ?" },
      { id: "q8_2", text: "Le compte est-il domicilié dans un pays à risque ou non coopératif ?" },
      { id: "q8_3", text: "Des mouvements inhabituels ont-ils été détectés ?" },
      { id: "q8_4", text: "Des opérations avec des pays sous embargo ou des entités sanctionnées sont-elles connues ?" },
    ],
  },
  {
    id: "s9", num: 9, title: "Cohérence et vigilance",
    questions: [
      { id: "q9_1", text: "Les informations fournies sont-elles cohérentes entre elles (pas de contradictions) ?" },
      { id: "q9_2", text: "Y a-t-il une urgence inhabituelle ou une pression temporelle anormale ?" },
      { id: "q9_3", text: "Le client a-t-il manifesté des réticences à fournir les documents demandés ?" },
      { id: "q9_4", text: "Des articles de presse négatifs ou des procédures pénales concernent-ils le client ?" },
      { id: "q9_5", text: "Le client a-t-il été refusé ou résilié par un précédent cabinet d'expertise comptable ?" },
      { id: "q9_6", text: "Des procédures collectives (redressement, liquidation) sont-elles en cours ?" },
      { id: "q9_7", text: "Des dettes fiscales ou sociales significatives et non contestées sont-elles connues ?" },
    ],
  },
];

function RadioGroup({ qid, value, onChange, hasNA = false }: {
  qid: string; value: Reponse; onChange: (id: string, val: Reponse) => void; hasNA?: boolean;
}) {
  const options = [
    { val: "oui" as Reponse, label: "Oui" },
    { val: "non" as Reponse, label: "Non" },
    ...(hasNA ? [{ val: "sans_objet" as Reponse, label: "Sans objet" }] : []),
  ];
  return (
    <div className="flex items-center gap-4 mt-1.5">
      {options.map(({ val, label }) => (
        <label key={val} className="flex items-center gap-1.5 cursor-pointer group">
          <div
            onClick={() => onChange(qid, value === val ? null : val)}
            className={`size-4 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all
              ${value === val ? "border-slate-800 bg-slate-800" : "border-slate-400 bg-white group-hover:border-slate-600"}`}
          >
            {value === val && <div className="size-1.5 rounded-full bg-white" />}
          </div>
          <span className="text-sm text-slate-700">{label}</span>
        </label>
      ))}
    </div>
  );
}

function SectionPanel({ section, reponses, onChange, isOpen, onToggle }: {
  section: Section; reponses: Reponses;
  onChange: (id: string, val: Reponse) => void;
  isOpen: boolean; onToggle: () => void;
}) {
  const answered = section.questions.filter((q) => reponses[q.id] != null).length;
  const total = section.questions.length;
  const complete = answered === total;

  return (
    <div className="rounded-xl border bg-white overflow-hidden border-slate-200">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        <span className="text-sm font-medium text-slate-800">
          {section.num}. {section.title}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {complete && <span className="text-xs text-emerald-600 font-semibold">✓</span>}
          {answered > 0 && !complete && (
            <span className="text-xs text-amber-600 font-medium">{answered}/{total}</span>
          )}
          {isOpen
            ? <IconChevronDown className="size-4 text-slate-400" />
            : <IconChevronRight className="size-4 text-slate-400" />
          }
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-5">
          {section.questions.map((q, i) => (
            <div key={q.id}>
              <p className="text-sm text-slate-800">
                Question {section.num}.{i + 1} — {q.text}
              </p>
              <RadioGroup
                qid={q.id}
                value={(reponses[q.id] as Reponse) ?? null}
                onChange={onChange}
                hasNA={q.hasNA}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function QuestionnairePage() {
  const { id } = useParams<{ id: string }>();
  const [reponses, setReponses] = useState<Reponses>({});
  const [openSection, setOpenSection] = useState<string | null>("s1");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const totalQuestions = SECTIONS.reduce((acc, s) => acc + s.questions.length, 0);
  const answeredCount = SECTIONS.reduce(
    (acc, s) => acc + s.questions.filter((q) => reponses[q.id] != null).length, 0
  );
  const progressPct = Math.round((answeredCount / totalQuestions) * 100);

  function handleChange(qid: string, val: Reponse | string) {
    setReponses((prev) => ({ ...prev, [qid]: val as Reponse }));
  }

  async function handleSave() {
    setSaving(true);
    // TODO: brancher POST /api/questionnaires quand backend prêt
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleAnnuler() {
    if (confirm("Abandonner les modifications ?")) setReponses({});
  }

  return (
    <div className="min-h-full bg-slate-50">

      {/* Header */}
      <div className="bg-white border-b px-5 py-4 md:px-8 sticky top-0 md:top-0 z-10">
        <div className="flex items-center gap-3 mb-2">
          <Link href={`/dashboard/prospects/${id}`} className="text-slate-400 hover:text-slate-600 transition-colors">
            <IconArrowLeft className="size-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-slate-900">Questionnaire d&apos;acceptation (LAB)</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              9 sections — {totalQuestions} questions au total (+ questions conditionnelles PPE / PM-PP)
            </p>
          </div>
        </div>

        {/* Barre de progression */}
        {answeredCount > 0 && (
          <div className="ml-8">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-slate-500">{answeredCount}/{totalQuestions} questions</p>
              <p className="text-xs font-semibold text-slate-600">{progressPct}%</p>
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

      {saved && (
        <div className="mx-4 mt-4 md:mx-8 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">
          ✓ Brouillon enregistré
        </div>
      )}

      {/* Sections — 1 colonne mobile, 2 colonnes desktop */}
      <div className="max-w-5xl mx-auto px-4 py-4 md:px-8 md:py-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SECTIONS.map((section) => (
            <SectionPanel
              key={section.id}
              section={section}
              reponses={reponses}
              onChange={(id, val) => handleChange(id, val as Reponse)}
              isOpen={openSection === section.id}
              onToggle={() => setOpenSection((prev) => prev === section.id ? null : section.id)}
            />
          ))}
        </div>

        {/* Section 10 — Décision finale */}
        <div className="rounded-xl border border-red-200 bg-red-50 overflow-hidden">
          <div className="px-5 py-4 space-y-5">
            <p className="text-xs font-bold uppercase tracking-widest text-red-600">
              Section 10 — Décision finale (débloquée après sections 1-9)
            </p>

            {/* Éléments bloquants */}
            <div>
              <p className="text-sm text-slate-700 mb-2">Éléments bloquants irréductibles ?</p>
              <div className="flex items-center gap-6">
                {(["oui", "non"] as Reponse[]).map((val) => (
                  <label key={val} className="flex items-center gap-1.5 cursor-pointer group">
                    <div
                      onClick={() => handleChange("s10_bloquants", reponses["s10_bloquants"] === val ? null : val)}
                      className={`size-4 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all
                        ${reponses["s10_bloquants"] === val ? "border-slate-800 bg-slate-800" : "border-slate-400 bg-white group-hover:border-slate-600"}`}
                    >
                      {reponses["s10_bloquants"] === val && <div className="size-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm text-slate-700 capitalize">{val === "oui" ? "Oui" : "Non"}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Niveau diligences */}
            <div>
              <p className="text-sm text-slate-700 mb-2">Niveau de diligences</p>
              <select
                value={(reponses["s10_diligences"] as string) ?? "standard"}
                onChange={(e) => handleChange("s10_diligences", e.target.value)}
                className="w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="standard">Standard</option>
                <option value="renforcees">Renforcées</option>
                <option value="renforcees_validation">Renforcées + validation hiérarchique</option>
              </select>
            </div>

            {/* Commentaire */}
            <div>
              <p className="text-sm text-slate-700 mb-2">Commentaire libre</p>
              <textarea
                value={(reponses["s10_commentaire"] as string) ?? ""}
                onChange={(e) => handleChange("s10_commentaire", e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
              />
            </div>

            {/* Décision */}
            <div>
              <p className="text-sm text-slate-700 mb-2">Décision</p>
              <div className="flex items-center gap-6 flex-wrap">
                {[
                  { val: "accepter", label: "Accepter" },
                  { val: "refuser",  label: "Refuser" },
                  { val: "attente",  label: "Mettre En Attente" },
                ].map(({ val, label }) => (
                  <label key={val} className="flex items-center gap-1.5 cursor-pointer group">
                    <div
                      onClick={() => handleChange("s10_decision", reponses["s10_decision"] === val ? null : val)}
                      className={`size-4 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all
                        ${reponses["s10_decision"] === val ? "border-violet-600 bg-violet-600" : "border-slate-400 bg-white group-hover:border-slate-600"}`}
                    >
                      {reponses["s10_decision"] === val && <div className="size-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm text-slate-700 font-medium">{label}</span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-amber-600">
                ⚠️ Si risque ÉLEVÉ : contresignature de l&apos;expert-comptable requise
              </p>
            </div>

            {/* Boutons */}
            <div className="flex items-center gap-3 pt-1">
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold"
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </Button>
              <Button type="button" variant="outline" onClick={handleAnnuler} className="rounded-lg border-slate-200">
                Annuler
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}