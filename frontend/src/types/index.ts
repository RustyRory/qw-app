export type UserRole =
  | "admin"
  | "responsable"
  | "collaborateur"
  | "expert-comptable";

export interface User {
  id: string;
  email: string;
  prenom: string;
  nom: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export type ClientStatut = "en_cours" | "valide" | "rejete";

export interface Client {
  id: string;
  reference: string;
  prenom: string;
  nom: string;
  raisonSociale?: string | null;
  email?: string | null;
  telephone?: string | null;
  statut: ClientStatut;
  createdAt: string;
  updatedAt: string;
}

export type RiskNiveau = "faible" | "moyen" | "eleve";

export interface RiskScore {
  id: string;
  client?: Client;
  score: number;
  niveau: RiskNiveau;
  details?: Record<string, unknown> | null;
  calculatedAt: string;
}

export interface KycData {
  id?: string;
  nationalite?: string | null;
  paysResidence?: string | null;
  secteurActivite?: string | null;
  formeJuridique?: string | null;
  estPep?: boolean;
  paysHautRisque?: boolean;
  chiffreAffaires?: number | null;
}

export interface ClientDocument {
  id: string;
  nomFichier: string;
  cheminStockage: string;
  typeMime: string;
  taille: number;
  createdAt: string;
}

export type ProspectStatut = "nouveau" | "en_analyse" | "converti" | "rejete";

export interface Prospect {
  id: string;
  prenom: string;
  nom: string;
  raisonSociale?: string | null;
  email?: string | null;
  telephone?: string | null;
  secteurActivite?: string | null;
  paysResidence?: string | null;
  estPep: boolean;
  notes?: string | null;
  statut: ProspectStatut;
  clientId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entiteType: string;
  entiteId: string;
  utilisateur?: User;
  details?: Record<string, unknown> | null;
  createdAt: string;
}
