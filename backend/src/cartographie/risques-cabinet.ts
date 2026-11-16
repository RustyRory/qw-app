// Cartographie des risques du cabinet (matrice probabilité × impact, 1 à 4
// chacun ; score = produit). Les dossiers sont rattachés automatiquement à
// chaque risque à partir du questionnaire LAB, du questionnaire
// d'acceptation et des données du dossier.

export type NiveauCartographie = 'FAIBLE' | 'MODERE' | 'ELEVE';

export function niveauCartographie(score: number): NiveauCartographie {
  if (score >= 9) return 'ELEVE';
  if (score >= 5) return 'MODERE';
  return 'FAIBLE';
}

// Données d'un dossier utiles au rattachement.
export interface DossierRisques {
  reponsesLab: Record<string, unknown>;
  reponsesAcceptation: Record<string, { reponse?: string | null }>;
  ppe: boolean;
  formeJuridique: string | null;
  codeNaf: string | null;
  dateCreationEntreprise: Date | null;
  typesMission: string[];
}

const oui = (r: Record<string, unknown>, ids: string[]) =>
  ids.some((id) => r[id] === 'oui');
// Question « seuil » : toute réponse autre que « non » (risque moyen/élevé).
const seuil = (r: Record<string, unknown>, ids: string[]) =>
  ids.some((id) => r[id] === 'risque_moyen' || r[id] === 'risque_eleve');

export interface RisqueCabinet {
  numero: number;
  libelle: string;
  probabilite: 1 | 2 | 3 | 4;
  impact: 1 | 2 | 3 | 4;
  // Vigilance renforcée imposée par la loi, quel que soit le score.
  vigilanceRenforcee?: boolean;
  // Comment les dossiers sont rattachés (affiché dans l'application).
  regle: string;
  // null : risque propre au cabinet ou non déductible des données.
  concerne: ((d: DossierRisques) => boolean) | null;
}

const IL_Y_A_2_ANS = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 2);
  return d;
};

export const RISQUES_CABINET: RisqueCabinet[] = [
  {
    numero: 1,
    libelle: 'Activités à forte circulation d’espèces',
    probabilite: 3,
    impact: 3,
    regle:
      'Questionnaire LAB : changeur manuel ou transmission de fonds en espèces (D2_20, D2_21)',
    concerne: (d) => oui(d.reponsesLab, ['D2_20', 'D2_21']),
  },
  {
    numero: 2,
    libelle: 'Société récente / holding opaque',
    probabilite: 3,
    impact: 3,
    regle:
      'Société créée il y a moins de 2 ans, ou structure complexe déclarée au questionnaire LAB (D1_4 à D1_8)',
    concerne: (d) =>
      oui(d.reponsesLab, ['D1_4', 'D1_5', 'D1_6', 'D1_7', 'D1_8']) ||
      (!!d.dateCreationEntreprise &&
        new Date(d.dateCreationEntreprise) > IL_Y_A_2_ANS()),
  },
  {
    numero: 3,
    libelle: 'PPE ou proche de PPE',
    probabilite: 2,
    impact: 4,
    vigilanceRenforcee: true,
    regle:
      'PPE déclarée au questionnaire LAB (D1_11), sur le client ou sur un bénéficiaire effectif',
    concerne: (d) => d.ppe || oui(d.reponsesLab, ['D1_11']),
  },
  {
    numero: 4,
    libelle: 'Associations (risque de financement du terrorisme)',
    probabilite: 2,
    impact: 4,
    regle: 'Forme juridique « association » ou code NAF 94',
    concerne: (d) =>
      /association/i.test(d.formeJuridique ?? '') ||
      (d.codeNaf ?? '').replace('.', '').startsWith('94'),
  },
  {
    numero: 5,
    libelle: 'Secteurs sensibles (immobilier, crypto, art, luxe)',
    probabilite: 3,
    impact: 3,
    regle:
      'Questionnaire LAB : NFT, crypto, néo-banque, luxe (D2_13, D2_16, D2_26 à D2_28, D5_5 à D5_7) ou activité à seuil en risque (D2_2, D2_3, D2_5, D2_14, D2_15)',
    concerne: (d) =>
      oui(d.reponsesLab, [
        'D2_13',
        'D2_16',
        'D2_26',
        'D2_27',
        'D2_28',
        'D5_5',
        'D5_6',
        'D5_7',
      ]) || seuil(d.reponsesLab, ['D2_2', 'D2_3', 'D2_5', 'D2_14', 'D2_15']),
  },
  {
    numero: 6,
    libelle: 'Constitution de sociétés, domiciliation',
    probabilite: 3,
    impact: 3,
    regle:
      'Questionnaire LAB : création ou reprise d’entreprise (D4_1), société créée hors UE (D5_3) ; ou activité de domiciliation (NAF 82.11Z)',
    concerne: (d) =>
      seuil(d.reponsesLab, ['D4_1']) ||
      oui(d.reponsesLab, ['D5_3']) ||
      (d.codeNaf ?? '').replace('.', '').toUpperCase() === '8211Z',
  },
  {
    numero: 7,
    libelle: 'Opérations exceptionnelles (cession, apport)',
    probabilite: 2,
    impact: 4,
    regle:
      'Questionnaire LAB : prise de participation, restructuration, transmission transnationale, cession viticole (D4_2, D4_3, D4_4, D5_8)',
    concerne: (d) =>
      seuil(d.reponsesLab, ['D4_2', 'D4_3']) ||
      oui(d.reponsesLab, ['D4_4', 'D5_8']),
  },
  {
    numero: 8,
    libelle: 'Tenue comptable seule',
    probabilite: 2,
    impact: 2,
    regle: 'Toutes les missions du dossier sont de la tenue comptable',
    concerne: (d) =>
      d.typesMission.length > 0 &&
      d.typesMission.every((t) => t === 'TENUE_COMPTABLE'),
  },
  {
    numero: 9,
    libelle: 'Flux avec des pays à haut risque',
    probabilite: 2,
    impact: 4,
    vigilanceRenforcee: true,
    regle: 'Questionnaire LAB : pays GAFI / UE à haut risque (D3_1_1 à D3_1_3)',
    concerne: (d) => oui(d.reponsesLab, ['D3_1_1', 'D3_1_2', 'D3_1_3']),
  },
  {
    numero: 10,
    libelle: 'Paradis fiscaux, pays non coopératifs',
    probabilite: 2,
    impact: 3,
    regle: 'Questionnaire LAB : liste noire UE / France (D3_2_1 à D3_2_3)',
    concerne: (d) => oui(d.reponsesLab, ['D3_2_1', 'D3_2_2', 'D3_2_3']),
  },
  {
    numero: 11,
    libelle: 'Client non rencontré',
    probabilite: 3,
    impact: 2,
    regle:
      'Questionnaire d’acceptation : client non rencontré par l’expert-comptable',
    concerne: (d) => d.reponsesAcceptation['rencontre']?.reponse === 'non',
  },
  {
    numero: 12,
    libelle: 'Apporteur d’affaires inconnu',
    probabilite: 2,
    impact: 2,
    regle:
      'Information non saisie dans l’application : à évaluer au cas par cas',
    concerne: null,
  },
  {
    numero: 13,
    libelle: 'Formation interne insuffisante',
    probabilite: 2,
    impact: 3,
    regle: 'Risque propre au cabinet (organisation), sans dossier associé',
    concerne: null,
  },
];
