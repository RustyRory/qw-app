"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { apiFetch } from "@/lib/apiFetch";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import type { Role, User } from "@/types";

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const { ready } = useAuth(["ADMIN"]);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<User>(`/users/${id}`)
      .then(setUser)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {
      prenom: form.get("prenom") as string,
      nom: form.get("nom") as string,
      email: form.get("email") as string,
      role: form.get("role") as Role,
      isActive: form.get("isActive") === "on",
    };
    const password = form.get("password") as string;
    if (password) data.password = password;
    try {
      await apiFetch(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      router.push("/dashboard/admin/users");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (!ready || loading)
    return <div className="p-6 text-sm text-muted-foreground">Chargement…</div>;
  if (error || !user)
    return (
      <div className="p-6 text-sm text-destructive">
        {error ?? "Utilisateur introuvable"}
      </div>
    );

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard/admin/users"
          className="text-muted-foreground hover:text-foreground"
        >
          <IconArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-semibold">
          {user.prenom} {user.nom}
        </h1>
      </div>

      <div className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <FieldGroup>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="prenom">Prénom *</FieldLabel>
                <Input
                  id="prenom"
                  name="prenom"
                  defaultValue={user.prenom}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="nom">Nom *</FieldLabel>
                <Input id="nom" name="nom" defaultValue={user.nom} required />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="email">Email *</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user.email}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="role">Rôle *</FieldLabel>
              <select
                id="role"
                name="role"
                defaultValue={user.role}
                required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                <option value="COLLABORATEUR">Collaborateur</option>
                <option value="RESPONSABLE">Responsable</option>
                <option value="EXPERT_COMPTABLE">Expert-comptable</option>
                <option value="ADMIN">Administrateur</option>
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">
                Nouveau mot de passe (laisser vide pour ne pas changer)
              </FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={6}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={user.isActive}
                className="size-4"
              />
              Compte actif
            </label>
          </FieldGroup>
          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Enregistrement…" : "Mettre à jour"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
