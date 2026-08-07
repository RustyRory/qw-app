import { TypeDocument, TypeEntite } from './enums';

export const DOCUMENTS_REQUIS: Record<TypeEntite, TypeDocument[]> = {
  [TypeEntite.PERSONNE_MORALE]: [
    TypeDocument.KBIS,
    TypeDocument.STATUTS,
    TypeDocument.LISTE_UBO,
  ],
  [TypeEntite.PERSONNE_PHYSIQUE]: [
    TypeDocument.PIECE_IDENTITE,
    TypeDocument.JUSTIFICATIF_DOMICILE,
  ],
};

export function documentsManquants(
  typeEntite: TypeEntite,
  ppe: boolean,
  typesExistants: TypeDocument[],
): TypeDocument[] {
  const requis = [...DOCUMENTS_REQUIS[typeEntite]];
  if (ppe) requis.push(TypeDocument.ATTESTATION_PPE);

  return requis.filter((type) => !typesExistants.includes(type));
}
