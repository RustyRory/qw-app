export const STATUS_LABEL: Record<string, string> = {
  // Prospect — pipeline Kanban
  PRISE_CONTACT: "Prise de contact",
  DECOUVERTE: "Découverte",
  OPPORTUNITE: "Opportunité",
  LAB: "LAB à effectuer",
  PREPARATION: "Préparation client",
  CONVERTI: "Converti",
  REFUSE: "Refusé",
  // Client
  ACTIF: "Actif",
  INACTIF: "Inactif",
  RESILIE: "Résilié",
  // KYC / screening
  INCOMPLET: "Incomplet",
  COMPLET: "Complet",
  VALIDE: "Validé",
  EXPIRE: "Expiré",
  NON_EFFECTUE: "Non effectué",
  OK: "OK",
  ALERTE: "Alerte",
  // Questionnaire
  EN_COURS: "En cours",
  // Mission
  SUSPENDUE: "Suspendue",
  TERMINEE: "Terminée",
  RESILIEE: "Résiliée",
  // Obligation / planning
  A_FAIRE: "À faire",
  FAIT: "Fait",
  EN_RETARD: "En retard",
  ANNULEE: "Annulée",
  // Opération sensible
  SIGNALEE: "Signalée",
  EN_ANALYSE: "En analyse",
  CLASSEE: "Classée",
  TRACFIN_DECLARE: "TRACFIN déclaré",
};

export const STATUS_CLASS: Record<string, string> = {
  PRISE_CONTACT: "bg-blue-100 text-blue-800",
  DECOUVERTE: "bg-blue-100 text-blue-800",
  OPPORTUNITE: "bg-indigo-100 text-indigo-800",
  LAB: "bg-purple-100 text-purple-800",
  PREPARATION: "bg-purple-100 text-purple-800",
  CONVERTI: "bg-green-100 text-green-800",
  REFUSE: "bg-red-100 text-red-800",
  ACTIF: "bg-green-100 text-green-800",
  INACTIF: "bg-muted text-muted-foreground",
  RESILIE: "bg-red-100 text-red-800",
  INCOMPLET: "bg-yellow-100 text-yellow-800",
  COMPLET: "bg-blue-100 text-blue-800",
  VALIDE: "bg-green-100 text-green-800",
  EXPIRE: "bg-red-100 text-red-800",
  NON_EFFECTUE: "bg-muted text-muted-foreground",
  OK: "bg-green-100 text-green-800",
  ALERTE: "bg-red-100 text-red-800",
  EN_COURS: "bg-yellow-100 text-yellow-800",
  SUSPENDUE: "bg-orange-100 text-orange-800",
  TERMINEE: "bg-muted text-muted-foreground",
  RESILIEE: "bg-red-100 text-red-800",
  A_FAIRE: "bg-muted text-muted-foreground",
  FAIT: "bg-green-100 text-green-800",
  EN_RETARD: "bg-red-100 text-red-800",
  ANNULEE: "bg-muted text-muted-foreground",
  SIGNALEE: "bg-yellow-100 text-yellow-800",
  EN_ANALYSE: "bg-orange-100 text-orange-800",
  CLASSEE: "bg-green-100 text-green-800",
  TRACFIN_DECLARE: "bg-red-100 text-red-800",
};

export const RISK_LABEL: Record<string, string> = {
  FAIBLE: "Faible",
  MOYEN: "Moyen",
  ELEVE: "Élevé",
};

export const RISK_CLASS: Record<string, string> = {
  FAIBLE: "bg-green-100 text-green-800",
  MOYEN: "bg-yellow-100 text-yellow-800",
  ELEVE: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function RiskBadge({ level }: { level: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${RISK_CLASS[level] ?? "bg-muted text-muted-foreground"}`}
    >
      {RISK_LABEL[level] ?? level}
    </span>
  );
}

export function KycBadge({ status }: { status: string }) {
  return <StatusBadge status={status} />;
}
