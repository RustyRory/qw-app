// ─── Enums ───────────────────────────────────────────────────────────────────

export type Role =
  | "COLLABORATEUR"
  | "RESPONSABLE"
  | "EXPERT_COMPTABLE"
  | "ADMIN"
  | "MODERATEUR";
export type TypeEntite = "PERSONNE_PHYSIQUE" | "PERSONNE_MORALE";
export type StatutKanban =
  | "PRISE_CONTACT"
  | "PREPARATION_LAB"
  | "VALIDATION_LAB"
  | "REFUSE"
  | "LM_A_FAIRE"
  | "LM_ENVOYEE"
  | "CONVERTI";
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
  | "LETTRE_MISSION"
  | "VALIDATION_LETTRE_MISSION"
  | "SIGNATURE_LETTRE_MISSION";
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

export interface MonProfil {
  id: string;
  email: string;
  prenom: string;
  nom: string;
  role: Role;
  signatureDataUri: string | null;
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
  capitalSocial?: number | null;
  regimeFiscal?: string | null;
  regimeTva?: string | null;
  tvaIntracommunautaire?: string | null;
  existenceSalaries?: boolean | null;
  conventionCollective?: string | null;
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
  email?: string | null;
  telephone?: string | null;
  codeNaf?: string | null;
  activitePrincipale?: string | null;
  dateCreationEntreprise?: string | null;
  sireneUpdatedAt?: string | null;
  adresseSiege?: string | null;
  ville?: string | null;
  codePostal?: string | null;
  pays: string;
  chiffreAffaires?: number | null;
  effectif?: number | null;
  natureMission?: string | null;
  notes?: string | null;
  capitalSocial?: number | null;
  regimeFiscal?: string | null;
  regimeTva?: string | null;
  tvaIntracommunautaire?: string | null;
  existenceSalaries?: boolean | null;
  conventionCollective?: string | null;
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
  // Prospect d'origine si ce client a été créé par conversion — permet de
  // retrouver le questionnaire d'acceptation rempli avant l'entrée en relation.
  prospect?: { id: string; ref: string } | null;
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

export interface Document {
  id: string;
  type: TypeDocument;
  nomFichier: string;
  cheminStockage: string;
  typeMime: string;
  taille: number;
  createdAt: string;
  contact?: { id: string } | null;
  mission?: { id: string } | null;
  planningEtape?: { id: string } | null;
  operationSensible?: { id: string } | null;
}

export interface AutoScoreCritere {
  code: string;
  label: string;
  poids: number;
  declenche: boolean;
}

export interface AutoScoreReponses {
  criteres: AutoScoreCritere[];
}

export interface ScoreRisque {
  id: string;
  score: number;
  niveau: NiveauRisque;
  // Calculé automatiquement, client comme prospect (voir ScoringService
  // recalculateForClient/recalculateForProspect côté backend) — /100.
  reponses: AutoScoreReponses;
  calculatedBy?: User;
  createdAt: string;
}

export type AssignationTache = "CABINET" | "CLIENT" | "NA";

export interface RepartitionTravauxAssignation {
  id: string;
  assignation: AssignationTache;
}

export interface RepartitionTravauxLigneCatalogue {
  id: string;
  tache: string;
  defaut: AssignationTache;
}

export interface RepartitionTravauxCategorie {
  titre: string;
  lignes: RepartitionTravauxLigneCatalogue[];
}

export interface Mission {
  id: string;
  type: TypeMission;
  description?: string | null;
  statut: StatutMission;
  dateDebut: string;
  dateFin?: string | null;
  honoraires?: number | null;
  repartitionTravaux?: RepartitionTravauxAssignation[] | null;
  createdBy?: User;
  lettresMission?: LettreMission[];
  createdAt: string;
  updatedAt: string;
}

export type DocusignStatutEnvelope =
  | "ENVOYE"
  | "LIVRE"
  | "SIGNE"
  | "REFUSE"
  | "ANNULE";

export interface LettreMission {
  id: string;
  version: number;
  contenu: Record<string, unknown>;
  valideeParResponsable: boolean;
  valideeAt?: string | null;
  valideePar?: User | null;
  signeeParExpert: boolean;
  signeeAt?: string | null;
  signataire?: User | null;
  cheminStockage?: string | null;
  signeeParClientAt?: string | null;
  docusignEnvelopeId?: string | null;
  docusignStatut?: DocusignStatutEnvelope | null;
  docusignDestinataireEmail?: string | null;
  docusignDestinataireNom?: string | null;
  docusignEnvoyeAt?: string | null;
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
  client?: Pick<Client, "id" | "ref" | "raisonSociale"> | null;
  prospect?: Pick<Prospect, "id" | "ref" | "nom"> | null;
}

export interface Obligation {
  id: string;
  type: TypeObligation;
  statut: StatutObligation;
  dateEcheance?: string | null;
  completedAt?: string | null;
  createdAt: string;
  client?: Pick<Client, "id" | "ref" | "raisonSociale"> | null;
  prospect?: Pick<Prospect, "id" | "ref" | "nom"> | null;
}

export type SourceEcheance = "OBLIGATION" | "PLANNING" | "MISSION";

export interface EcheanceCalendrier {
  id: string;
  source: SourceEcheance;
  titre: string;
  type: string;
  statut: string;
  dateEcheance: string | null;
  client?: {
    id: string;
    ref: string;
    raisonSociale: string;
  };
  prospect?: {
    id: string;
    ref: string;
    nom: string;
  };
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

export interface Notification {
  id: string;
  titre: string;
  message?: string | null;
  lien?: string | null;
  lu: boolean;
  luAt?: string | null;
  createdAt: string;
}
