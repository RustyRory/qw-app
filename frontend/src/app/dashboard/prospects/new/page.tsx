"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft, IconLoader2, IconSearch } from "@tabler/icons-react";

import { apiFetch } from "@/lib/apiFetch";
import { fetchSirene, type SireneData } from "@/lib/sirene";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import type { Prospect, TypeEntite } from "@/types";

export default function NewProspectPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [siret, setSiret] = useState("");
  const [sireneLoading, setSireneLoading] = useState(false);
  const [sireneError, setSireneError] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<SireneData | null>(null);

  const [typeEntite, setTypeEntite] = useState<TypeEntite>("PERSONNE_MORALE");

  async function handleSirene() {
    setSireneLoading(true);
    setSireneError(null);

    try {
      const data = await fetchSirene(siret);
      setPrefill(data);
    } catch (err) {
      setSireneError(
        err instanceof Error
          ? err.message
          : "SIRET introuvable ou service SIRENE indisponible",
      );
    } finally {
      setSireneLoading(false);
    }
  }

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);

    const data = {
      nom: form.get("nom") as string,
      typeEntite,
      email: (form.get("email") as string) || undefined,
      telephone: (form.get("telephone") as string) || undefined,
      siret: siret.replace(/\s/g, "") || undefined,
      formeJuridique: (form.get("formeJuridique") as string) || undefined,
      representantLegal: (form.get("representantLegal") as string) || undefined,
      activite: (form.get("activite") as string) || undefined,
      codeNaf: (form.get("codeNaf") as string) || undefined,
      adresse: (form.get("adresse") as string) || undefined,
      ville: (form.get("ville") as string) || undefined,
      codePostal: (form.get("codePostal") as string) || undefined,
      pays: (form.get("pays") as string) || "France",
      notes: (form.get("notes") as string) || undefined,
    };

    try {
      const prospect = await apiFetch<Prospect>("/prospects", {
        method: "POST",
        body: JSON.stringify(data),
      });

      router.push(`/dashboard/prospects/${prospect.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de créer le prospect.",
      );
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full bg-slate-50 pb-20 md:pb-8">
      <header className="border-b bg-white px-4 py-4 sm:px-6 md:px-8">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link
            href="/dashboard/prospects"
            aria-label="Retour aux prospects"
            className="flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
          >
            <IconArrowLeft className="size-4" />
          </Link>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-600">
              Prospects
            </p>
            <h1 className="text-xl font-bold text-slate-900">
              Nouveau prospect
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 md:px-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                SIRET
              </p>
            </div>

            <div className="space-y-3 px-5 py-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={siret}
                  onChange={(event) => setSiret(event.target.value)}
                  placeholder="12345678900012"
                  maxLength={17}
                  inputMode="numeric"
                  className="rounded-xl font-mono"
                />

                <Button
                  type="button"
                  onClick={handleSirene}
                  disabled={sireneLoading}
                  variant="outline"
                  className="shrink-0 gap-2 rounded-xl"
                >
                  {sireneLoading ? (
                    <IconLoader2 className="size-4 animate-spin" />
                  ) : (
                    <IconSearch className="size-4" />
                  )}
                  Rechercher SIRENE
                </Button>
              </div>

              {sireneError && (
                <p className="text-xs text-red-600">{sireneError}</p>
              )}

              {prefill && (
                <p className="text-xs font-medium text-emerald-600">
                  ✓ Données récupérées — {prefill.nom}
                </p>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Identité
              </p>
            </div>

            <div className="space-y-4 px-5 py-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="nom">Raison sociale / Nom *</FieldLabel>
                  <Input
                    id="nom"
                    name="nom"
                    key={prefill?.nom ?? "empty-name"}
                    defaultValue={prefill?.nom ?? ""}
                    placeholder="SARL Dupont & Associés"
                    className="rounded-xl"
                    required
                  />
                </Field>
              </FieldGroup>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">
                  Type d&apos;entité *
                </p>

                <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
                  {(
                    ["PERSONNE_MORALE", "PERSONNE_PHYSIQUE"] as TypeEntite[]
                  ).map((type) => (
                    <label
                      key={type}
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <input
                        type="radio"
                        name="typeEntite"
                        value={type}
                        checked={typeEntite === type}
                        onChange={() => setTypeEntite(type)}
                        className="size-4 accent-violet-600"
                      />

                      <span className="text-sm font-medium text-slate-800">
                        {type === "PERSONNE_MORALE"
                          ? "Personne morale"
                          : "Personne physique"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="formeJuridique">
                    Forme juridique
                  </FieldLabel>
                  <Input
                    id="formeJuridique"
                    name="formeJuridique"
                    key={prefill?.formeJuridique ?? "empty-forme-juridique"}
                    defaultValue={prefill?.formeJuridique ?? ""}
                    placeholder="SAS, SARL…"
                    className="rounded-xl"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="representantLegal">
                    Représentant légal
                  </FieldLabel>
                  <Input
                    id="representantLegal"
                    name="representantLegal"
                    key={
                      prefill?.representantLegal ?? "empty-representant-legal"
                    }
                    defaultValue={prefill?.representantLegal ?? ""}
                    placeholder="Jean Dupont"
                    className="rounded-xl"
                  />
                </Field>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Contact
              </p>
            </div>

            <div className="px-5 py-4">
              <FieldGroup>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="contact@example.com"
                      className="rounded-xl"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="telephone">Téléphone</FieldLabel>
                    <Input
                      id="telephone"
                      name="telephone"
                      type="tel"
                      placeholder="+33 6 00 00 00 00"
                      className="rounded-xl"
                    />
                  </Field>
                </div>
              </FieldGroup>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Activité
              </p>
            </div>

            <div className="px-5 py-4">
              <FieldGroup>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="activite">
                      Secteur / activité
                    </FieldLabel>
                    <Input
                      id="activite"
                      name="activite"
                      placeholder="Finance, Tech…"
                      className="rounded-xl"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="codeNaf">Code NAF</FieldLabel>
                    <Input
                      id="codeNaf"
                      name="codeNaf"
                      key={prefill?.codeNaf ?? "empty-code-naf"}
                      defaultValue={prefill?.codeNaf ?? ""}
                      placeholder="6920Z"
                      className="rounded-xl font-mono"
                    />
                  </Field>
                </div>
              </FieldGroup>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Localisation
              </p>
            </div>

            <div className="px-5 py-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="adresse">Adresse</FieldLabel>
                  <Input
                    id="adresse"
                    name="adresse"
                    key={prefill?.adresse ?? "empty-address"}
                    defaultValue={prefill?.adresse ?? ""}
                    placeholder="12 rue du Marché"
                    className="rounded-xl"
                  />
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="ville">Ville</FieldLabel>
                    <Input
                      id="ville"
                      name="ville"
                      key={prefill?.ville ?? "empty-city"}
                      defaultValue={prefill?.ville ?? ""}
                      placeholder="Paris"
                      className="rounded-xl"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="codePostal">Code postal</FieldLabel>
                    <Input
                      id="codePostal"
                      name="codePostal"
                      key={prefill?.codePostal ?? "empty-postal-code"}
                      defaultValue={prefill?.codePostal ?? ""}
                      placeholder="75001"
                      className="rounded-xl"
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="pays">Pays</FieldLabel>
                  <select
                    id="pays"
                    name="pays"
                    defaultValue="France"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  >
                    {[
                      "France",
                      "Belgique",
                      "Suisse",
                      "Luxembourg",
                      "Allemagne",
                      "Espagne",
                      "Italie",
                      "Royaume-Uni",
                      "Autre",
                    ].map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </Field>
              </FieldGroup>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Notes internes
              </p>
            </div>

            <div className="px-5 py-4">
              <textarea
                id="notes"
                name="notes"
                rows={4}
                placeholder="Zone de texte libre…"
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
              className="rounded-xl"
            >
              Annuler
            </Button>

            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-slate-900 font-semibold text-white hover:bg-slate-800"
            >
              {loading ? "Création…" : "Créer le prospect"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
