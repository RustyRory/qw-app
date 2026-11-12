"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { useRole } from "@/hooks/useRole";
import type { OperationSensible } from "@/types";

// Circuit d'une opération sensible : signalée → en analyse (responsable,
// EC, admin) → classée sans suite (motif obligatoire) ou déclarée à
// TRACFIN (EC, admin).
export function OperationActions({
  operation,
  onDone,
}: {
  operation: OperationSensible;
  onDone: () => void;
}) {
  const { role } = useRole();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const peutAnalyser =
    role === "RESPONSABLE" || role === "EXPERT_COMPTABLE" || role === "ADMIN";
  const peutDecider = role === "EXPERT_COMPTABLE" || role === "ADMIN";

  async function action(chemin: string, body?: unknown) {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/operations-sensibles/${operation.id}/${chemin}`, {
        method: "PATCH",
        body: body ? JSON.stringify(body) : undefined,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function classer() {
    const motif = window.prompt("Motif du classement sans suite :");
    if (motif?.trim()) action("classer", { motif: motif.trim() });
  }

  function tracfin() {
    const date = window.prompt(
      "Date de la déclaration TRACFIN (AAAA-MM-JJ) :",
      new Date().toISOString().slice(0, 10),
    );
    if (date) action("tracfin", { date });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {operation.statut === "SIGNALEE" && peutAnalyser && (
        <button
          type="button"
          disabled={busy}
          onClick={() => action("analyser")}
          className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 disabled:opacity-50"
        >
          Prendre en analyse
        </button>
      )}
      {operation.statut === "EN_ANALYSE" && peutDecider && (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={classer}
            className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 disabled:opacity-50"
          >
            Classer sans suite
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={tracfin}
            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50"
          >
            Déclarer TRACFIN
          </button>
        </>
      )}
      {operation.statut === "EN_ANALYSE" && !peutDecider && (
        <span className="text-xs text-slate-500">
          En analyse — décision de l’expert-comptable
        </span>
      )}
      {operation.motifClassement && (
        <span className="text-xs text-slate-500">
          Classée : {operation.motifClassement}
        </span>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
