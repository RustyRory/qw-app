import { TypeMission } from './enums';

// Référentiel unique des types de mission :
//  - libelle : affichage (planning, interface) ;
//  - phrase  : « … nous confier une mission <phrase> de votre entité » ;
//  - fichier : partie « Type » du nom de fichier de la lettre de mission.
export const TYPES_MISSION: Record<
  TypeMission,
  { libelle: string; phrase: string; fichier: string }
> = {
  [TypeMission.TENUE_COMPTABLE]: {
    libelle: 'Tenue comptable',
    phrase: 'de tenue comptable',
    fichier: 'TenueComptable',
  },
  [TypeMission.COMPTES_ANNUELS]: {
    libelle: 'Comptes annuels',
    phrase: 'de présentation des comptes annuels',
    fichier: 'ComptesAnnuels',
  },
  [TypeMission.SOCIAL_PAIE]: {
    libelle: 'Social / Paie',
    phrase: 'sociale et de gestion de la paie',
    fichier: 'SocialPaie',
  },
  [TypeMission.FISCAL]: {
    libelle: 'Fiscal',
    phrase: 'd’assistance fiscale',
    fichier: 'Fiscal',
  },
  [TypeMission.JURIDIQUE]: {
    libelle: 'Juridique',
    phrase: 'd’assistance juridique',
    fichier: 'Juridique',
  },
  [TypeMission.CONSEIL]: {
    libelle: 'Conseil',
    phrase: 'de conseil',
    fichier: 'Conseil',
  },
  [TypeMission.AUDIT_EXAMEN]: {
    libelle: 'Audit / Examen',
    phrase: 'd’audit contractuel ou d’examen limité',
    fichier: 'AuditExamen',
  },
  [TypeMission.AUTRE]: { libelle: 'Autre', phrase: '', fichier: 'Autre' },
};

// Missions comptables : la lettre détaille la présentation des comptes
// (nature, étendue et limites des travaux, attestation).
export function estMissionComptable(type: TypeMission): boolean {
  return (
    type === TypeMission.TENUE_COMPTABLE || type === TypeMission.COMPTES_ANNUELS
  );
}
