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

function formatAdresse(client: Mission['client']): string {
  const parts = [client.adresseSiege, client.codePostal, client.ville].filter(
    (p) => p && p.trim() !== '',
  );
  return parts.join(', ');
}

export function buildLettreMissionContenu(
  mission: Mission,
): LettreMissionContenu {
  const client = mission.client;
  const now = new Date();

  return {
    cabinet: CABINET_INFOS,
    client: {
      raisonSociale: client.raisonSociale ?? '',
      formeJuridique: client.formeJuridique ?? '',
      siret: client.siret ?? '',
      codeNaf: client.codeNaf ?? '',
      activitePrincipale: client.activitePrincipale ?? '',
      adresse: formatAdresse(client),
      gerant: client.representantLegal ?? '',
    },
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
