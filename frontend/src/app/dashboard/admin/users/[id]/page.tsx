"use client";

import { useCallback, useEffect, useState } from "react";
import type { SyntheticEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconArrowLeft,
  IconCheck,
  IconCalendar,
  IconLock,
  IconMail,
  IconShield,
  IconUser,
  IconUserEdit,
} from "@tabler/icons-react";

import { apiFetch } from "@/lib/apiFetch";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import type { Role, User } from "@/types";

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  COLLABORATEUR: "Accès aux fonctionnalités courantes du cabinet.",
  RESPONSABLE: "Peut valider et gérer certaines opérations sensibles.",
  EXPERT_COMPTABLE: "Accès aux validations réservées à l’expert-comptable.",
  ADMIN: "Accès complet, y compris à la gestion des utilisateurs.",
};

const ROLE_LABELS: Record<Role, string> = {
  COLLABORATEUR: "Collaborateur",
  RESPONSABLE: "Responsable",
  EXPERT_COMPTABLE: "Expert-comptable",
  ADMIN: "Administrateur",
};

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const { ready } = useAuth(["ADMIN"]);
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>("COLLABORATEUR");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);

    apiFetch<User>(`/users/${id}`)
      .then((data) => {
        setUser(data);
        setSelectedRole(data.role);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const data: Record<string, unknown> = {
      prenom: form.get("prenom") as string,
      nom: form.get("nom") as string,
      email: form.get("email") as string,
      role: form.get("role") as Role,
      isActive: form.get("isActive") === "on",
    };

    const password = form.get("password") as string;
    if (password.trim()) data.password = password;

    try {
      await apiFetch(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      router.push("/dashboard/admin/users");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue pendant la modification.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!ready || loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
          <p className="text-sm text-slate-400">Chargement de l’utilisateur…</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-full bg-slate-50 p-6">
        <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
          {error ?? "Utilisateur introuvable"}
        </div>
      </div>
    );
  }

  const initials = `${user.prenom?.[0] ?? ""}${user.nom?.[0] ?? ""}`;

  return (
    <div className="min-h-full bg-slate-50 p-4 pb-20 sm:p-6 md:p-8 md:pb-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-800 via-indigo-700 to-blue-700 p-6 text-white shadow-xl sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-fuchsia-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-cyan-300/15 blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4 sm:gap-5">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-xl font-bold uppercase shadow-inner backdrop-blur-sm sm:size-20 sm:text-2xl">
                {initials || "?"}
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-200">Administration</p>
                <h1 className="mt-1 truncate text-2xl font-bold sm:text-3xl">
                  {user.prenom} {user.nom}
                </h1>
                <p className="mt-2 truncate text-sm text-violet-100">{user.email}</p>
              </div>
            </div>

            <Link
              href="/dashboard/admin/users"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-violet-800 shadow-lg transition hover:-translate-y-0.5 hover:bg-violet-50 sm:w-auto"
            >
              <IconArrowLeft className="size-5" />
              Retour
            </Link>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-violet-600">Rôle actuel</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{ROLE_LABELS[user.role]}</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-violet-100">
                <IconShield className="size-5 text-violet-700" />
              </div>
            </div>
          </div>

          <div className={`rounded-2xl border p-5 shadow-sm ${user.isActive ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white" : "border-red-200 bg-gradient-to-br from-red-50 to-white"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`text-xs font-bold uppercase tracking-wide ${user.isActive ? "text-emerald-600" : "text-red-600"}`}>État du compte</p>
                <p className={`mt-2 text-base font-semibold ${user.isActive ? "text-emerald-700" : "text-red-700"}`}>
                  {user.isActive ? "Actif" : "Désactivé"}
                </p>
              </div>
              <span className={`mt-1 size-3 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
            </div>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Création</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100">
                <IconCalendar className="size-5 text-blue-700" />
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-violet-50 via-indigo-50 to-blue-50 px-5 py-5 sm:px-7">
            <div className="flex size-11 items-center justify-center rounded-xl bg-violet-100">
              <IconUserEdit className="size-6 text-violet-700" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Informations du compte</h2>
              <p className="mt-0.5 text-xs text-slate-500">Modifiez les informations puis enregistrez vos changements.</p>
            </div>
          </div>

          <div className="space-y-7 p-5 sm:p-7">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
            )}

            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="prenom">Prénom *</FieldLabel>
                  <div className="relative">
                    <IconUser className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input id="prenom" name="prenom" defaultValue={user.prenom} className="h-11 rounded-xl bg-slate-50 pl-10 focus:bg-white" required />
                  </div>
                </Field>

                <Field>
                  <FieldLabel htmlFor="nom">Nom *</FieldLabel>
                  <div className="relative">
                    <IconUser className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input id="nom" name="nom" defaultValue={user.nom} className="h-11 rounded-xl bg-slate-50 pl-10 focus:bg-white" required />
                  </div>
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="email">Adresse e-mail *</FieldLabel>
                <div className="relative">
                  <IconMail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input id="email" name="email" type="email" defaultValue={user.email} className="h-11 rounded-xl bg-slate-50 pl-10 focus:bg-white" required />
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="role">Rôle *</FieldLabel>
                <div className="relative">
                  <IconShield className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <select
                    id="role"
                    name="role"
                    value={selectedRole}
                    onChange={(event) => setSelectedRole(event.target.value as Role)}
                    required
                    className="h-11 w-full appearance-none rounded-xl border border-input bg-slate-50 pl-10 pr-4 text-sm shadow-xs outline-none transition focus:bg-white focus:ring-4 focus:ring-violet-100"
                  >
                    <option value="COLLABORATEUR">Collaborateur</option>
                    <option value="RESPONSABLE">Responsable</option>
                    <option value="EXPERT_COMPTABLE">Expert-comptable</option>
                    <option value="ADMIN">Administrateur</option>
                  </select>
                </div>

                <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3">
                  <p className="text-xs font-semibold text-violet-700">{ROLE_LABELS[selectedRole]}</p>
                  <p className="mt-1 text-xs leading-5 text-violet-600">{ROLE_DESCRIPTIONS[selectedRole]}</p>
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Nouveau mot de passe</FieldLabel>
                <div className="relative">
                  <IconLock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input id="password" name="password" type="password" placeholder="Laisser vide pour conserver l’ancien" minLength={6} className="h-11 rounded-xl bg-slate-50 pl-10 focus:bg-white" />
                </div>
                <p className="mt-2 text-xs text-slate-400">Le mot de passe actuel restera inchangé si ce champ est vide.</p>
              </Field>

              <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${user.isActive ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-100/70" : "border-slate-200 bg-slate-50 hover:bg-slate-100"}`}>
                <input type="checkbox" name="isActive" defaultChecked={user.isActive} className="mt-0.5 size-4 rounded border-slate-300 accent-violet-700" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">Compte actif</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Un compte désactivé ne pourra plus se connecter à l’application.</p>
                </div>
              </label>
            </FieldGroup>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-5 py-5 sm:flex-row sm:justify-end sm:px-7">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving} className="h-11 rounded-xl border-slate-300 bg-white px-5 hover:bg-slate-100">
              Annuler
            </Button>

            <Button type="submit" disabled={saving} className="h-11 rounded-xl bg-gradient-to-r from-violet-700 to-indigo-700 px-5 text-white shadow-sm hover:from-violet-800 hover:to-indigo-800">
              <IconCheck className="size-4" />
              {saving ? "Enregistrement…" : "Enregistrer les modifications"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}