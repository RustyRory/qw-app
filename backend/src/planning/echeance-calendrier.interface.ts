export type SourceEcheance = 'OBLIGATION' | 'PLANNING' | 'MISSION';

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
