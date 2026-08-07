import { Mission } from '../missions/entities/mission.entity';
import { TypeMission } from '../common/enums';
import { RepartitionTravauxAssignation } from '../common/repartition-travaux';

export const MISSION_TYPE_LABELS: Record<TypeMission, string> = {
  [TypeMission.COMPTABILITE]: 'présentation des comptes annuels',
  [TypeMission.AUDIT]: "d'audit",
  [TypeMission.CONSEIL]: 'de conseil',
  [TypeMission.JURIDIQUE]: 'd’assistance juridique',
  [TypeMission.AUTRE]: '',
};

export const CABINET_INFOS = {
  nom: 'QW CONSEILS',
  raisonSociale: 'SAS QW CONSEILS',
  ville: 'Paris',
  adresse: '29 Rue du Colisée – 75008 PARIS',
  formeJuridique: "SAS d'expertise-comptable",
  capitalSocial: '10 000 €',
  siret: '952 244 887 00016',
  codeApe: '6920 Z',
  tvaIntracommunautaire: 'FR89 952 244 887',
};

export interface LettreMissionContenu {
  cabinet: typeof CABINET_INFOS;
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
): LettreMissionContenu {
  const now = new Date();

  return {
    cabinet: CABINET_INFOS,
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
