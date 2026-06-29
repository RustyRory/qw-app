"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { apiFetch } from "@/lib/apiFetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

export default function NewClientPage() {
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
      email: (form.get("email") as string) || undefined,
      telephone: (form.get("telephone") as string) || undefined,
      raisonSociale: (form.get("raisonSociale") as string) || undefined,
    };

    try {
      const client = await apiFetch<{ id: string }>("/clients", {
        method: "POST",
        body: JSON.stringify(data),
      });
      router.push(`/dashboard/clients/${client.id}`);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard/clients"
          className="text-muted-foreground hover:text-foreground"
        >
          <IconArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-semibold">Nouveau client</h1>
      </div>

      <div className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
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
              <FieldLabel htmlFor="raisonSociale">Raison sociale</FieldLabel>
              <Input id="raisonSociale" name="raisonSociale" />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" name="email" type="email" />
            </Field>
            <Field>
              <FieldLabel htmlFor="telephone">Téléphone</FieldLabel>
              <Input id="telephone" name="telephone" type="tel" />
            </Field>
          </FieldGroup>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Création…" : "Créer le client"}
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
