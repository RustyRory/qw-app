"use client";

import { useState } from "react";
import type { SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconArrowLeft,
  IconEye,
  IconLock,
  IconMail,
  IconShield,
  IconUser,
  IconUserPlus,
} from "@tabler/icons-react";

import { apiFetch } from "@/lib/apiFetch";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import type { Role } from "@/types";

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  COLLABORATEUR: "Accès aux fonctionnalités courantes du cabinet.",
  RESPONSABLE: "Peut valider et gérer certaines opérations sensibles.",
  EXPERT_COMPTABLE: "Accès aux validations réservées à l’expert-comptable.",
  ADMIN: "Accès complet, y compris à la gestion des utilisateurs.",
};

export default function NewUserPage() {
  const { ready } = useAuth(["ADMIN"]);
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] =
    useState<Role>("COLLABORATEUR");

  async function handleSubmit(
    event: SyntheticEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);

    const data = {
      prenom: form.get("prenom") as string,
      nom: form.get("nom") as string,
      email: form.get("email") as string,
      password: form.get("password") as string,
      role: form.get("role") as Role,
    };

    try {
      await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify(data),
      });

      router.push("/dashboard/admin/users");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue pendant la création.",
      );

      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-50">
        <div className="size-7 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 pb-20 sm:p-6 md:p-8 md:pb-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Retour et titre */}
        <div className="flex items-start gap-4">
          <Link
            href="/dashboard/admin/users"
            title="Retour aux utilisateurs"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
          >
            <IconArrowLeft className="size-5" />
          </Link>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-600">
              Administration
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Nouvel utilisateur
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Créez un nouveau compte et définissez son rôle au sein du cabinet.
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-indigo-50 px-5 py-4 sm:px-6">
            <div className="flex size-10 items-center justify-center rounded-xl bg-violet-100">
              <IconUserPlus className="size-5 text-violet-700" />
            </div>
<<<<<<< HEAD

            <div>
              <h2 className="font-semibold text-slate-900">
                Informations du compte
              </h2>

              <p className="text-xs text-slate-500">
                Tous les champs marqués d’un astérisque sont obligatoires.
              </p>
=======
          )}
          <FieldGroup>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="prenom">Prénom *</FieldLabel>
                <Input id="prenom" name="prenom" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="nom">Nom *</FieldLabel>
                <Input id="nom" name="nom" required />
              </Field>
>>>>>>> origin/dev
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-6">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="prenom">Prénom *</FieldLabel>

                  <div className="relative">
                    <IconUser className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

                    <Input
                      id="prenom"
                      name="prenom"
                      placeholder="Ex. Jean"
                      className="pl-10"
                      required
                    />
                  </div>
                </Field>

                <Field>
                  <FieldLabel htmlFor="nom">Nom *</FieldLabel>

                  <div className="relative">
                    <IconUser className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

                    <Input
                      id="nom"
                      name="nom"
                      placeholder="Ex. Dupont"
                      className="pl-10"
                      required
                    />
                  </div>
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="email">Adresse e-mail *</FieldLabel>

                <div className="relative">
                  <IconMail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="prenom.nom@cabinet.fr"
                    className="pl-10"
                    required
                  />
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
                    onChange={(event) =>
                      setSelectedRole(event.target.value as Role)
                    }
                    required
                    className="flex h-10 w-full appearance-none rounded-md border border-input bg-background pl-10 pr-4 text-sm shadow-xs outline-none transition focus-visible:ring-2 focus-visible:ring-ring/30"
                  >
                    <option value="COLLABORATEUR">Collaborateur</option>
                    <option value="RESPONSABLE">Responsable</option>
                    <option value="EXPERT_COMPTABLE">
                      Expert-comptable
                    </option>
                    <option value="ADMIN">Administrateur</option>
                  </select>
                </div>

                <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  {ROLE_DESCRIPTIONS[selectedRole]}
                </p>
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Mot de passe *</FieldLabel>

                <div className="relative">
                  <IconLock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Minimum 6 caractères"
                    minLength={6}
                    className="pl-10"
                    required
                  />
                </div>

                <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                  <IconEye className="size-3.5" />
                  Le mot de passe sera chiffré avant d’être enregistré.
                </p>
              </Field>
            </FieldGroup>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Annuler
            </Button>

            <Button
              type="submit"
              disabled={loading}
              className="bg-violet-700 text-white hover:bg-violet-800"
            >
              <IconUserPlus className="size-4" />

              {loading ? "Création…" : "Créer l’utilisateur"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}