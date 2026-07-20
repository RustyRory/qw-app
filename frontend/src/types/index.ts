// ─── Enums ───────────────────────────────────────────────────────────────────

export type Role =
  | "COLLABORATEUR"
  | "RESPONSABLE"
  | "EXPERT_COMPTABLE"
  | "ADMIN";
export type TypeEntite = "PERSONNE_PHYSIQUE" | "PERSONNE_MORALE";
export type StatutKanban =
  | "PRISE_CONTACT"
  | "DECOUVERTE"
  | "OPPORTUNITE"
  | "LAB"
  | "PREPARATION"
  | "CONVERTI"
  | "REFUSE";
export type StatutClient = "ACTIF" | "INACTIF" | "RESILIE";
export type StatutKyc = "INCOMPLET" | "COMPLET" | "VALIDE" | "EXPIRE";
export type ScreeningStatut = "NON_EFFECTUE" | "OK" | "ALERTE";
export type NiveauRisque = "FAIBLE" | "MOYEN" | "ELEVE";
export type TypeDocument =
  | "PIECE_IDENTITE"
  | "JUSTIFICATIF_DOMICILE"
  | "KBIS"
  | "STATUTS"
  | "LISTE_UBO"
  | "ATTESTATION_PPE"
  | "JUSTIFICATIF_FONDS"
  | "LETTRE_MISSION"
  | "RAPPORT"
  | "ANNEXE"
  | "AUTRE";
export type TypeMission =
  | "COMPTABILITE"
  | "AUDIT"
  | "CONSEIL"
  | "JURIDIQUE"
  | "AUTRE";
export type StatutMission = "EN_COURS" | "SUSPENDUE" | "TERMINEE" | "RESILIEE";
export type TypeObligation =
  | "KYC_VERIFICATION"
  | "EVALUATION_RISQUE"
  | "MISE_A_JOUR_DOCS"
  | "VALIDATION_RELATION"
  | "LETTRE_MISSION";
export type StatutObligation = "A_FAIRE" | "FAIT" | "EN_RETARD" | "EXPIRE";
export type TypeOperationSensible =
  | "SANS_JUSTIFICATION"
  | "COMPLEXE"
  | "SANS_OBJET_LICITE"
  | "INHABITUELLE"
  | "ECONOMIE_VIRTUELLE"
  | "ESPECES"
  | "AUTRE";
export type StatutOperationSensible =
  | "SIGNALEE"
  | "EN_ANALYSE"
  | "CLASSEE"
  | "TRACFIN_DECLARE";
export type TypeContact =
  | "INTERVENANT"
  | "AVOCAT"
  | "COMMISSAIRE_COMPTES"
  | "NOTAIRE"
  | "AUTRE";
export type StatutQuestionnaire = "EN_COURS" | "VALIDE" | "REFUSE";
export type TypePlanningEtape = "REGLEMENTAIRE" | "MANUELLE";
export type StatutPlanningEtape = "A_FAIRE" | "EN_COURS" | "FAIT" | "ANNULEE";

// ─── Entités ──────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  prenom: string;
  nom: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface Prospect {
  id: string;
  ref: string;
  siret?: string | null;
  nom: string;
  email?: string | null;
  telephone?: string | null;
  typeEntite: TypeEntite;
  formeJuridique?: string | null;
  representantLegal?: string | null;
  statutKanban: StatutKanban;
  motifRefus?: string | null;
  activite?: string | null;
  codeNaf?: string | null;
  adresse?: string | null;
  ville?: string | null;
  codePostal?: string | null;
  pays: string;
  chiffreAffaires?: number | null;
  effectif?: number | null;
  notes?: string | null;
  createdBy?: User;
  assignedTo?: User | null;
  questionnaire?: QuestionnaireAcceptation | null;
  client?: Client | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionnaireAcceptation {
  id: string;
  prospect: Prospect;
  statut: StatutQuestionnaire;
  reponses?: Record<string, unknown> | null;
  motifRefus?: string | null;
  validatedAt?: string | null;
  validatedBy?: User | null;
  createdBy: User;
  createdAt: string;
}

export interface Client {
  id: string;
  ref: string;
  siret?: string | null;
  siren?: string | null;
  raisonSociale: string;
  typeEntite: TypeEntite;
  formeJuridique?: string | null;
  representantLegal?: string | null;
  codeNaf?: string | null;
  activitePrincipale?: string | null;
  dateCreationEntreprise?: string | null;
  adresseSiege?: string | null;
  ville?: string | null;
  codePostal?: string | null;
  pays: string;
  chiffreAffaires?: number | null;
  effectif?: number | null;
  natureMission?: string | null;
  statut: StatutClient;
  // KYC fusionné
  kycStatut: StatutKyc;
  ppe: boolean;
  ppeDetail?: string | null;
  uboSaisi: boolean;
  screeningStatut: ScreeningStatut;
  screeningDate?: string | null;
  kycCompletedAt?: string | null;
  kycValidatedBy?: User | null;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface BeneficiaireEffectif {
  id: string;
  prenom?: string | null;
  nom: string;
  dateNaissance?: string | null;
  nationalite?: string | null;
  adresse?: string | null;
  pourcentageDetention: number;
  ppe: boolean;
  createdAt: string;
}

export interface Contact {
  id: string;
  prenom?: string | null;
  nom: string;
  email?: string | null;
  telephone?: string | null;
  type: TypeContact;
  roleDetail?: string | null;
  createdAt: string;
}

// NB: le backend n'a pas (encore) les champs `type`/`s3Key`/`expiresAt`
// envisagés dans workflow-frontend.md — ce type reflète l'entité réelle.
export interface Document {
  id: string;
  nomFichier: string;
  cheminStockage: string;
  typeMime: string;
  taille: number;
  createdAt: string;
}

export interface ScoreRisque {
  id: string;
  score: number;
  niveau: NiveauRisque;
  reponses: {
    clientCaracteristiques: number;
    activiteSecteur: number;
    zoneGeographique: number;
    typeMission: number;
  };
  calculatedBy?: User;
  createdAt: string;
}

export interface Mission {
  id: string;
  type: TypeMission;
  description?: string | null;
  statut: StatutMission;
  dateDebut: string;
  dateFin?: string | null;
  honoraires?: number | null;
  createdBy?: User;
  lettresMission?: LettreMission[];
  createdAt: string;
  updatedAt: string;
}

export interface LettreMission {
  id: string;
  version: number;
  contenu: Record<string, unknown>;
  signeeParExpert: boolean;
  signeeAt?: string | null;
  signataire?: User | null;
  s3Key?: string | null;
  createdAt: string;
}

export interface PlanningEtape {
  id: string;
  titre: string;
  description?: string | null;
  type: TypePlanningEtape;
  statut: StatutPlanningEtape;
  dateEcheance?: string | null;
  completedAt?: string | null;
  completedBy?: User | null;
  assignedTo?: User | null;
  createdAt: string;
}

export interface Obligation {
  id: string;
  type: TypeObligation;
  statut: StatutObligation;
  dateEcheance?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

export interface OperationSensible {
  id: string;
  type: TypeOperationSensible;
  description: string;
  montant?: number | null;
  devise?: string | null;
  statut: StatutOperationSensible;
  tracfinDate?: string | null;
  validatedBy?: User | null;
  validatedAt?: string | null;
  signaleBy: User;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  ressource: string;
  ressourceId: string;
  utilisateur?: User;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: string;
}
