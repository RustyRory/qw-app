"use client";

import { useCallback, useEffect, useState } from "react";
import {
  IconFolder,
  IconFolderOpen,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react";

import { apiFetch } from "@/lib/apiFetch";
import {
  accederDossierLocal,
  choisirDossierLocal,
  dossierLocalSupporte,
  etatDossierLocal,
  fichierLocalExiste,
  oublierDossierLocal,
  type EtatDossierLocal,
} from "@/lib/local-folder";
import { recupererDocumentLocal } from "@/lib/documents";
import { Button } from "@/components/ui/button";
import type { Document } from "@/types";

export function DossierLocalSection({ userId }: { userId: string }) {
  const [etat, setEtat] = useState<EtatDossierLocal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const supporte = dossierLocalSupporte();

  const rafraichir = useCallback(() => {
    etatDossierLocal(userId)
      .then(setEtat)
      .catch(() => setEtat({ nom: null, permission: null }));
  }, [userId]);

  useEffect(() => {
    rafraichir();
  }, [rafraichir]);

  async function handleChoisir() {
    setError(null);
    setInfo(null);
    try {
      const nom = await choisirDossierLocal(userId);
      setInfo(`Dossier « ${nom} » enregistré.`);
      rafraichir();
    } catch (err) {
      // L'utilisateur a fermé le sélecteur : pas une erreur.
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleAutoriser() {
    setError(null);
    try {
      await accederDossierLocal(userId, true);
      rafraichir();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleOublier() {
    if (!window.confirm("Ne plus utiliser ce dossier ?")) return;
    await oublierDossierLocal(userId);
    setInfo(null);
    rafraichir();
  }

  // Copie dans le dossier local tous les documents du serveur qui n'y sont
  // pas encore (échec d'écriture précédent, nouveau PC, conversion…).
  async function handleSynchroniser() {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const dossier = await accederDossierLocal(userId, true);
      const docs = await apiFetch<Document[]>("/documents");
      let copies = 0;
      for (const doc of docs) {
        if (!doc.cheminRelatif) continue;
        if (await fichierLocalExiste(dossier, doc.cheminRelatif)) continue;
        await recupererDocumentLocal(userId, doc, false);
        copies++;
      }
      setInfo(
        copies === 0
          ? "Votre dossier est déjà à jour."
          : `${copies} document${copies > 1 ? "s" : ""} copié${copies > 1 ? "s" : ""} dans votre dossier.`,
      );
      rafraichir();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-1 flex items-center gap-2">
        <IconFolder className="size-4 text-slate-400" />
        <p className="text-sm font-bold text-slate-900">Dossier de stockage</p>
      </div>
      <p className="mb-4 text-xs leading-5 text-slate-500">
        Les documents déposés et les lettres de mission sont enregistrés dans ce
        dossier de votre ordinateur, rangés en <code>Clients/</code> et{" "}
        <code>Prospects/</code> (une copie est aussi conservée sur le serveur).
        Choisissez par exemple un dossier nommé <strong>qw-app</strong>.
      </p>

      {!supporte && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Votre navigateur ne permet pas de choisir un dossier. Utilisez
          Microsoft Edge ou Google Chrome pour déposer des documents.
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {info && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {info}
        </div>
      )}

      {supporte && etat && (
        <>
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <IconFolderOpen className="size-5 shrink-0 text-indigo-600" />
            {etat.nom ? (
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-800">
                  {etat.nom}
                </p>
                <p className="text-xs text-slate-500">
                  {etat.permission === "granted"
                    ? "Accès autorisé"
                    : "Autorisation à confirmer (le navigateur vous la redemandera)"}
                </p>
              </div>
            ) : (
              <p className="text-slate-500">Aucun dossier choisi</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleChoisir} className="rounded-xl">
              <IconFolder className="size-4" />
              {etat.nom ? "Changer de dossier" : "Choisir un dossier"}
            </Button>
            {etat.nom && etat.permission !== "granted" && (
              <Button
                variant="outline"
                onClick={handleAutoriser}
                className="rounded-xl"
              >
                Autoriser l’accès
              </Button>
            )}
            {etat.nom && (
              <Button
                variant="outline"
                onClick={handleSynchroniser}
                disabled={busy}
                className="rounded-xl"
              >
                <IconRefresh className="size-4" />
                {busy ? "Synchronisation…" : "Synchroniser"}
              </Button>
            )}
            {etat.nom && (
              <Button
                variant="outline"
                onClick={handleOublier}
                className="rounded-xl text-red-600 hover:text-red-700"
              >
                <IconTrash className="size-4" />
                Oublier
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
