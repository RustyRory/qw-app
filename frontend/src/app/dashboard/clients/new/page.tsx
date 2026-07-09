"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { apiFetch } from "@/lib/apiFetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import type { Client, TypeEntite } from "@/types";

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
      raisonSociale: form.get("raisonSociale") as string,
      typeEntite: form.get("typeEntite") as TypeEntite,
      siret: (form.get("siret") as string) || undefined,
      formeJuridique: (form.get("formeJuridique") as string) || undefined,
      codeNaf: (form.get("codeNaf") as string) || undefined,
      activitePrincipale:
        (form.get("activitePrincipale") as string) || undefined,
      adresseSiege: (form.get("adresseSiege") as string) || undefined,
      ville: (form.get("ville") as string) || undefined,
      codePostal: (form.get("codePostal") as string) || undefined,
      pays: (form.get("pays") as string) || undefined,
    };

    try {
      const client = await apiFetch<Client>("/clients", {
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
            <Field>
              <FieldLabel htmlFor="raisonSociale">Raison sociale *</FieldLabel>
              <Input id="raisonSociale" name="raisonSociale" required />
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
                <FieldLabel htmlFor="siret">SIRET</FieldLabel>
                <Input id="siret" name="siret" maxLength={14} />
              </Field>
              <Field>
                <FieldLabel htmlFor="formeJuridique">
                  Forme juridique
                </FieldLabel>
                <Input id="formeJuridique" name="formeJuridique" />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="activitePrincipale">
                  Activité principale
                </FieldLabel>
                <Input id="activitePrincipale" name="activitePrincipale" />
              </Field>
              <Field>
                <FieldLabel htmlFor="codeNaf">Code NAF</FieldLabel>
                <Input id="codeNaf" name="codeNaf" />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="adresseSiege">Adresse du siège</FieldLabel>
              <Input id="adresseSiege" name="adresseSiege" />
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
