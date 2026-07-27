export type AssignationTache = 'CABINET' | 'CLIENT' | 'NA';

export interface RepartitionTravauxLigneCatalogue {
  id: string;
  tache: string;
  defaut: AssignationTache;
}

export interface RepartitionTravauxCategorie {
  titre: string;
  lignes: RepartitionTravauxLigneCatalogue[];
}

export interface RepartitionTravauxAssignation {
  id: string;
  assignation: AssignationTache;
}

export const REPARTITION_TRAVAUX_CATALOGUE: RepartitionTravauxCategorie[] = [
  {
    titre: '1. Mission de présentation des comptes',
    lignes: [
      {
        id: 'c1-1',
        tache:
          'Élaboration et mise à jour du plan comptable, organisation du système comptable',
        defaut: 'CABINET',
      },
      {
        id: 'c1-2',
        tache:
          'Émission des factures de ventes, process de livraison et facturation',
        defaut: 'CLIENT',
      },
      {
        id: 'c1-3',
        tache:
          'Classement des pièces comptables, numérotation et vérification, dépôt des pièces comptables de dépenses et de recettes au logiciel de comptabilité, connexion des comptes bancaires au logiciel de comptabilité',
        defaut: 'CLIENT',
      },
      { id: 'c1-4', tache: 'Saisie comptable', defaut: 'CABINET' },
      {
        id: 'c1-5',
        tache: 'Stocks, travaux en cours et factures à établir',
        defaut: 'CLIENT',
      },
      {
        id: 'c1-6',
        tache: 'Tenue du fichier des immobilisations et amortissements',
        defaut: 'CABINET',
      },
      {
        id: 'c1-7',
        tache:
          "Justification des comptes clients et fournisseurs, et notamment de l'en cours clients à la date de clôture, révision du dossier",
        defaut: 'CABINET',
      },
      {
        id: 'c1-8',
        tache:
          "Établissement et présentation comparée des documents comptables de fin d'exercice, balance, grand livre, journaux, FEC et son archivage.",
        defaut: 'CABINET',
      },
    ],
  },
  {
    titre: '2. Intervention en matière fiscale',
    lignes: [
      {
        id: 'c2-1',
        tache: 'Télédéclaration de la liasse fiscale et des déclarations DAS2',
        defaut: 'CABINET',
      },
      {
        id: 'c2-2',
        tache:
          "Établissement des déclarations de TVA et d'échanges de biens et de services (DEB et DES)",
        defaut: 'NA',
      },
      {
        id: 'c2-3',
        tache: 'Télédéclaration de la CVAE, TVS, autres imprimés fiscaux',
        defaut: 'NA',
      },
      {
        id: 'c2-4',
        tache:
          "Assistance en cas de demande de renseignements par l'administration fiscale (facturation en sus au temps passé ou sur devis préalable)",
        defaut: 'CABINET',
      },
    ],
  },
  {
    titre: '3. Intervention en matière juridique',
    lignes: [
      {
        id: 'c3-1',
        tache:
          'Rédaction des procès-verbaux de réunions, de conseils et d’assemblées',
        defaut: 'NA',
      },
      {
        id: 'c3-2',
        tache:
          'Formalités de convocation des assemblées et de publicité des décisions, tenue des registres obligatoires',
        defaut: 'NA',
      },
    ],
  },
  {
    titre: "4. Intervention en matière d'outils de gestion",
    lignes: [
      {
        id: 'c4-1',
        tache:
          'Situation comptable intermédiaire, étude prévisionnelle d’activité, tableau de bord',
        defaut: 'NA',
      },
    ],
  },
];

export function repartitionTravauxParDefaut(): RepartitionTravauxAssignation[] {
  return REPARTITION_TRAVAUX_CATALOGUE.flatMap((categorie) =>
    categorie.lignes.map((ligne) => ({
      id: ligne.id,
      assignation: ligne.defaut,
    })),
  );
}

export function resoudreAssignation(
  ligneId: string,
  assignations: RepartitionTravauxAssignation[] | null | undefined,
  defaut: AssignationTache,
): AssignationTache {
  return assignations?.find((a) => a.id === ligneId)?.assignation ?? defaut;
}
