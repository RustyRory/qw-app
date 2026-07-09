"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { apiFetch } from "@/lib/apiFetch";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import type { Role } from "@/types";

export default function NewUserPage() {
  const { ready } = useAuth(["ADMIN"]);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const data = {
      prenom: form.get("prenom") as string,
      nom: form.get("nom") as string,
      email: form.get("email") as string,
      password: form.get("password") as string,
      role: form.get("role") as Role,
    };
    try {
      await apiFetch("/users", { method: "POST", body: JSON.stringify(data) });
      router.push("/dashboard/admin/users");
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  if (!ready) return null;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard/admin/users"
          className="text-muted-foreground hover:text-foreground"
        >
          <IconArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-semibold">Nouvel utilisateur</h1>
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
                <Input id="prenom" name="prenom" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="nom">Nom *</FieldLabel>
                <Input id="nom" name="nom" required />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="email">Email *</FieldLabel>
              <Input id="email" name="email" type="email" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="role">Rôle *</FieldLabel>
              <select
                id="role"
                name="role"
                defaultValue="COLLABORATEUR"
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
              <FieldLabel htmlFor="password">Mot de passe *</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={6}
                required
              />
            </Field>
          </FieldGroup>
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Création…" : "Créer"}
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
