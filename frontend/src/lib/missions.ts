import type {
  RepartitionTravauxAssignation,
  RepartitionTravauxCategorie,
  TypeMission,
} from "@/types";

// Miroir de backend/src/common/types-mission.ts (libellés d'affichage).
export const MISSION_TYPE_LABELS: Record<TypeMission, string> = {
  TENUE_COMPTABLE: "Tenue comptable",
  COMPTES_ANNUELS: "Comptes annuels",
  SOCIAL_PAIE: "Social / Paie",
  FISCAL: "Fiscal",
  JURIDIQUE: "Juridique",
  CONSEIL: "Conseil",
  AUDIT_EXAMEN: "Audit / Examen",
  AUTRE: "Autre",
};

export type RepartitionEtat = Record<
  string,
  { cabinet: boolean; client: boolean }
>;

// État initial de l'éditeur : valeurs enregistrées, sinon défauts du
// catalogue.
export function repartitionInitiale(
  catalogue: RepartitionTravauxCategorie[],
  existante?: RepartitionTravauxAssignation[] | null,
): RepartitionEtat {
  const etat: RepartitionEtat = {};
  for (const cat of catalogue) {
    for (const ligne of cat.lignes) {
      const a = existante?.find((x) => x.id === ligne.id);
      etat[ligne.id] = a
        ? { cabinet: !!a.cabinet, client: !!a.client }
        : {
            cabinet: ligne.defaut === "CABINET",
            client: ligne.defaut === "CLIENT",
          };
    }
  }
  return etat;
}

export function repartitionVersApi(
  etat: RepartitionEtat,
): RepartitionTravauxAssignation[] {
  return Object.entries(etat).map(([id, v]) => ({ id, ...v }));
}
