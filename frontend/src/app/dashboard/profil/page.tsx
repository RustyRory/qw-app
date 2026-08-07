"use client";

import { useEffect, useState } from "react";
import {
  IconDeviceFloppy,
  IconEye,
  IconEyeOff,
  IconLock,
  IconSignature,
  IconTrash,
  IconUserCog,
} from "@tabler/icons-react";

import { apiFetch } from "@/lib/apiFetch";
import { SignaturePad } from "@/components/signature-pad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import type { MonProfil } from "@/types";

const ROLE_LABELS: Record<string, string> = {
  COLLABORATEUR: "Collaborateur",
  RESPONSABLE: "Responsable",
  EXPERT_COMPTABLE: "Expert-comptable",
  ADMIN: "Administrateur",
  MODERATEUR: "Modérateur",
};

export default function ProfilPage() {
  const [profil, setProfil] = useState<MonProfil | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<MonProfil>("/users/me")
      .then(setProfil)
      .catch(() => setProfil(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-full bg-slate-50 p-4 pb-20 sm:p-6 md:p-8 md:pb-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 to-violet-700 px-5 py-6 shadow-lg sm:px-7 sm:py-8">
          <div className="pointer-events-none absolute -right-14 -top-14 size-52 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white">
              <IconUserCog className="size-6" />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-100">
                Mon compte
              </p>
              <h1 className="text-xl font-bold text-white sm:text-2xl">
                Paramètres
              </h1>
              {profil && (
                <p className="mt-1 text-sm text-indigo-100">
                  {ROLE_LABELS[profil.role] ?? profil.role}
                </p>
              )}
            </div>
          </div>
        </section>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
            Chargement…
          </div>
        ) : !profil ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            Impossible de charger votre profil.
          </div>
        ) : (
          <>
            <InfosSection profil={profil} onSaved={setProfil} />
            <PasswordSection />
            {/* Seul l'expert-comptable signe réellement une lettre de
                mission — la validation du responsable ne stampe jamais de
                signature sur le document, inutile de proposer la fonction. */}
            {(profil.role === "EXPERT_COMPTABLE" ||
              profil.role === "ADMIN") && (
              <SignatureSection profil={profil} onSaved={setProfil} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function InfosSection({
  profil,
  onSaved,
}: {
  profil: MonProfil;
  onSaved: (p: MonProfil) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const form = new FormData(e.currentTarget);

    try {
      const updated = await apiFetch<MonProfil>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          prenom: form.get("prenom") as string,
          nom: form.get("nom") as string,
          email: form.get("email") as string,
        }),
      });
      onSaved(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer vos informations.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <p className="mb-1 text-sm font-bold text-slate-900">Mes informations</p>
      <p className="mb-4 text-xs leading-5 text-slate-500">
        Nom, prénom et email utilisés pour votre compte.
      </p>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          Informations mises à jour.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FieldGroup>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="prenom">Prénom</FieldLabel>
              <Input
                id="prenom"
                name="prenom"
                defaultValue={profil.prenom}
                required
                className="rounded-xl"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="nom">Nom</FieldLabel>
              <Input
                id="nom"
                name="nom"
                defaultValue={profil.nom}
                required
                className="rounded-xl"
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={profil.email}
              required
              className="rounded-xl"
            />
          </Field>
        </FieldGroup>

        <Button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-indigo-700 font-semibold text-white hover:bg-indigo-800"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </form>
    </section>
  );
}

function PasswordSection() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const form = new FormData(e.currentTarget);
    const newPassword = form.get("newPassword") as string;
    const confirmPassword = form.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setSaving(true);
    try {
      await apiFetch("/users/me/password", {
        method: "PATCH",
        body: JSON.stringify({
          currentPassword: form.get("currentPassword") as string,
          newPassword,
        }),
      });
      setSuccess(true);
      (e.target as HTMLFormElement).reset();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de modifier le mot de passe.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <p className="mb-1 text-sm font-bold text-slate-900">Mot de passe</p>
      <p className="mb-4 text-xs leading-5 text-slate-500">
        Renseignez votre mot de passe actuel pour en définir un nouveau.
      </p>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          Mot de passe modifié.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="currentPassword">
              Mot de passe actuel
            </FieldLabel>
            <div className="relative">
              <IconLock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="currentPassword"
                name="currentPassword"
                type={showCurrent ? "text" : "password"}
                required
                className="rounded-xl pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                aria-label={
                  showCurrent
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showCurrent ? (
                  <IconEyeOff className="size-4" />
                ) : (
                  <IconEye className="size-4" />
                )}
              </button>
            </div>
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="newPassword">
                Nouveau mot de passe
              </FieldLabel>
              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showNew ? "text" : "password"}
                  minLength={6}
                  required
                  className="rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  aria-label={
                    showNew
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showNew ? (
                    <IconEyeOff className="size-4" />
                  ) : (
                    <IconEye className="size-4" />
                  )}
                </button>
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirmPassword">Confirmer</FieldLabel>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showNew ? "text" : "password"}
                minLength={6}
                required
                className="rounded-xl"
              />
            </Field>
          </div>
        </FieldGroup>

        <Button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-indigo-700 font-semibold text-white hover:bg-indigo-800"
        >
          {saving ? "Enregistrement…" : "Modifier le mot de passe"}
        </Button>
      </form>
    </section>
  );
}

function SignatureSection({
  profil,
  onSaved,
}: {
  profil: MonProfil;
  onSaved: (p: MonProfil) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      onSaved({ ...profil, signatureDataUri: res.signatureDataUri });
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
      onSaved({ ...profil, signatureDataUri: null });
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
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-1 flex items-center gap-2">
        <IconSignature className="size-4 text-slate-400" />
        <p className="text-sm font-bold text-slate-900">
          Signature électronique
        </p>
      </div>
      <p className="mb-4 text-xs leading-5 text-slate-500">
        Cette signature sera utilisée automatiquement sur les lettres de mission
        que vous signez. Dessinez-la avec la souris ou le doigt.
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

      {profil.signatureDataUri && (
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
        {profil.signatureDataUri
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
  );
}
