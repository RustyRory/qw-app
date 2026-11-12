import { Mission } from '../missions/entities/mission.entity';
import { TypeMission } from '../common/enums';
import { TYPES_MISSION } from '../common/types-mission';
import { ParametresCabinet } from '../cabinet/cabinet.entity';
import { RepartitionTravauxAssignation } from '../common/repartition-travaux';

export const MISSION_TYPE_LABELS: Record<TypeMission, string> =
  Object.fromEntries(
    Object.entries(TYPES_MISSION).map(([k, v]) => [k, v.phrase]),
  ) as Record<TypeMission, string>;

// Instantané des coordonnées du cabinet au moment de la génération (cf.
// ParametresCabinet). Les lettres plus anciennes n'ont pas codePostal,
// email ni telephone : le gabarit les traite comme facultatifs.
export interface CabinetLettre {
  nom: string;
  raisonSociale: string;
  ville: string;
  adresse: string;
  codePostal?: string;
  formeJuridique: string;
  capitalSocial: string;
  siret: string;
  codeApe: string;
  tvaIntracommunautaire: string;
  email?: string | null;
  telephone?: string | null;
}

export interface LettreMissionContenu {
  cabinet: CabinetLettre;
  client: {
    raisonSociale: string;
    formeJuridique: string;
    siret: string;
    codeNaf: string;
    activitePrincipale: string;
    adresse: string;
    gerant: string;
    email: string;
    capitalSocial: string;
    regimeFiscal: string;
    regimeTva: string;
    tvaIntracommunautaire: string;
    existenceSalaries: string;
    conventionCollective: string;
  };
  mission: {
    type: TypeMission;
    typeLabel: string;
    description: string;
    dateDebut: string;
    dateFin: string;
    dateDebutLong: string;
    dateFinLong: string;
    honoraires: string;
    repartitionTravaux: RepartitionTravauxAssignation[] | null;
  };
  dateGeneration: string;
  dateGenerationLong: string;
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR');
}

function formatDateLong(date: Date | string | null | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatAdresse(
  adresse: string | null,
  codePostal: string | null,
  ville: string | null,
): string {
  const parts = [adresse, codePostal, ville].filter(
    (p) => p && p.trim() !== '',
  );
  return parts.join(', ');
}

function formatCapitalSocial(capitalSocial: number | null): string {
  if (capitalSocial == null) return '';
  return `${Number(capitalSocial).toLocaleString('fr-FR')} €`;
}

// null = jamais renseigné → laissé vide (déclenche le fallback « À
// compléter » côté template) ; false doit rester affiché comme « Non », pas
// confondu avec « pas encore renseigné ».
function formatExistenceSalaries(existenceSalaries: boolean | null): string {
  if (existenceSalaries == null) return '';
  return existenceSalaries ? 'Oui' : 'Non';
}

// La lettre de mission peut être préparée pour un Prospect (avant conversion,
// dès la validation LAB) ou pour un Client : les deux entités portent les
// mêmes informations d'identité sous des noms de colonnes différents.
function entiteFromMission(mission: Mission): LettreMissionContenu['client'] {
  if (mission.client) {
    const client = mission.client;
    return {
      raisonSociale: client.raisonSociale ?? '',
      formeJuridique: client.formeJuridique ?? '',
      siret: client.siret ?? '',
      codeNaf: client.codeNaf ?? '',
      activitePrincipale: client.activitePrincipale ?? '',
      adresse: formatAdresse(
        client.adresseSiege,
        client.codePostal,
        client.ville,
      ),
      gerant: client.representantLegal ?? '',
      email: client.email ?? '',
      capitalSocial: formatCapitalSocial(client.capitalSocial),
      regimeFiscal: client.regimeFiscal ?? '',
      regimeTva: client.regimeTva ?? '',
      tvaIntracommunautaire: client.tvaIntracommunautaire ?? '',
      existenceSalaries: formatExistenceSalaries(client.existenceSalaries),
      conventionCollective: client.conventionCollective ?? '',
    };
  }

  if (mission.prospect) {
    const prospect = mission.prospect;
    return {
      raisonSociale: prospect.nom ?? '',
      formeJuridique: prospect.formeJuridique ?? '',
      siret: prospect.siret ?? '',
      codeNaf: prospect.codeNaf ?? '',
      activitePrincipale: prospect.activite ?? '',
      adresse: formatAdresse(
        prospect.adresse,
        prospect.codePostal,
        prospect.ville,
      ),
      gerant: prospect.representantLegal ?? '',
      email: prospect.email ?? '',
      capitalSocial: formatCapitalSocial(prospect.capitalSocial),
      regimeFiscal: prospect.regimeFiscal ?? '',
      regimeTva: prospect.regimeTva ?? '',
      tvaIntracommunautaire: prospect.tvaIntracommunautaire ?? '',
      existenceSalaries: formatExistenceSalaries(prospect.existenceSalaries),
      conventionCollective: prospect.conventionCollective ?? '',
    };
  }

  throw new Error('La mission doit être rattachée à un client ou un prospect');
}

export function buildLettreMissionContenu(
  mission: Mission,
  cabinet: ParametresCabinet,
): LettreMissionContenu {
  const now = new Date();

  return {
    cabinet: {
      nom: cabinet.nom,
      raisonSociale: cabinet.raisonSociale,
      ville: cabinet.ville,
      adresse: cabinet.adresse,
      codePostal: cabinet.codePostal,
      formeJuridique: cabinet.formeJuridique,
      capitalSocial: cabinet.capitalSocial,
      siret: cabinet.siret,
      codeApe: cabinet.codeApe,
      tvaIntracommunautaire: cabinet.tvaIntracommunautaire,
      email: cabinet.email,
      telephone: cabinet.telephone,
    },
    client: entiteFromMission(mission),
    mission: {
      type: mission.type,
      typeLabel: MISSION_TYPE_LABELS[mission.type],
      description: mission.description ?? '',
      dateDebut: formatDate(mission.dateDebut),
      dateFin: formatDate(mission.dateFin),
      dateDebutLong: formatDateLong(mission.dateDebut),
      dateFinLong: formatDateLong(mission.dateFin),
      honoraires:
        mission.honoraires != null
          ? `${Number(mission.honoraires).toLocaleString('fr-FR')} € HT`
          : '',
      repartitionTravaux: mission.repartitionTravaux ?? null,
    },
    dateGeneration: formatDate(now),
    dateGenerationLong: formatDateLong(now),
  };
}
