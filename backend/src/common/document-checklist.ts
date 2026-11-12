import { TypeDocument, TypeEntite } from './enums';

// Pièces KYC obligatoires (cf. docs/projet/decisions-revue-2026-11.md §4).
export const DOCUMENTS_REQUIS: Record<TypeEntite, TypeDocument[]> = {
  [TypeEntite.PERSONNE_MORALE]: [
    TypeDocument.KBIS,
    TypeDocument.STATUTS,
    TypeDocument.LISTE_UBO,
    TypeDocument.PIECE_IDENTITE_DIRIGEANT,
    TypeDocument.PIECE_IDENTITE_BENEFICIAIRE,
  ],
  [TypeEntite.PERSONNE_PHYSIQUE]: [
    TypeDocument.PIECE_IDENTITE,
    TypeDocument.JUSTIFICATIF_DOMICILE,
  ],
};

export interface DocumentPresent {
  type: TypeDocument;
  dateExpiration?: string | Date | null;
}

export interface ContexteChecklist {
  typeEntite: TypeEntite;
  // Client ou l'un de ses bénéficiaires effectifs PPE.
  ppe: boolean;
  // Niveau de risque ÉLEVÉ : justificatif d'origine des fonds exigé.
  risqueEleve: boolean;
}

export function documentsRequis(ctx: ContexteChecklist): TypeDocument[] {
  const requis = [...DOCUMENTS_REQUIS[ctx.typeEntite]];
  if (ctx.ppe) requis.push(TypeDocument.ATTESTATION_PPE);
  if (ctx.risqueEleve) requis.push(TypeDocument.JUSTIFICATIF_FONDS);
  return requis;
}

function estValide(doc: DocumentPresent, maintenant: Date): boolean {
  if (!doc.dateExpiration) return true;
  return new Date(doc.dateExpiration).getTime() >= maintenant.getTime();
}

// Pièces requises absentes ou dont toutes les versions déposées sont
// expirées.
export function documentsManquants(
  ctx: ContexteChecklist,
  documents: DocumentPresent[],
  maintenant: Date = new Date(),
): TypeDocument[] {
  return documentsRequis(ctx).filter(
    (type) =>
      !documents.some((d) => d.type === type && estValide(d, maintenant)),
  );
}
