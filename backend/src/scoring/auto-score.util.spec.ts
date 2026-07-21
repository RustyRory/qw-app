import {
  computeAutoScore,
  computeNiveauAuto,
  flagsFromClient,
  flagsFromQuestionnaire,
  RiskFlags,
} from './auto-score.util';
import { NiveauRisque, ScreeningStatut, TypeEntite } from '../common/enums';

const AUCUN_RISQUE: RiskFlags = {
  ppe: false,
  paysRisqueGafi: false,
  secteurSensible: false,
  especes: false,
  structureComplexe: false,
  paysTiers: false,
  uboEtranger: false,
  alertesNationales: false,
};

describe('computeNiveauAuto (pure)', () => {
  it('retourne FAIBLE pour un score <= 33', () => {
    expect(computeNiveauAuto(0)).toBe(NiveauRisque.FAIBLE);
    expect(computeNiveauAuto(33)).toBe(NiveauRisque.FAIBLE);
  });

  it('retourne MOYEN pour un score entre 34 et 66', () => {
    expect(computeNiveauAuto(34)).toBe(NiveauRisque.MOYEN);
    expect(computeNiveauAuto(66)).toBe(NiveauRisque.MOYEN);
  });

  it('retourne ELEVE pour un score > 66', () => {
    expect(computeNiveauAuto(67)).toBe(NiveauRisque.ELEVE);
    expect(computeNiveauAuto(100)).toBe(NiveauRisque.ELEVE);
  });
});

describe('computeAutoScore (pure)', () => {
  it('renvoie un score nul et FAIBLE quand aucun critère n’est déclenché', () => {
    const result = computeAutoScore({
      flags: AUCUN_RISQUE,
      chiffreAffaires: null,
    });
    expect(result.score).toBe(0);
    expect(result.niveau).toBe(NiveauRisque.FAIBLE);
    expect(result.reponses.criteres.every((c) => !c.declenche)).toBe(true);
  });

  it('normalise le score sur 100 (les 9 poids officiels totalisent 155)', () => {
    const result = computeAutoScore({
      flags: { ...AUCUN_RISQUE, ppe: true },
      chiffreAffaires: null,
    });
    expect(result.score).toBe(Math.round((30 / 155) * 100));
  });

  it("déclenche le critère chiffre d'affaires au-delà de 500 k€", () => {
    expect(
      computeAutoScore({ flags: AUCUN_RISQUE, chiffreAffaires: 500_001 }).score,
    ).toBe(Math.round((10 / 155) * 100));
    expect(
      computeAutoScore({ flags: AUCUN_RISQUE, chiffreAffaires: 500_000 }).score,
    ).toBe(0);
  });

  it('cumule plusieurs critères et reste borné à 100', () => {
    const result = computeAutoScore({
      flags: {
        ppe: true,
        paysRisqueGafi: true,
        secteurSensible: true,
        especes: true,
        structureComplexe: true,
        paysTiers: true,
        uboEtranger: false,
        alertesNationales: false,
      },
      chiffreAffaires: 600_000,
    });
    // Brut : 30+25+20+15+15+10+10 = 125 sur un total possible de 155.
    expect(result.score).toBe(Math.round((125 / 155) * 100));
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.niveau).toBe(NiveauRisque.ELEVE);
  });
});

describe('flagsFromQuestionnaire (pure)', () => {
  it('déclenche le critère PPE sur D1_11 = oui', () => {
    expect(
      flagsFromQuestionnaire({ D1_11: 'oui' }, TypeEntite.PERSONNE_PHYSIQUE)
        .ppe,
    ).toBe(true);
  });

  it('déclenche le critère pays GAFI sur n’importe laquelle des 3 questions D3_1_x', () => {
    expect(
      flagsFromQuestionnaire({ D3_1_2: 'oui' }, TypeEntite.PERSONNE_PHYSIQUE)
        .paysRisqueGafi,
    ).toBe(true);
  });

  it('déclenche le secteur sensible via un seuil "risque_eleve" mais pas "risque_moyen"', () => {
    expect(
      flagsFromQuestionnaire(
        { D2_3: 'risque_eleve' },
        TypeEntite.PERSONNE_PHYSIQUE,
      ).secteurSensible,
    ).toBe(true);
    expect(
      flagsFromQuestionnaire(
        { D2_3: 'risque_moyen' },
        TypeEntite.PERSONNE_PHYSIQUE,
      ).secteurSensible,
    ).toBe(false);
  });

  it("ne déclenche l'UBO étranger que pour une personne morale", () => {
    expect(
      flagsFromQuestionnaire({ D3_1_2: 'oui' }, TypeEntite.PERSONNE_MORALE)
        .uboEtranger,
    ).toBe(true);
    expect(
      flagsFromQuestionnaire({ D3_1_2: 'oui' }, TypeEntite.PERSONNE_PHYSIQUE)
        .uboEtranger,
    ).toBe(false);
  });

  it('ne déclenche jamais les alertes nationales (pas de screening sur un prospect)', () => {
    expect(
      flagsFromQuestionnaire({}, TypeEntite.PERSONNE_MORALE).alertesNationales,
    ).toBe(false);
  });
});

