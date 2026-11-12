import { documentsManquants } from './document-checklist';
import { TypeDocument, TypeEntite } from './enums';

const PM = {
  typeEntite: TypeEntite.PERSONNE_MORALE,
  ppe: false,
  risqueEleve: false,
};
const tousPm = [
  TypeDocument.KBIS,
  TypeDocument.STATUTS,
  TypeDocument.LISTE_UBO,
  TypeDocument.PIECE_IDENTITE_DIRIGEANT,
  TypeDocument.PIECE_IDENTITE_BENEFICIAIRE,
].map((type) => ({ type }));

describe('documentsManquants', () => {
  it('exige les pièces du dirigeant et des bénéficiaires pour une société', () => {
    expect(documentsManquants(PM, [])).toEqual([
      TypeDocument.KBIS,
      TypeDocument.STATUTS,
      TypeDocument.LISTE_UBO,
      TypeDocument.PIECE_IDENTITE_DIRIGEANT,
      TypeDocument.PIECE_IDENTITE_BENEFICIAIRE,
    ]);
    expect(documentsManquants(PM, tousPm)).toEqual([]);
  });

  it('ajoute l’attestation PPE et l’origine des fonds selon le contexte', () => {
    expect(
      documentsManquants({ ...PM, ppe: true, risqueEleve: true }, tousPm),
    ).toEqual([TypeDocument.ATTESTATION_PPE, TypeDocument.JUSTIFICATIF_FONDS]);
  });

  it('considère une pièce expirée comme manquante', () => {
    const maintenant = new Date('2026-11-12');
    const docs = tousPm.map((d) =>
      d.type === TypeDocument.KBIS ? { ...d, dateExpiration: '2026-10-01' } : d,
    );
    expect(documentsManquants(PM, docs, maintenant)).toEqual([
      TypeDocument.KBIS,
    ]);
    // une autre version, encore valide, suffit
    expect(
      documentsManquants(
        PM,
        [...docs, { type: TypeDocument.KBIS, dateExpiration: '2027-01-01' }],
        maintenant,
      ),
    ).toEqual([]);
  });
});
