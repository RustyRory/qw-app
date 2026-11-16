import {
  DonneesRapport,
  DossierRapport,
  construireRapportHtml,
} from './rapport-template';
import {
  NiveauRisque,
  ScreeningStatut,
  StatutClient,
  StatutKyc,
  TypeEntite,
} from '../common/enums';
import type { ParametresCabinet } from '../cabinet/cabinet.entity';

const dossier = (o: Partial<DossierRapport> = {}): DossierRapport => ({
  type: 'client',
  id: 'c-1',
  ref: 'QW-2026-001',
  nom: 'Alpha',
  etape: StatutClient.ACTIF,
  typeEntite: TypeEntite.PERSONNE_MORALE,
  siren: '123456789',
  formeJuridique: '5710',
  codeNaf: '62.01Z',
  activite: 'Programmation',
  representantLegal: 'Jean Dupont',
  adresse: '1 rue A, 75001 Paris',
  pays: 'France',
  dateCreation: null,
  chiffreAffaires: 100000,
  effectif: 3,
  ppe: false,
  ppeDetail: null,
  suiviPar: null,
  kyc: { statut: StatutKyc.VALIDE, valideLe: new Date(), validePar: 'E C' },
  screening: { statut: ScreeningStatut.OK, date: new Date(), registreDu: null },
  scoring: {
    score: 6,
    niveau: NiveauRisque.FAIBLE,
    niveauCalcule: NiveauRisque.FAIBLE,
    calculeLe: new Date(),
    criteres: [
      { label: 'Chiffre d’affaires', poids: 10, declenche: true },
      { label: 'PPE', poids: 30, declenche: false },
    ],
    eleveDOffice: [],
    ajustement: null,
  },
  risques: [],
  ubos: [],
  piecesManquantes: [],
  gel: { correspondances: [] },
  acceptation: null,
  missions: [],
  obligations: [],
  ...o,
});

const donnees = (dossiers: DossierRapport[]): DonneesRapport => ({
  genereLe: new Date('2026-11-16T10:00:00Z'),
  cabinet: { nom: 'QW', raisonSociale: 'SAS QW' } as ParametresCabinet,
  dossiers,
  risques: [],
});

describe('rapport de cartographie', () => {
  it('contient une fiche par dossier, liée depuis la liste', () => {
    const html = construireRapportHtml(
      donnees([dossier(), dossier({ id: 'c-2', nom: 'Beta' })]),
    );
    expect(html).toContain('id="d-client-c-1"');
    expect(html).toContain('href="#d-client-c-2"');
    expect(html).toContain('SAS <span class="gris-txt">(5710)</span>');
    expect(html).toContain('10 points sur 40');
  });

  it('échappe les données saisies', () => {
    const html = construireRapportHtml(
      donnees([dossier({ nom: '<script>x</script>' })]),
    );
    expect(html).not.toContain('<script>x</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('compte un dossier en alerte gel même sans correspondance enregistrée', () => {
    const html = construireRapportHtml(
      donnees([
        dossier({
          screening: {
            statut: ScreeningStatut.ALERTE,
            date: null,
            registreDu: null,
          },
        }),
      ]),
    );
    expect(html).toMatch(
      /kpi alerte"><div class="kpi-val">1<\/div><div class="kpi-lib">alerte\(s\) registre des gels/,
    );
    expect(html).toContain('registre des gels — dossier en alerte');
  });
});
