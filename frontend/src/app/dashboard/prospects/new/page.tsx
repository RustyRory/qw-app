"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { apiFetch } from "@/lib/apiFetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import type { Prospect, TypeEntite } from "@/types";

export default function NewProspectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const data = {
      nom: form.get("nom") as string,
      typeEntite: form.get("typeEntite") as TypeEntite,
      email: (form.get("email") as string) || undefined,
      telephone: (form.get("telephone") as string) || undefined,
      siret: (form.get("siret") as string) || undefined,
      activite: (form.get("activite") as string) || undefined,
      codeNaf: (form.get("codeNaf") as string) || undefined,
      adresse: (form.get("adresse") as string) || undefined,
      ville: (form.get("ville") as string) || undefined,
      codePostal: (form.get("codePostal") as string) || undefined,
      pays: (form.get("pays") as string) || undefined,
      notes: (form.get("notes") as string) || undefined,
    };

    try {
      const prospect = await apiFetch<Prospect>("/prospects", {
        method: "POST",
        body: JSON.stringify(data),
      });
      router.push(`/dashboard/prospects/${prospect.id}`);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard/prospects"
          className="text-muted-foreground hover:text-foreground"
        >
          <IconArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-semibold">Nouveau prospect</h1>
      </div>

      <div className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="nom">Raison sociale / Nom *</FieldLabel>
              <Input id="nom" name="nom" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="typeEntite">Type d&apos;entité *</FieldLabel>
              <select
                id="typeEntite"
                name="typeEntite"
                required
                defaultValue="PERSONNE_MORALE"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                <option value="PERSONNE_MORALE">Personne morale</option>
                <option value="PERSONNE_PHYSIQUE">Personne physique</option>
              </select>
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" name="email" type="email" />
              </Field>
              <Field>
                <FieldLabel htmlFor="telephone">Téléphone</FieldLabel>
                <Input id="telephone" name="telephone" type="tel" />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="siret">SIRET</FieldLabel>
              <Input id="siret" name="siret" maxLength={14} />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="activite">Secteur / activité</FieldLabel>
                <Input id="activite" name="activite" />
              </Field>
              <Field>
                <FieldLabel htmlFor="codeNaf">Code NAF</FieldLabel>
                <Input id="codeNaf" name="codeNaf" />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="adresse">Adresse</FieldLabel>
              <Input id="adresse" name="adresse" />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="ville">Ville</FieldLabel>
                <Input id="ville" name="ville" />
              </Field>
              <Field>
                <FieldLabel htmlFor="codePostal">Code postal</FieldLabel>
                <Input id="codePostal" name="codePostal" />
              </Field>
              <Field>
                <FieldLabel htmlFor="pays">Pays</FieldLabel>
                <Input id="pays" name="pays" defaultValue="France" />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="notes">Notes internes</FieldLabel>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </Field>
          </FieldGroup>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Création…" : "Créer le prospect"}
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
