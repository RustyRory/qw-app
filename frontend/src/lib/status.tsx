export const STATUS_LABEL: Record<string, string> = {
  pending: "En cours",
  approved: "Validé",
  rejected: "Rejeté",
  en_cours: "En cours",
  valide: "Validé",
  rejete: "Rejeté",
};

export const STATUS_CLASS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  en_cours: "bg-yellow-100 text-yellow-800",
  valide: "bg-green-100 text-green-800",
  rejete: "bg-red-100 text-red-800",
};

export const RISK_LABEL: Record<string, string> = {
  low: "Faible",
  medium: "Moyen",
  high: "Élevé",
  faible: "Faible",
  moyen: "Moyen",
  eleve: "Élevé",
};

export const RISK_CLASS: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
  faible: "bg-green-100 text-green-800",
  moyen: "bg-yellow-100 text-yellow-800",
  eleve: "bg-red-100 text-red-800",
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
