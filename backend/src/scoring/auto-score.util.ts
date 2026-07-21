import { NiveauRisque, ScreeningStatut, TypeEntite } from '../common/enums';

export interface AutoScoreCritere {
  code: string;
  label: string;
  poids: number;
  declenche: boolean;
}

export interface AutoScoreReponses {
  criteres: AutoScoreCritere[];
}

// Les 8 critères binaires de la grille officielle (le 9e, le chiffre d'affaires,
// est numérique et géré séparément). Abstrait de la source des données : un
// prospect les déduit des réponses de son questionnaire d'acceptation, un
// client de ses données réelles (ppe, screening, bénéficiaires effectifs) et,
// pour les critères sans équivalent direct côté client, du questionnaire du
// prospect dont il est issu, s'il existe.
export interface RiskFlags {
  ppe: boolean;
  paysRisqueGafi: boolean;
  secteurSensible: boolean;
  especes: boolean;
  structureComplexe: boolean;
  paysTiers: boolean;
  uboEtranger: boolean;
  alertesNationales: boolean;
}

export interface AutoScoreInput {
  flags: RiskFlags;
  chiffreAffaires: number | null;
}

export function computeNiveauAuto(score: number): NiveauRisque {
  if (score <= 33) return NiveauRisque.FAIBLE;
  if (score <= 66) return NiveauRisque.MOYEN;
  return NiveauRisque.ELEVE;
}

const estOui = (v: unknown) => v === 'oui';
const estRisqueEleve = (v: unknown) => v === 'risque_eleve';

function uneDe(
  reponses: Record<string, unknown>,
  ids: string[],
  test: (v: unknown) => boolean = estOui,
): boolean {
  return ids.some((id) => test(reponses[id]));
}

// Variantes courantes pour désigner la France dans un champ libre "nationalité".
const VARIANTES_FRANCE = ['france', 'française', 'francais', 'fr'];

function estFrancais(nationalite: string | null | undefined): boolean {
  if (!nationalite) return true; // valeur absente : pas d'indice d'extranéité
  return VARIANTES_FRANCE.includes(nationalite.trim().toLowerCase());
}

// Déduit les 8 critères binaires des réponses du questionnaire d'acceptation
// (D1-D5) d'un prospect — pondération officielle du cahier des charges
// (docs/mvp/cahier-des-charges.md, Module 4) mappée sur les questions existantes.
export function flagsFromQuestionnaire(
  reponses: Record<string, unknown>,
  typeEntite: TypeEntite,
): RiskFlags {
  return {
    ppe: estOui(reponses['D1_11']),
    paysRisqueGafi: uneDe(reponses, ['D3_1_1', 'D3_1_2', 'D3_1_3']),
    secteurSensible:
      uneDe(reponses, ['D2_13', 'D2_26', 'D2_27']) ||
      estRisqueEleve(reponses['D2_2']) ||
      estRisqueEleve(reponses['D2_3']) ||
      estRisqueEleve(reponses['D2_5']),
    especes: uneDe(reponses, ['D2_20', 'D2_21']),
    structureComplexe: uneDe(reponses, [
      'D1_4',
      'D1_5',
      'D1_6',
      'D1_7',
      'D1_8',
    ]),
    paysTiers: uneDe(reponses, [
      'D3_2_1',
      'D3_2_2',
      'D3_2_3',
      'D3_3_1',
      'D3_3_2',
      'D3_3_3',
      'D3_3_4',
      'D3_3_5',
      'D3_3_6',
    ]),
    uboEtranger:
      typeEntite === TypeEntite.PERSONNE_MORALE &&
      uneDe(reponses, ['D3_1_2', 'D3_2_2']),
    // Aucune donnée de screening n'existe sur un prospect (réservée aux clients).
    alertesNationales: false,
  };
}

export interface ClientFlagsInput {
  ppe: boolean;
  typeEntite: TypeEntite;
  screeningStatut: ScreeningStatut;
  beneficiaires: Array<{ nationalite: string | null }>;
  // Réponses du questionnaire d'acceptation du prospect d'origine, si connu :
  // comble les critères sans équivalent direct dans les données client
  // (pays à risque, secteur sensible, espèces, structure complexe, pays tiers).
  questionnaireReponses?: Record<string, unknown> | null;
}

export function flagsFromClient(input: ClientFlagsInput): RiskFlags {
  const origine = input.questionnaireReponses
    ? flagsFromQuestionnaire(input.questionnaireReponses, input.typeEntite)
    : null;

  return {
    ppe: input.ppe,
    paysRisqueGafi: origine?.paysRisqueGafi ?? false,
    secteurSensible: origine?.secteurSensible ?? false,
    especes: origine?.especes ?? false,
    structureComplexe: origine?.structureComplexe ?? false,
    paysTiers: origine?.paysTiers ?? false,
    uboEtranger:
      input.typeEntite === TypeEntite.PERSONNE_MORALE &&
      input.beneficiaires.some((b) => !estFrancais(b.nationalite)),
    alertesNationales: input.screeningStatut === ScreeningStatut.ALERTE,
  };
}

// Pondération officielle du "Module 4 — Évaluation et cartographie des risques"
// (docs/mvp/cahier-des-charges.md : 9 critères, 100 points). Les 9 poids
// totalisent en réalité 155 pts, pas 100 — incohérence de la grille source
// elle-même — le score est donc normalisé en pourcentage du total.
export function computeAutoScore(input: AutoScoreInput): {
  score: number;
  niveau: NiveauRisque;
  reponses: AutoScoreReponses;
} {
  const { flags, chiffreAffaires } = input;

  const criteres: AutoScoreCritere[] = [
    {
      code: 'ppe',
      label: 'PPE (personne politiquement exposée)',
      poids: 30,
      declenche: flags.ppe,
    },
    {
      code: 'pays_gafi',
      label: 'Pays à risque (liste GAFI / UE à haut risque)',
      poids: 25,
      declenche: flags.paysRisqueGafi,
    },
    {
      code: 'secteur_sensible',
      label: 'Secteur sensible (crypto-actifs, jeux, immobilier)',
      poids: 20,
      declenche: flags.secteurSensible,
    },
    {
      code: 'chiffre_affaires',
      label: "Chiffre d'affaires annuel supérieur à 500 k€",
      poids: 10,
      declenche: (chiffreAffaires ?? 0) > 500_000,
    },
    {
      code: 'especes',
      label: 'Activité liée aux espèces (change, transmission de fonds)',
      poids: 15,
      declenche: flags.especes,
    },
    {
      code: 'structure_complexe',
      label: 'Structure de propriété complexe ou opaque',
      poids: 15,
      declenche: flags.structureComplexe,
    },
    {
      code: 'pays_tiers',
      label: 'Liens avec des pays tiers à risque (fiscal ou sanctions)',
      poids: 10,
      declenche: flags.paysTiers,
    },
    {
      code: 'ubo_etranger',
      label:
        'Personne morale avec un établissement ou bénéficiaire lié à l’étranger',
      poids: 10,
      declenche: flags.uboEtranger,
    },
    {
      code: 'alertes_nationales',
      label: 'Alertes des sources nationales (LIMPI)',
      poids: 20,
      declenche: flags.alertesNationales,
    },
  ];

  const poidsTotal = criteres.reduce((sum, c) => sum + c.poids, 0);
  const brut = criteres.reduce(
    (sum, c) => sum + (c.declenche ? c.poids : 0),
    0,
  );
  const score = Math.round((brut / poidsTotal) * 100);

  return { score, niveau: computeNiveauAuto(score), reponses: { criteres } };
}