describe('flagsFromClient (pure)', () => {
  it('reprend directement ppe et le statut de screening du client', () => {
    const flags = flagsFromClient({
      ppe: true,
      typeEntite: TypeEntite.PERSONNE_PHYSIQUE,
      screeningStatut: ScreeningStatut.ALERTE,
      beneficiaires: [],
      questionnaireReponses: null,
    });
    expect(flags.ppe).toBe(true);
    expect(flags.alertesNationales).toBe(true);
  });

  it('ne déclenche pas les alertes nationales si le screening est OK ou non effectué', () => {
    expect(
      flagsFromClient({
        ppe: false,
        typeEntite: TypeEntite.PERSONNE_PHYSIQUE,
        screeningStatut: ScreeningStatut.OK,
        beneficiaires: [],
      }).alertesNationales,
    ).toBe(false);
    expect(
      flagsFromClient({
        ppe: false,
        typeEntite: TypeEntite.PERSONNE_PHYSIQUE,
        screeningStatut: ScreeningStatut.NON_EFFECTUE,
        beneficiaires: [],
      }).alertesNationales,
    ).toBe(false);
  });

  it('déclenche l’UBO étranger si un bénéficiaire a une nationalité non française, pour une personne morale seulement', () => {
    const beneficiaires = [{ nationalite: 'Portugaise' }];
    expect(
      flagsFromClient({
        ppe: false,
        typeEntite: TypeEntite.PERSONNE_MORALE,
        screeningStatut: ScreeningStatut.NON_EFFECTUE,
        beneficiaires,
      }).uboEtranger,
    ).toBe(true);
    expect(
      flagsFromClient({
        ppe: false,
        typeEntite: TypeEntite.PERSONNE_PHYSIQUE,
        screeningStatut: ScreeningStatut.NON_EFFECTUE,
        beneficiaires,
      }).uboEtranger,
    ).toBe(false);
  });

  it('ne déclenche pas l’UBO étranger pour une nationalité française (variantes courantes)', () => {
    const beneficiaires = [{ nationalite: 'française' }, { nationalite: 'FR' }];
    expect(
      flagsFromClient({
        ppe: false,
        typeEntite: TypeEntite.PERSONNE_MORALE,
        screeningStatut: ScreeningStatut.NON_EFFECTUE,
        beneficiaires,
      }).uboEtranger,
    ).toBe(false);
  });

  it('retombe sur le questionnaire du prospect d’origine pour les critères sans équivalent client (pays à risque, secteur, espèces…)', () => {
    const flags = flagsFromClient({
      ppe: false,
      typeEntite: TypeEntite.PERSONNE_PHYSIQUE,
      screeningStatut: ScreeningStatut.NON_EFFECTUE,
      beneficiaires: [],
      questionnaireReponses: { D3_1_1: 'oui', D2_20: 'oui' },
    });
    expect(flags.paysRisqueGafi).toBe(true);
    expect(flags.especes).toBe(true);
  });

  it('laisse ces critères à false quand il n’y a pas de questionnaire d’origine', () => {
    const flags = flagsFromClient({
      ppe: false,
      typeEntite: TypeEntite.PERSONNE_PHYSIQUE,
      screeningStatut: ScreeningStatut.NON_EFFECTUE,
      beneficiaires: [],
      questionnaireReponses: null,
    });
    expect(flags.paysRisqueGafi).toBe(false);
    expect(flags.secteurSensible).toBe(false);
    expect(flags.especes).toBe(false);
    expect(flags.structureComplexe).toBe(false);
    expect(flags.paysTiers).toBe(false);
  });
});
