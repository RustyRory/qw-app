"use client";

import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/types";

export function useRole() {
  const { role, ready } = useAuth();

  return {
    ready,
    role,
    isAdmin:       role === "ADMIN",
    isResponsable: (["RESPONSABLE", "EXPERT_COMPTABLE", "ADMIN"] as Role[]).includes(role!),
    isExpert:      (["EXPERT_COMPTABLE", "ADMIN"] as Role[]).includes(role!),
    can: {
      validerQuestionnaire: (["RESPONSABLE", "EXPERT_COMPTABLE", "ADMIN"] as Role[]).includes(role!),
      convertirProspect:    (["RESPONSABLE", "EXPERT_COMPTABLE", "ADMIN"] as Role[]).includes(role!),
      signerLettre:         (["EXPERT_COMPTABLE", "ADMIN"] as Role[]).includes(role!),
      gererUtilisateurs:    role === "ADMIN",
      supprimerDossier:     role === "ADMIN",
      voirCartographie:     (["RESPONSABLE", "EXPERT_COMPTABLE", "ADMIN"] as Role[]).includes(role!),
    },
  };
}