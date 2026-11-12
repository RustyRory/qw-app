"use client";

import { apiFetch, fetchBlobUrl } from "@/lib/apiFetch";
import {
  accederDossierLocal,
  ecrireFichierLocal,
  DossierLocalError,
} from "@/lib/local-folder";
import type { Document, TypeDocument } from "@/types";

export const DOCUMENT_TYPE_LABELS: Record<TypeDocument, string> = {
  PIECE_IDENTITE: "Pièce d’identité",
  PIECE_IDENTITE_DIRIGEANT: "Pièce d’identité du dirigeant",
  PIECE_IDENTITE_BENEFICIAIRE: "Pièce d’identité d’un bénéficiaire",
  JUSTIFICATIF_DOMICILE: "Justificatif de domicile",
  KBIS: "KBIS",
  STATUTS: "Statuts",
  LISTE_UBO: "Liste des bénéficiaires effectifs",
  ATTESTATION_PPE: "Attestation PPE",
  JUSTIFICATIF_FONDS: "Justificatif d’origine des fonds",
  LETTRE_MISSION: "Lettre de mission",
  RAPPORT: "Rapport",
  ANNEXE: "Annexe",
  AUTRE: "Autre",
};

// Miroir de backend/src/common/storage.ts (EXTENSIONS_AUTORISEES).
export const DOCUMENT_ACCEPT = ".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx";
export const DOCUMENT_TAILLE_MAX = 20 * 1024 * 1024;

export type CibleDocument = "client" | "prospect";

export interface DepotDocument {
  userId: string;
  cible: CibleDocument;
  cibleId: string;
  file: File;
  type: TypeDocument;
  dateExpiration?: string | null;
  relations?: Partial<
    Record<
      "contactId" | "missionId" | "planningEtapeId" | "operationSensibleId",
      string
    >
  >;
}

// Dépôt complet d'un document :
//  1. vérifie l'accès au dossier local (bloque le dépôt sinon) ;
//  2. envoie le fichier au serveur, qui le renomme et le conserve ;
//  3. l'écrit dans le dossier local à l'emplacement calculé par le serveur.
// À appeler depuis un gestionnaire de clic / de sélection de fichier (la
// demande d'autorisation du navigateur en a besoin).
export async function deposerDocument(d: DepotDocument): Promise<Document> {
  const extension = d.file.name
    .slice(d.file.name.lastIndexOf("."))
    .toLowerCase();
  if (!DOCUMENT_ACCEPT.split(",").includes(extension)) {
    throw new Error(
      "Format non accepté (PDF, JPG, PNG, Word ou Excel uniquement).",
    );
  }
  if (d.file.size > DOCUMENT_TAILLE_MAX) {
    throw new Error("Fichier trop volumineux (20 Mo maximum).");
  }

  const dossier = await accederDossierLocal(d.userId, true);

  const body = new FormData();
  body.append("file", d.file);
  body.append("type", d.type);
  if (d.dateExpiration) body.append("dateExpiration", d.dateExpiration);
  for (const [cle, valeur] of Object.entries(d.relations ?? {})) {
    if (valeur) body.append(cle, valeur);
  }

  const doc = await apiFetch<Document>(`/documents/${d.cible}/${d.cibleId}`, {
    method: "POST",
    body,
  });

  if (doc.cheminRelatif) {
    try {
      await ecrireFichierLocal(dossier, doc.cheminRelatif, d.file);
    } catch (err) {
      throw new DossierLocalError(
        `Le document est enregistré sur le serveur, mais l’écriture dans votre dossier local a échoué (${
          err instanceof Error ? err.message : String(err)
        }). Utilisez « Synchroniser » dans Mon profil pour le récupérer.`,
      );
    }
  }
  return doc;
}

// Copie dans le dossier local un document conservé sur le serveur
// (rattrapage après un échec d'écriture, ou après une conversion).
export async function recupererDocumentLocal(
  userId: string,
  doc: Document,
  demander: boolean,
): Promise<void> {
  if (!doc.cheminRelatif) return;
  const dossier = await accederDossierLocal(userId, demander);
  const url = await fetchBlobUrl(`/documents/${doc.id}/download`);
  try {
    const blob = await (await fetch(url)).blob();
    await ecrireFichierLocal(dossier, doc.cheminRelatif, blob);
  } finally {
    URL.revokeObjectURL(url);
  }
}
