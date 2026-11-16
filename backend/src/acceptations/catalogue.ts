// Questionnaire d'acceptation et de maintien de la mission, inspiré de la
// fiche O11 de l'Ordre des experts-comptables (libellés reformulés).
//  - type « oui_non »        : Oui / Non + observation
//  - type « oui_non_risque » : Oui / Non + niveau de risque E / M / F
// Les questions « maintien » ne concernent que les clients existants
// (revue annuelle).

export type TypeQuestionAcceptation = 'oui_non' | 'oui_non_risque';

export interface QuestionAcceptation {
  id: string;
  texte: string;
  type: TypeQuestionAcceptation;
  // Réponse attendue pour une situation normale (sert à signaler les
  // réponses atypiques à l'expert-comptable).
  attendu: 'oui' | 'non';
}

export interface SectionAcceptation {
  id: string;
  titre: string;
  intro?: string;
  maintienSeulement?: boolean;
  questions: QuestionAcceptation[];
}

export const CATALOGUE_ACCEPTATION: SectionAcceptation[] = [
  {
    id: 'connaissance',
    titre: '1. Prise de connaissance',
    questions: [
      {
        id: 'visite',
        texte:
          'L’expert-comptable s’est-il rendu dans les locaux de l’entité ?',
        type: 'oui_non',
        attendu: 'oui',
      },
      {
        id: 'rencontre',
        texte:
          'L’expert-comptable a-t-il rencontré le client pour comprendre ses besoins et découvrir l’entité ?',
        type: 'oui_non',
        attendu: 'oui',
      },
    ],
  },
  {
    id: 'caracteristiques',
    titre: '2. Caractéristiques générales de l’entité',
    intro:
      'Joindre au dossier permanent une présentation de l’entité (plaquette, notes d’entretien, budgets, tableaux de bord…). Cette présentation couvre-t-elle :',
    questions: [
      {
        id: 'activite',
        texte: 'Une description sommaire de l’activité',
        type: 'oui_non_risque',
        attendu: 'oui',
      },
      {
        id: 'identite',
        texte:
          'L’identité complète (forme juridique, détenteurs du capital, dirigeants)',
        type: 'oui_non_risque',
        attendu: 'oui',
      },
      {
        id: 'systemeInformation',
        texte:
          'Le système d’information (fiabilité, conformité à la réglementation, sécurité)',
        type: 'oui_non_risque',
        attendu: 'oui',
      },
      {
        id: 'organisationComptable',
        texte:
          'L’organisation comptable (fonction comptable, qualification du personnel, travaux pris en charge)',
        type: 'oui_non_risque',
        attendu: 'oui',
      },
      {
        id: 'historique',
        texte:
          'L’historique fiscal et social (contrôles fiscaux, contrôles Urssaf…)',
        type: 'oui_non_risque',
        attendu: 'oui',
      },
    ],
  },
  {
    id: 'besoins',
    titre: '3. Besoins du client et répartition des travaux',
    intro: 'Les éléments suivants figurent-ils au dossier ?',
    questions: [
      {
        id: 'noteTravaux',
        texte:
          'Une note sur la nature des travaux comptables pris en charge par l’entité',
        type: 'oui_non',
        attendu: 'oui',
      },
      {
        id: 'volume',
        texte:
          'Le volume d’écritures comptables (nombre de factures, de comptes fournisseurs, clients…)',
        type: 'oui_non',
        attendu: 'oui',
      },
      {
        id: 'specificites',
        texte:
          'Les spécificités comptables, fiscales et sociales de l’activité nécessitant des travaux approfondis (valorisation, provisions…)',
        type: 'oui_non',
        attendu: 'oui',
      },
      {
        id: 'evaluationTravaux',
        texte:
          'L’évaluation de la nature et de l’étendue des travaux du cabinet, compte tenu des travaux faits en interne par l’entité',
        type: 'oui_non',
        attendu: 'oui',
      },
      {
        id: 'delais',
        texte: 'Les délais particuliers à respecter (demande du client…)',
        type: 'oui_non',
        attendu: 'oui',
      },
    ],
  },
  {
    id: 'faisabilite',
    titre: '4. Faisabilité de la mission',
    questions: [
      {
        id: 'independance',
        texte: 'Le cabinet est-il indépendant vis-à-vis du client ?',
        type: 'oui_non',
        attendu: 'oui',
      },
      {
        id: 'competence',
        texte:
          'Au regard des normes de la profession, le cabinet dispose-t-il de la compétence nécessaire ?',
        type: 'oui_non',
        attendu: 'oui',
      },
      {
        id: 'qualite',
        texte:
          'Au regard des normes de la profession, le cabinet peut-il assurer la qualité de travail requise ?',
        type: 'oui_non',
        attendu: 'oui',
      },
      {
        id: 'moyens',
        texte:
          'Le cabinet dispose-t-il des moyens nécessaires pour mener la mission dans de bonnes conditions (délais notamment) ?',
        type: 'oui_non',
        attendu: 'oui',
      },
    ],
  },
  {
    id: 'maintien',
    titre: '5. Maintien de la mission (client existant)',
    maintienSeulement: true,
    questions: [
      {
        id: 'evenements',
        texte:
          'Des événements remettent-ils en cause le maintien de la mission ?',
        type: 'oui_non',
        attendu: 'non',
      },
      {
        id: 'obligationsDeclaratives',
        texte:
          'L’entité respecte-t-elle correctement ses obligations déclaratives ?',
        type: 'oui_non',
        attendu: 'oui',
      },
      {
        id: 'poursuite',
        texte:
          'Le cabinet peut-il poursuivre la mission dans le respect des normes de la profession ?',
        type: 'oui_non',
        attendu: 'oui',
      },
    ],
  },
];

export interface ReponseAcceptation {
  reponse?: 'oui' | 'non' | null;
  niveau?: 'E' | 'M' | 'F' | null;
  observation?: string | null;
}

// Questions sans réponse (Oui/Non), compte tenu du contexte (client
// existant = partie « maintien » incluse).
export function questionsSansReponse(
  reponses: Record<string, ReponseAcceptation> | null | undefined,
  maintien: boolean,
): string[] {
  return CATALOGUE_ACCEPTATION.filter((s) => maintien || !s.maintienSeulement)
    .flatMap((s) => s.questions)
    .filter((q) => !reponses?.[q.id]?.reponse)
    .map((q) => q.id);
}
