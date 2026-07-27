"use client";

import { useEffect, useState } from "react";
import {
  IconDeviceFloppy,
  IconSignature,
  IconTrash,
} from "@tabler/icons-react";

import { apiFetch } from "@/lib/apiFetch";
import { SignaturePad } from "@/components/signature-pad";
import type { MonProfil } from "@/types";

export default function ProfilPage() {
  const [profil, setProfil] = useState<MonProfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<MonProfil>("/users/me")
      .then(setProfil)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!draft) {
      setError("Dessinez votre signature avant d’enregistrer.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await apiFetch<{ signatureDataUri: string | null }>(
        "/users/me/signature",
        {
          method: "PATCH",
          body: JSON.stringify({ signatureDataUri: draft }),
        },
      );
      setProfil((prev) =>
        prev ? { ...prev, signatureDataUri: res.signatureDataUri } : prev,
      );
      setDraft(null);
      setSuccess("Signature enregistrée.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d’enregistrer la signature.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Supprimer votre signature enregistrée ?")) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch("/users/me/signature", {
        method: "PATCH",
        body: JSON.stringify({ signatureDataUri: null }),
      });
      setProfil((prev) => (prev ? { ...prev, signatureDataUri: null } : prev));
      setSuccess("Signature supprimée.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer la signature.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 pb-20 sm:p-6 md:p-8 md:pb-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 to-violet-700 px-5 py-6 shadow-lg sm:px-7 sm:py-8">
          <div className="pointer-events-none absolute -right-14 -top-14 size-52 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white">
              <IconSignature className="size-6" />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-100">
                Mon profil
              </p>
              <h1 className="text-xl font-bold text-white sm:text-2xl">
                Ma signature électronique
              </h1>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
            Chargement…
          </div>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            {profil && (
              <p className="mb-1 text-sm font-semibold text-slate-800">
                {profil.prenom} {profil.nom}
              </p>
            )}
            {profil && (
              <p className="mb-4 text-xs text-slate-500">{profil.email}</p>
            )}

            <p className="mb-4 text-xs leading-5 text-slate-500">
              Cette signature sera utilisée automatiquement sur les lettres de
              mission que vous signez. Dessinez-la avec la souris ou le doigt.
            </p>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                {success}
              </div>
            )}

            {profil?.signatureDataUri && (
              <div className="mb-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Signature enregistrée
                </p>
                <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={profil.signatureDataUri}
                    alt="Signature actuelle"
                    className="h-16 max-w-[240px] object-contain"
                  />
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleDelete}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
                  >
                    <IconTrash className="size-4" />
                    Supprimer
                  </button>
                </div>
              </div>
            )}

            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {profil?.signatureDataUri
                ? "Remplacer la signature"
                : "Dessiner ma signature"}
            </p>
            <SignaturePad onChange={setDraft} />

            <button
              type="button"
              disabled={saving || !draft}
              onClick={handleSave}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-800 disabled:opacity-50"
            >
              <IconDeviceFloppy className="size-4" />
              {saving ? "Enregistrement…" : "Enregistrer la signature"}
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
