import * as path from 'path';
import { TypeDocument } from './enums';

// Racine unique des fichiers conservés côté serveur (documents + PDF de
// lettres de mission). En production, ce dossier est un volume Docker
// (cf. deployment/docker-compose.yml) : sans volume, tout est perdu à chaque
// redéploiement du conteneur.
export const UPLOADS_ROOT =
  process.env.UPLOADS_ROOT ?? path.join(process.cwd(), 'uploads');

export const DOCUMENTS_ROOT = path.join(UPLOADS_ROOT, 'documents');
export const LETTRES_MISSION_ROOT = path.join(UPLOADS_ROOT, 'lettres-mission');

export const TAILLE_MAX_DOCUMENT = 20 * 1024 * 1024; // 20 Mo

// Extensions acceptées → type MIME servi au téléchargement.
export const EXTENSIONS_AUTORISEES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

// Libellé d'un type de document dans le nom de fichier (sans espace).
export const TYPE_DOCUMENT_FICHIER: Record<TypeDocument, string> = {
  [TypeDocument.PIECE_IDENTITE]: 'PieceIdentite',
  [TypeDocument.PIECE_IDENTITE_DIRIGEANT]: 'PieceIdentiteDirigeant',
  [TypeDocument.PIECE_IDENTITE_BENEFICIAIRE]: 'PieceIdentiteBeneficiaire',
  [TypeDocument.JUSTIFICATIF_DOMICILE]: 'JustificatifDomicile',
  [TypeDocument.KBIS]: 'Kbis',
  [TypeDocument.STATUTS]: 'Statuts',
  [TypeDocument.LISTE_UBO]: 'ListeBeneficiaires',
  [TypeDocument.ATTESTATION_PPE]: 'AttestationPPE',
  [TypeDocument.JUSTIFICATIF_FONDS]: 'OrigineFonds',
  [TypeDocument.LETTRE_MISSION]: 'LettreMission',
  [TypeDocument.RAPPORT]: 'Rapport',
  [TypeDocument.ANNEXE]: 'Annexe',
  [TypeDocument.AUTRE]: 'Document',
};

function sansAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// « Société Martin & Fils » → « SocieteMartinFils » (partie « Nom » d'un
// nom de fichier).
export function nomCompact(nom: string): string {
  const compact = sansAccents(nom)
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((mot) => mot.charAt(0).toUpperCase() + mot.slice(1))
    .join('');
  return compact.slice(0, 60) || 'SansNom';
}

// Nom de dossier lisible, valide sous Windows comme sous Linux :
// « QW-2026-001 Société Martin ».
export function nomDossier(ref: string, nom: string): string {
  const propre = Array.from(`${ref} ${nom}`)
    // caractères de contrôle et caractères interdits par Windows
    .filter((c) => c.charCodeAt(0) >= 32 && !'<>:"/\\|?*'.includes(c))
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/, '');
  return propre.slice(0, 120);
}

export function dateFichier(date: Date = new Date()): string {
  const jj = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${jj}-${mm}-${date.getFullYear()}`;
}

export type CibleDossier = 'client' | 'prospect';

// Chemin relatif (séparateur « / ») d'un fichier dans le dossier local de
// l'utilisateur : Clients/<Réf> <Nom>/<Nom>-<Type>-<JJ-MM-AAAA>.<ext>
export function cheminRelatifDocument(params: {
  cible: CibleDossier;
  ref: string;
  nom: string;
  libelleType: string;
  extension: string;
  date?: Date;
  suffixe?: number;
}): string {
  const racine = params.cible === 'client' ? 'Clients' : 'Prospects';
  const base = `${nomCompact(params.nom)}-${params.libelleType}-${dateFichier(params.date)}`;
  const suffixe =
    params.suffixe && params.suffixe > 1 ? `-${params.suffixe}` : '';
  return `${racine}/${nomDossier(params.ref, params.nom)}/${base}${suffixe}${params.extension.toLowerCase()}`;
}
