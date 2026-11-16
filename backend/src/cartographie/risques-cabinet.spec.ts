import {
  DossierRisques,
  RISQUES_CABINET,
  niveauCartographie,
} from './risques-cabinet';

const vide: DossierRisques = {
  reponsesLab: {},
  reponsesAcceptation: {},
  ppe: false,
  formeJuridique: null,
  codeNaf: null,
  dateCreationEntreprise: null,
  typesMission: [],
};
const risquesDe = (d: Partial<DossierRisques>) =>
  RISQUES_CABINET.filter((r) => r.concerne?.({ ...vide, ...d })).map(
    (r) => r.numero,
  );

describe('cartographie des risques du cabinet', () => {
  it('reprend les cotes de la matrice', () => {
    const cotes = RISQUES_CABINET.map((r) => [
      r.numero,
      r.probabilite * r.impact,
    ]);
    expect(cotes).toEqual([
      [1, 9],
      [2, 9],
      [3, 8],
      [4, 8],
      [5, 9],
      [6, 9],
      [7, 8],
      [8, 4],
      [9, 8],
      [10, 6],
      [11, 6],
      [12, 4],
      [13, 6],
    ]);
    expect(niveauCartographie(4)).toBe('FAIBLE');
    expect(niveauCartographie(6)).toBe('MODERE');
    expect(niveauCartographie(9)).toBe('ELEVE');
  });

  it('ne rattache aucun risque à un dossier sans indice', () => {
    expect(risquesDe({})).toEqual([]);
  });

  it('rattache les risques à partir du questionnaire et des données', () => {
    expect(risquesDe({ reponsesLab: { D2_20: 'oui' } })).toEqual([1]);
    expect(risquesDe({ ppe: true })).toEqual([3]);
    expect(risquesDe({ formeJuridique: 'Association loi 1901' })).toEqual([4]);
    expect(risquesDe({ reponsesLab: { D2_2: 'risque_eleve' } })).toEqual([5]);
    expect(risquesDe({ typesMission: ['TENUE_COMPTABLE'] })).toEqual([8]);
    expect(
      risquesDe({ typesMission: ['TENUE_COMPTABLE', 'COMPTES_ANNUELS'] }),
    ).toEqual([]);
    expect(risquesDe({ reponsesLab: { D3_1_3: 'oui' } })).toEqual([9]);
    expect(
      risquesDe({ reponsesAcceptation: { rencontre: { reponse: 'non' } } }),
    ).toEqual([11]);
  });

  it('considère une société créée depuis moins de 2 ans comme récente', () => {
    const recente = new Date();
    recente.setMonth(recente.getMonth() - 6);
    expect(risquesDe({ dateCreationEntreprise: recente })).toEqual([2]);
  });

  it('marque PPE et pays à haut risque en vigilance renforcée', () => {
    expect(
      RISQUES_CABINET.filter((r) => r.vigilanceRenforcee).map((r) => r.numero),
    ).toEqual([3, 9]);
  });
});
