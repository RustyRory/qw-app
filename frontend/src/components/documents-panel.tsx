"use client";

import { useCallback, useEffect, useState } from "react";
import { IconDownload, IconTrash, IconUpload } from "@tabler/icons-react";

import { apiFetch, downloadFile } from "@/lib/apiFetch";
import {
  DOCUMENT_ACCEPT,
  DOCUMENT_TYPE_LABELS,
  deposerDocument,
  type CibleDocument,
} from "@/lib/documents";
import { useRole } from "@/hooks/useRole";
import type { Document, TypeDocument } from "@/types";

const ROLES_SUPPRESSION = ["RESPONSABLE", "EXPERT_COMPTABLE", "ADMIN"];

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR");
}

// Liste + dépôt des documents d'un client ou d'un prospect (dossier local
// + copie serveur, cf. lib/documents.ts).
export function DocumentsPanel({
  cible,
  cibleId,
  lectureSeule = false,
}: {
  cible: CibleDocument;
  cibleId: string;
  lectureSeule?: boolean;
}) {
  const { userId, role } = useRole();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<TypeDocument>("KBIS");
  const [expiration, setExpiration] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<Document[]>(`/documents/${cible}/${cibleId}`)
      .then(setDocs)
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [cible, cibleId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !userId) return;
    setUploading(true);
    setError(null);
    try {
      await deposerDocument({
        userId,
        cible,
        cibleId,
        file,
        type,
        dateExpiration: expiration || null,
      });
      setExpiration("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      load();
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(doc: Document) {
    if (!window.confirm(`Supprimer « ${doc.nomFichier} » ?`)) return;
    setError(null);
    try {
      await apiFetch(`/documents/${doc.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const peutSupprimer = (doc: Document) =>
    !lectureSeule &&
    (doc.utilisateur?.id === userId || ROLES_SUPPRESSION.includes(role ?? ""));

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Documents
        </p>
        {!lectureSeule && (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TypeDocument)}
              disabled={uploading}
              aria-label="Type de document"
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700"
            >
              {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={expiration}
              onChange={(e) => setExpiration(e.target.value)}
              disabled={uploading}
              title="Valide jusqu’au (facultatif)"
              aria-label="Valide jusqu’au"
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700"
            />
            <label className="cursor-pointer">
              <input
                type="file"
                accept={DOCUMENT_ACCEPT}
                className="sr-only"
                onChange={handleUpload}
                disabled={uploading}
              />
              <span className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-900">
                <IconUpload className="size-3.5" />
                {uploading ? "Envoi…" : "Déposer"}
              </span>
            </label>
          </div>
        )}
      </div>

      {error && (
        <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-6 text-center text-sm text-slate-400">
          Chargement…
        </div>
      ) : docs.length === 0 ? (
        <div className="p-6 text-center text-sm text-slate-400">
          Aucun document
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {docs.map((doc) => {
            const expire =
              doc.dateExpiration && new Date(doc.dateExpiration) < new Date();
            return (
              <li
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800">
                    {doc.nomFichier}
                  </p>
                  <p className="text-xs text-slate-400">
                    {DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type} · déposé le{" "}
                    {formatDate(doc.createdAt)}
                    {doc.dateExpiration && (
                      <span
                        className={
                          expire ? "font-semibold text-red-600" : undefined
                        }
                      >
                        {" "}
                        · {expire ? "expiré le" : "valide jusqu’au"}{" "}
                        {formatDate(doc.dateExpiration)}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      downloadFile(
                        `/documents/${doc.id}/download`,
                        doc.nomFichier,
                      )
                    }
                    aria-label={`Télécharger ${doc.nomFichier}`}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  >
                    <IconDownload className="size-4" />
                  </button>
                  {peutSupprimer(doc) && (
                    <button
                      type="button"
                      onClick={() => handleDelete(doc)}
                      aria-label={`Supprimer ${doc.nomFichier}`}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                    >
                      <IconTrash className="size-4" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
