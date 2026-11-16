import {
  EntreeRegistre,
  motsSignificatifs,
  rechercher,
} from './correspondance-noms';

const pp = (id: number, ...noms: string[]): EntreeRegistre => ({
  id,
  nature: 'PERSONNE_PHYSIQUE',
  nom: noms[0],
  motifs: '',
  variantes: noms.map(motsSignificatifs),
});
const pm = (id: number, ...noms: string[]): EntreeRegistre => ({
  id,
  nature: 'PERSONNE_MORALE',
  nom: noms[0],
  motifs: '',
  variantes: noms.map(motsSignificatifs),
});

const registre = [
  pp(1, 'SHILKIN', 'Grigory Vladimirovich SHILKIN', 'Grigori Chilkine'),
  pp(2, 'DUPONT', 'Jean DUPONT'),
  pm(3, 'JSC Gruppa Kremniy El', 'Gruppa Kremniy'),
  pm(4, 'Alpha'),
];

describe('correspondance avec le registre des gels', () => {
  it('normalise accents, casse et formes juridiques', () => {
    expect(motsSignificatifs('Société Élan SAS')).toEqual(['elan']);
  });

  it('retrouve une personne quel que soit l’ordre prénom / nom', () => {
    expect(
      rechercher('SHILKIN Grigory', 'PERSONNE', registre).map((e) => e.id),
    ).toEqual([1]);
    expect(
      rechercher('Grigori Chilkine', 'PERSONNE', registre).map((e) => e.id),
    ).toEqual([1]);
  });

  it('ignore une personne avec un seul mot (trop de faux positifs)', () => {
    expect(rechercher('Dupont', 'PERSONNE', registre)).toEqual([]);
  });

  it('ne confond pas une personne avec un homonyme de prénom différent', () => {
    expect(rechercher('Marie Dupont', 'PERSONNE', registre)).toEqual([]);
    expect(
      rechercher('Jean Dupont', 'PERSONNE', registre).map((e) => e.id),
    ).toEqual([2]);
  });

  it('retrouve une entité malgré la forme juridique', () => {
    expect(
      rechercher('Gruppa Kremniy SAS', 'ENTITE', registre).map((e) => e.id),
    ).toEqual([3]);
  });

  it('exige l’égalité pour un nom d’entité d’un seul mot', () => {
    expect(rechercher('Alpha', 'ENTITE', registre).map((e) => e.id)).toEqual([
      4,
    ]);
    expect(rechercher('Alpha Conseil', 'ENTITE', registre)).toEqual([]);
  });

  it('ne compare pas une entité aux personnes physiques', () => {
    expect(rechercher('Jean Dupont', 'ENTITE', registre)).toEqual([]);
  });
});
