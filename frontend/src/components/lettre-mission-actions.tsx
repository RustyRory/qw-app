"use client";

import { useState } from "react";
import {
  IconCheck,
  IconDownload,
  IconEye,
  IconSignature,
  IconUpload,
} from "@tabler/icons-react";

import { apiFetch, downloadFile, fetchBlobUrl } from "@/lib/apiFetch";
import { accederDossierLocal, ecrireFichierLocal } from "@/lib/local-folder";
import { useRole } from "@/hooks/useRole";
import type { Document, LettreMission } from "@/types";

function formatDate(iso?: string | null) {
  return iso ? new Date(iso).toLocaleDateString("fr-FR") : "";
}

function nomFichier(l: LettreMission) {
  return l.cheminRelatif?.split("/").pop() ?? `LettreMission-v${l.version}.pdf`;
}

// Enregistre un fichier du serveur dans le dossier local de l'utilisateur.
async function copierEnLocal(
  userId: string,
  urlApi: string,
  cheminRelatif: string,
) {
  const dossier = await accederDossierLocal(userId, true);
  const url = await fetchBlobUrl(urlApi);
  try {
    const blob = await (await fetch(url)).blob();
    await ecrireFichierLocal(dossier, cheminRelatif, blob);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Circuit d'une lettre de mission (dernière version) : valider → signer
// (EC) → télécharger et envoyer au client → déposer le PDF signé par le
// client (EC). Les versions précédentes (avenants) restent téléchargeables.
export function LettreMissionActions({
  lettres,
  onChange,
  onPreview,
}: {
  lettres: LettreMission[];
  onChange: () => void;
  onPreview?: (lettreId: string) => void;
}) {
  const { can, userId } = useRole();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const versions = [...lettres].sort((a, b) => b.version - a.version);
  const l = versions[0];
  if (!l) {
    return (
      <p className="text-xs text-slate-400">
        Lettre de mission en préparation…
      </p>
    );
  }

  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await fn();
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const valider = () =>
    action(async () => {
      await apiFetch(`/lettres-mission/${l.id}/valider`, { method: "PATCH" });
    });

  const signer = () =>
    action(async () => {
      const signee = await apiFetch<LettreMission>(
        `/lettres-mission/${l.id}/signer`,
        { method: "PATCH" },
      );
      if (userId && signee.cheminRelatif) {
        try {
          await copierEnLocal(
            userId,
            `/lettres-mission/${l.id}/download`,
            signee.cheminRelatif,
          );
          setInfo(
            "Lettre signée et enregistrée dans votre dossier : téléchargez-la pour l’envoyer au client.",
          );
        } catch {
          setInfo(
            "Lettre signée. Elle n’a pas pu être copiée dans votre dossier local (voir Mon profil › Synchroniser).",
          );
        }
      }
    });

  const deposerSignatureClient = (file: File) =>
    action(async () => {
      const body = new FormData();
      body.append("file", file);
      const { document } = await apiFetch<{
        lettre: LettreMission;
        document: Document;
      }>(`/lettres-mission/${l.id}/signature-client`, {
        method: "POST",
        body,
      });
      if (userId && document.cheminRelatif) {
        try {
          const dossier = await accederDossierLocal(userId, true);
          await ecrireFichierLocal(dossier, document.cheminRelatif, file);
        } catch {
          setInfo(
            "Signature enregistrée. Le PDF n’a pas pu être copié dans votre dossier local (voir Mon profil › Synchroniser).",
          );
        }
      }
    });

  const statut = l.signeeParClientAt
    ? {
        texte: `Signée par le client le ${formatDate(l.signeeParClientAt)}`,
        cls: "text-emerald-700",
      }
    : l.signeeParExpert
      ? {
          texte: "Signée par l’expert-comptable — à envoyer au client",
          cls: "text-indigo-700",
        }
      : l.valideeParResponsable
        ? {
            texte: "Validée — à signer par l’expert-comptable",
            cls: "text-blue-700",
          }
        : { texte: "À valider", cls: "text-amber-700" };

  return (
    <div className="space-y-2">
      <p className={`text-xs font-semibold ${statut.cls}`}>
        {l.version > 1 ? `Avenant v${l.version} · ` : ""}
        {statut.texte}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {onPreview && (
          <button
            type="button"
            onClick={() => onPreview(l.id)}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            <IconEye className="size-3.5" /> Aperçu
          </button>
        )}
        {l.signeeParExpert && (
          <button
            type="button"
            onClick={() =>
              downloadFile(`/lettres-mission/${l.id}/download`, nomFichier(l))
            }
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            <IconDownload className="size-3.5" /> Télécharger (à envoyer)
          </button>
        )}
        {can.validerLettreMission && !l.valideeParResponsable && (
          <button
            type="button"
            disabled={busy}
            onClick={valider}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            <IconCheck className="size-3.5" /> Valider
          </button>
        )}
        {can.signerLettre && l.valideeParResponsable && !l.signeeParExpert && (
          <button
            type="button"
            disabled={busy}
            onClick={signer}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800 disabled:opacity-50"
          >
            <IconSignature className="size-3.5" /> Signer
          </button>
        )}
        {can.signerLettre && l.signeeParExpert && !l.signeeParClientAt && (
          <label className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-violet-700 hover:text-violet-900">
            <IconUpload className="size-3.5" />
            {busy ? "Envoi…" : "Déposer la LM signée par le client"}
            <input
              type="file"
              accept=".pdf"
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) deposerSignatureClient(file);
              }}
            />
          </label>
        )}
        {l.documentSigneClient && (
          <button
            type="button"
            onClick={() =>
              downloadFile(
                `/documents/${l.documentSigneClient!.id}/download`,
                l.documentSigneClient!.nomFichier,
              )
            }
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900"
          >
            <IconDownload className="size-3.5" /> Exemplaire signé client
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      {info && <p className="text-xs text-emerald-700">{info}</p>}

      {versions.length > 1 && (
        <details className="text-xs text-slate-500">
          <summary className="cursor-pointer">Versions précédentes</summary>
          <ul className="mt-1 space-y-1 pl-3">
            {versions.slice(1).map((v) => (
              <li key={v.id} className="flex items-center gap-2">
                v{v.version}
                {v.signeeAt && ` · signée le ${formatDate(v.signeeAt)}`}
                {v.signeeParExpert && (
                  <button
                    type="button"
                    onClick={() =>
                      downloadFile(
                        `/lettres-mission/${v.id}/download`,
                        nomFichier(v),
                      )
                    }
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Télécharger
                  </button>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
