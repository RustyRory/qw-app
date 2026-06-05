"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { apiFetch } from "@/lib/apiFetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

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
      prenom: form.get("prenom") as string,
      nom: form.get("nom") as string,
      raisonSociale: (form.get("raisonSociale") as string) || undefined,
      email: (form.get("email") as string) || undefined,
      telephone: (form.get("telephone") as string) || undefined,
      secteurActivite: (form.get("secteurActivite") as string) || undefined,
      paysResidence: (form.get("paysResidence") as string) || undefined,
      estPep: form.get("estPep") === "on",
      notes: (form.get("notes") as string) || undefined,
    };

    try {
      const prospect = await apiFetch<{ id: string }>("/prospects", {
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
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="secteurActivite">
                  Secteur d&apos;activité
                </FieldLabel>
                <Input id="secteurActivite" name="secteurActivite" />
              </Field>
              <Field>
                <FieldLabel htmlFor="paysResidence">
                  Pays de résidence
                </FieldLabel>
                <Input id="paysResidence" name="paysResidence" />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="notes">Notes</FieldLabel>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="estPep" className="size-4" />
              Personne politiquement exposée (PEP)
            </label>
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
