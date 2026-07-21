"use client";

import { useCallback, useEffect, useState } from "react";
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

type Reponses = Record<string, string>;
type QuestionKind = "oui_non" | "seuil" | "pct";

type Question = {
  id: string;
  text: string;
  kind: QuestionKind;
  seuilRM?: string;
  seuilRE?: string;
};

type QuestionGroup = { label?: string; questions: Question[] };
type QModule = {
  id: string;
  num: number;
  title: string;
  groups: QuestionGroup[];
};

const PCT_OPTIONS = [
  { value: "0", label: "0 %" },
  { value: "lt5", label: "Moins de 5 %" },
  { value: "5-10", label: "De 5 à 10 %" },
  { value: "11-20", label: "De 11 à 20 %" },
  { value: "gt20", label: "Plus de 20 %" },
];

const MODULES: QModule[] = [
  {
    id: "d1",
    num: 1,
    title: "Caractéristiques des clients",
    groups: [
      {
        questions: [
          {
            id: "D1_1",
            kind: "oui_non",
            text: "Association culturelle, cultuelle ou à vocation humanitaire recevant des fonds de l'étranger ou versant des fonds vers l'étranger ?",
          },
          {
            id: "D1_2",
            kind: "oui_non",
            text: "Association dirigée par un élu ou un membre de sa famille et recevant des subventions publiques pour un montant annuel supérieur à 25 k€ de la collectivité dont il est élu ?",
          },
          { id: "D1_3", kind: "oui_non", text: "Parti politique ?" },
          {
            id: "D1_4",
            kind: "oui_non",
            text: "Société membre d'un groupe utilisant une superposition d'entités juridiques étrangères qui complexifie l'identification de l'origine des fonds ou du bénéficiaire effectif ?",
          },
          {
            id: "D1_5",
            kind: "oui_non",
            text: "Fiducie ou société membre d'un groupe où l'on constate la présence d'une fiducie ou d'un trust ?",
          },
          {
            id: "D1_6",
            kind: "oui_non",
            text: "Société ayant recours à des montages fiscaux complexes, transnationaux ou non, mis en place par la structure d'exercice professionnel ou non, que cette dernière ait fait une déclaration DAC6 ou non ?",
          },
          {
            id: "D1_7",
            kind: "oui_non",
            text: "Société contrôlée par une personne physique qui contrôle par ailleurs d'autres sociétés (hors SCI) dont votre structure d'exercice professionnel n'est pas l'expert-comptable, qui n'ont pas de lien juridique avec la première, mais qui entretiennent avec elle des liens économiques ?",
          },
          {
            id: "D1_8",
            kind: "oui_non",
            text: "Société à prépondérance immobilière détenue via une cascade de véhicules étrangers non régulés ou via un fonds d'investissement alternatif (au sens de la directive AIFM) ?",
          },
          {
            id: "D1_9",
            kind: "oui_non",
            text: "Société ou personne physique détenant un/des biens immobiliers de prestige ou de luxe, notamment situés dans des emplacements connus pour être des zones où se concentrent les biens immobiliers de prestige ou de luxe (valeur vénale unitaire supérieure à 3 millions d'euros, hors immobilier professionnel) ?",
          },
          {
            id: "D1_10",
            kind: "oui_non",
            text: "Société ayant son siège social dans une société de domiciliation autre que la structure d'exercice professionnel de l'expert-comptable ?",
          },
          {
            id: "D1_11",
            kind: "oui_non",
            text: "Client, représentant légal ou bénéficiaire effectif ayant le statut de PPE (personne politiquement exposée) en France ou à l'étranger ?",
          },
        ],
      },
    ],
  },
  {
    id: "d2",
    num: 2,
    title: "Activités et secteurs",
    groups: [
      {
        questions: [
          {
            id: "D2_1",
            kind: "seuil",
            text: "Entreprise du bâtiment ou des travaux publics",
            seuilRM: "CA HT entre 400 et 1 000 k€",
            seuilRE: "CA HT supérieur à 1 000 k€",
          },
          {
            id: "D2_2",
            kind: "seuil",
            text: "Marchand de biens immobiliers",
            seuilRM: "Opérations entre 400 et 1 000 k€ HT",
            seuilRE: "Opérations supérieures à 1 000 k€ HT",
          },
          {
            id: "D2_3",
            kind: "seuil",
            text: "Promotion immobilière",
            seuilRM: "Opérations entre 400 et 1 000 k€ HT",
            seuilRE: "Opérations supérieures à 1 000 k€ HT",
          },
          {
            id: "D2_4",
            kind: "seuil",
            text: "Vente de véhicules d'occasion",
            seuilRM: "Marge de l'activité entre 25 et 50 % de la marge totale",
            seuilRE: "Marge de l'activité supérieure à 50 % de la marge totale",
          },
          {
            id: "D2_5",
            kind: "seuil",
            text: "Point de vente de la Française des jeux ou du PMU",
            seuilRM: "Commissions « jeux » inférieures à 75 k€ HT",
            seuilRE: "Commissions « jeux » supérieures à 75 k€ HT",
          },
          {
            id: "D2_6",
            kind: "seuil",
            text: "Buraliste (hors point de vente FDJ ou PMU)",
            seuilRM: "Commissions « tabac » inférieures à 75 k€ HT",
            seuilRE: "Commissions « tabac » supérieures à 75 k€ HT",
          },
          {
            id: "D2_7",
            kind: "seuil",
            text: "Casse automobile ou ferrailleur",
            seuilRM: "CA HT inférieur à 200 k€",
            seuilRE: "CA HT supérieur à 200 k€",
          },
          {
            id: "D2_8",
            kind: "seuil",
            text: "Établissement de nuit (discothèque, bar…)",
            seuilRM: "CA HT inférieur à 400 k€",
            seuilRE: "CA HT supérieur à 400 k€",
          },
          {
            id: "D2_9",
            kind: "seuil",
            text: "Restauration rapide hors chaînes nationales",
            seuilRM: "CA HT inférieur à 200 k€",
            seuilRE: "CA HT supérieur à 200 k€",
          },
          {
            id: "D2_10",
            kind: "seuil",
            text: "Hôtel, café, restaurant (hors établissements de nuit, restauration rapide, FDJ/PMU, buralistes)",
            seuilRM: "CA HT entre 400 et 1 000 k€",
            seuilRE: "CA HT supérieur à 1 000 k€",
          },
          {
            id: "D2_11",
            kind: "seuil",
            text: "Barber shop, nail bar (onglerie), salon de massage et tout commerce de cette nature",
            seuilRM: "CA HT inférieur à 200 k€",
            seuilRE: "CA HT supérieur à 200 k€",
          },
          {
            id: "D2_12",
            kind: "seuil",
            text: "Antiquaire, brocanteur ou galerie d'art",
            seuilRM: "CA HT inférieur à 200 k€",
            seuilRE: "CA HT supérieur à 200 k€",
          },
          {
            id: "D2_13",
            kind: "oui_non",
            text: "Commerce de jetons non fongibles (NFT) ?",
          },
          {
            id: "D2_14",
            kind: "seuil",
            text: "Bijoutier ou commerce de métaux précieux ou de pierres précieuses",
            seuilRM: "CA HT entre 400 et 1 000 k€",
            seuilRE: "CA HT supérieur à 1 000 k€",
          },
          {
            id: "D2_15",
            kind: "seuil",
            text: "Commerce d'objets de luxe (montres, sacs…)",
            seuilRM: "CA HT entre 400 et 1 000 k€",
            seuilRE: "CA HT supérieur à 1 000 k€",
          },
          {
            id: "D2_16",
            kind: "oui_non",
            text: "Commerce et location de voiture de luxe ou de bateau ?",
          },
          {
            id: "D2_17",
            kind: "seuil",
            text: "Pharmacie",
            seuilRM: "CA HT entre 1 500 et 4 000 k€",
            seuilRE: "CA HT supérieur à 4 000 k€",
          },
          {
            id: "D2_18",
            kind: "seuil",
            text: "Autres commerces de proximité ou commerces de détail sur les marchés",
            seuilRM: "CA HT entre 400 et 1 000 k€",
            seuilRE: "CA HT supérieur à 1 000 k€",
          },
          {
            id: "D2_19",
            kind: "seuil",
            text: "Entreprise exerçant une activité de e-commerce vers l'étranger ou encaissant ses créances à l'étranger (activité autre que celles listées ci-dessus)",
            seuilRM: "CA HT inférieur à 200 k€",
            seuilRE: "CA HT supérieur à 200 k€",
          },
          { id: "D2_20", kind: "oui_non", text: "Changeur manuel ?" },
          {
            id: "D2_21",
            kind: "oui_non",
            text: "Prestataire de transmission de fonds en espèces de ou vers l'étranger (prestataire de services de paiement, pas un client effectuant des paiements pour son activité) ?",
          },
          {
            id: "D2_22",
            kind: "oui_non",
            text: "Prestations réalisées au profit ou sur des yachts ?",
          },
          {
            id: "D2_23",
            kind: "oui_non",
            text: "Entreprise participant à des transferts dans le sport professionnel ?",
          },
          {
            id: "D2_24",
            kind: "seuil",
            text: "Activité d'import/export ou de négoce international de matières premières",
            seuilRM: "CA HT inférieur à 1 000 k€",
            seuilRE: "CA HT supérieur à 1 000 k€",
          },
          {
            id: "D2_25",
            kind: "seuil",
            text: "Service aux entreprises : gardiennage, sécurité, nettoyage",
            seuilRM: "CA HT inférieur à 400 k€",
            seuilRE: "CA HT supérieur à 400 k€",
          },
          {
            id: "D2_26",
            kind: "oui_non",
            text: "Prestataire de services sur actifs numériques (plateforme crypto, service de conservation, échange…) sans agrément européen CASP/MiCA ?",
          },
          {
            id: "D2_27",
            kind: "oui_non",
            text: "Mixeur/mélangeur de cryptoactifs ?",
          },
          {
            id: "D2_28",
            kind: "oui_non",
            text: "Néo-banque (banque dont les services sont accessibles principalement en ligne) ?",
          },
        ],
      },
    ],
  },
  {
    id: "d3",
    num: 3,
    title: "Exposition aux risques / Localisation",
    groups: [
      {
        label: "Pays GAFI / listés à haut risque par l'UE",
        questions: [
          {
            id: "D3_1_1",
            kind: "oui_non",
            text: "Client, représentant légal ou bénéficiaire effectif domicilié dans un des pays listés (GAFI / UE à haut risque) ?",
          },
          {
            id: "D3_1_2",
            kind: "oui_non",
            text: "Établissement, filiale ou société-mère du client localisé dans un des pays listés ?",
          },
          {
            id: "D3_1_3",
            kind: "oui_non",
            text: "Transferts de fonds depuis ou vers un des pays listés pour des montants annuels supérieurs à 50 k€ ?",
          },
        ],
      },
      {
        label: "Pays non coopératifs en matière fiscale",
        questions: [
          {
            id: "D3_2_1",
            kind: "oui_non",
            text: "Client, représentant légal ou bénéficiaire effectif domicilié dans un des pays listés (liste noire UE / France) ?",
          },
          {
            id: "D3_2_2",
            kind: "oui_non",
            text: "Établissement, filiale ou société-mère du client localisé dans un des pays listés ?",
          },
          {
            id: "D3_2_3",
            kind: "oui_non",
            text: "Transferts de fonds depuis ou vers un des pays listés pour des montants annuels supérieurs à 50 k€ ?",
          },
        ],
      },
      {
        label: "Sanctions financières ciblées",
        questions: [
          {
            id: "D3_3_1",
            kind: "oui_non",
            text: "Services rendus à des entités ou personnes physiques figurant sur la liste de gel des avoirs, hormis accord spécifique de la Direction Générale du Trésor ?",
          },
          {
            id: "D3_3_2",
            kind: "oui_non",
            text: "Missions de comptabilité, contrôle des comptes, conseil fiscal, conseil en gestion ou domiciliation exécutées depuis le 5 juillet 2022 au profit de personnes morales établies en Russie (ou leurs succursales en France), sauf détention par des entités UE ?",
          },
          {
            id: "D3_3_3",
            kind: "oui_non",
            text: "Transferts de fonds identifiés à destination/provenance d'une entité ou personne figurant sur la liste de gel des avoirs liée à la Russie/Biélorussie/Ukraine ?",
          },
          {
            id: "D3_3_4",
            kind: "oui_non",
            text: "Transferts de fonds identifiés à destination/provenance de Russie/Biélorussie/Ukraine ?",
          },
          {
            id: "D3_3_5",
            kind: "oui_non",
            text: "Transactions identifiées effectuées via une banque russe, biélorusse ou ukrainienne ?",
          },
          {
            id: "D3_3_6",
            kind: "oui_non",
            text: "Activité du client liée directement ou indirectement à la Russie, la Biélorussie ou l'Ukraine, figurant sur la liste des secteurs soumis à sanctions (Règlement UE 833/2014) ?",
          },
        ],
      },
      {
        label: "Outre-mer",
        questions: [
          {
            id: "D3_4",
            kind: "oui_non",
            text: "Le client a-t-il une activité économique significative dans un DROM ?",
          },
        ],
      },
    ],
  },
  {
    id: "d4",
    num: 4,
    title: "Nature de la mission",
    groups: [
      {
        questions: [
          {
            id: "D4_1",
            kind: "seuil",
            text: "Accompagnement à la création ou à la reprise d'entreprise, financée directement ou indirectement par un bénéficiaire effectif au moyen d'apports personnels de fonds",
            seuilRM: "Montant entre 30 et 100 k€",
            seuilRE: "Montant supérieur à 100 k€",
          },
          {
            id: "D4_2",
            kind: "seuil",
            text: "Accompagnement dans une prise de participation (autre que reprise d'entreprise) financée directement ou indirectement par un investisseur personne physique au moyen d'apports personnels de fonds",
            seuilRM: "Montant entre 100 et 250 k€",
            seuilRE: "Montant supérieur à 250 k€",
          },
          {
            id: "D4_3",
            kind: "seuil",
            text: "Accompagnement dans des opérations de restructurations juridiques et/ou financières nécessitant l'injection directe ou indirecte de fonds personnels par un investisseur personne physique, bénéficiaire effectif ou non",
            seuilRM: "Montant entre 100 et 250 k€",
            seuilRE: "Montant supérieur à 250 k€",
          },
          {
            id: "D4_4",
            kind: "oui_non",
            text: "Accompagnement d'une transmission universelle de patrimoine transnationale (autre que dans les cas susvisés) ?",
          },
          {
            id: "D4_5",
            kind: "oui_non",
            text: "Paiement des dettes fournisseurs ?",
          },
          {
            id: "D4_6",
            kind: "oui_non",
            text: "Recouvrement amiable des créances ?",
          },
          {
            id: "D4_7",
            kind: "seuil",
            text: "Comptes de campagne ayant donné lieu à un financement public",
            seuilRM: "Montant entre 5 et 20 k€",
            seuilRE: "Montant supérieur à 20 k€",
          },
          {
            id: "D4_8",
            kind: "pct",
            text: "Pourcentage des honoraires facturés au titre des missions de conseil ou montage fiscaux, de conseil en gestion de patrimoine et de conseil en recherche de financement ou de trésorerie",
          },
        ],
      },
    ],
  },
  {
    id: "d5",
    num: 5,
    title: "Opérations particulières",
    groups: [
      {
        questions: [
          {
            id: "D5_1",
            kind: "oui_non",
            text: "Prêts accordés par des non-associés n'ayant pas la qualité d'établissement financier, y compris les prêts familiaux ayant ou devant faire l'objet d'une déclaration n° 2062, d'un montant supérieur à 30 k€ ?",
          },
          {
            id: "D5_2",
            kind: "oui_non",
            text: "Financements obtenus à des conditions apparemment anormales ?",
          },
          {
            id: "D5_3",
            kind: "oui_non",
            text: "Société acquise ou créée domiciliée dans un pays hors UE sans justification économique ?",
          },
          {
            id: "D5_4",
            kind: "oui_non",
            text: "Financements pour des montants supérieurs à 100 k€ obtenus via des plateformes de financement participatif ?",
          },
          {
            id: "D5_5",
            kind: "oui_non",
            text: "Opérations en cryptoactifs pour un montant annuel supérieur à 50 k€ ?",
          },
          {
            id: "D5_6",
            kind: "oui_non",
            text: "Détention d'un portefeuille de cryptoactifs (wallet) auprès d'un PSAN ?",
          },
          {
            id: "D5_7",
            kind: "oui_non",
            text: "Acquisitions et cessions de NFT pour un montant annuel supérieur à 50 k€ ?",
          },
          {
            id: "D5_8",
            kind: "oui_non",
            text: "Cession de terres viticoles/châteaux/négociants en vins ou spiritueux à des sociétés ou ressortissants de pays où des fortunes importantes et récentes se sont constituées à la suite de changements de politique économique ?",
          },
        ],
      },
    ],
  },
];

const ALL_QUESTIONS = MODULES.flatMap((m) =>
  m.groups.flatMap((g) => g.questions),
);

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
  const options = [
    { val: "oui", label: "Oui" },
    { val: "non", label: "Non" },
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
  isOpen,
  onToggle,
  disabled,
  hints,
}: {
  module: QModule;
  reponses: Reponses;
  onChange: (id: string, val: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  disabled?: boolean;
  hints?: Record<string, string>;
}) {
  const questions = module.groups.flatMap((g) => g.questions);
  const answered = questions.filter((q) => !!reponses[q.id]).length;
  const total = questions.length;
  const complete = answered === total;

  return (
    <div className="rounded-xl border bg-white overflow-hidden border-slate-200">
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
          {module.groups.map((group, gi) => (
            <div key={gi} className="space-y-5">
              {group.label && (
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  {group.label}
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
        <div className="mx-4 mt-4 md:mx-8 rounded-xl bg-slate-100 border border-slate-200 p-3 text-sm text-slate-600">
          Ce questionnaire est {statutInfo.label.toLowerCase()} et n&apos;est
          plus modifiable.
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
