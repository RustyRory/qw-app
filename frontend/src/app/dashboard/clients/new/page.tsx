"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft, IconSearch, IconLoader2 } from "@tabler/icons-react";
import { apiFetch } from "@/lib/apiFetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import type { Client, TypeEntite } from "@/types";

interface SireneData {
  nom: string; siret?: string; siren?: string;
  adresse?: string; ville?: string; codePostal?: string;
  codeNaf?: string; formeJuridique?: string;
}

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [siret, setSiret] = useState("");
  const [sireneLoading, setSireneLoading] = useState(false);
  const [sireneError, setSireneError] = useState<string | null>(null);
  const [sireneData, setSireneData] = useState<SireneData | null>(null);
  const [typeEntite, setTypeEntite] = useState<TypeEntite>("PERSONNE_MORALE");

  async function handleSirene() {
    const clean = siret.replace(/\s/g, "");
    if (clean.length !== 14) { setSireneError("Le SIRET doit contenir 14 chiffres"); return; }
    setSireneLoading(true);
    setSireneError(null);
    try {
      const res = await fetch(`https://api.insee.fr/entreprises/sirene/V3.11/siret/${clean}`,
        { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const unite = data.etablissement?.uniteLegale;
      const adr = data.etablissement?.adresseEtablissement;
      setSireneData({
        nom: unite?.denominationUniteLegale || `${unite?.prenomUsuelUniteLegale ?? ""} ${unite?.nomUniteLegale ?? ""}`.trim(),
        siret: clean, siren: clean.slice(0, 9),
        adresse: `${adr?.numeroVoieEtablissement ?? ""} ${adr?.typeVoieEtablissement ?? ""} ${adr?.libelleVoieEtablissement ?? ""}`.trim(),
        ville: adr?.libelleCommuneEtablissement,
        codePostal: adr?.codePostalEtablissement,
        codeNaf: unite?.activitePrincipaleUniteLegale,
      });
    } catch { setSireneError("SIRET introuvable ou service SIRENE indisponible"); }
    finally { setSireneLoading(false); }
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const data = {
      raisonSociale: form.get("raisonSociale") as string,
      typeEntite,
      siret: siret.replace(/\s/g, "") || undefined,
      codeNaf: (form.get("codeNaf") as string) || undefined,
      formeJuridique: (form.get("formeJuridique") as string) || undefined,
      activitePrincipale: (form.get("activite") as string) || undefined,
      adresseSiege: (form.get("adresse") as string) || undefined,
      ville: (form.get("ville") as string) || undefined,
      codePostal: (form.get("codePostal") as string) || undefined,
      pays: (form.get("pays") as string) || "France",
    };
    try {
      const client = await apiFetch<Client>("/clients", { method: "POST", body: JSON.stringify(data) });
      router.push(`/dashboard/clients/${client.id}`);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{title}</p>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );

  return (
    <div className="min-h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b px-5 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/clients" className="text-slate-400 hover:text-slate-600 transition-colors">
            <IconArrowLeft className="size-4" />
          </Link>
          <span className="text-slate-400 text-sm">Retour</span>
          <h1 className="text-xl font-bold text-slate-900">Nouveau client</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 md:px-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
          )}

          {/* SIRET */}
          <Section title="SIRET (14 chiffres)">
            <div className="flex gap-2">
              <Input value={siret} onChange={(e) => setSiret(e.target.value)}
                placeholder="12345678900012" maxLength={17} className="font-mono rounded-lg" />
              <Button type="button" onClick={handleSirene} disabled={sireneLoading}
                variant="outline" className="shrink-0 rounded-lg gap-2">
                {sireneLoading ? <IconLoader2 className="size-4 animate-spin" /> : <IconSearch className="size-4" />}
                Rechercher SIRENE
              </Button>
            </div>
            {sireneError && <p className="mt-2 text-xs text-red-600">{sireneError}</p>}
            {sireneData && <p className="mt-2 text-xs text-emerald-600 font-medium">✓ Données récupérées — {sireneData.nom}</p>}
          </Section>

          {/* Identité */}
          <Section title="Identité">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="raisonSociale">Raison sociale / Nom <span className="text-red-500">*</span></FieldLabel>
                <Input id="raisonSociale" name="raisonSociale" required
                  key={sireneData?.nom ?? "raison-sociale-vide"}
                  defaultValue={sireneData?.nom ?? ""} placeholder="SARL Dupont & Associés" className="rounded-lg" />
              </Field>
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Type d'entité <span className="text-red-500">*</span></p>
                <div className="flex items-center gap-6">
                  {(["PERSONNE_MORALE", "PERSONNE_PHYSIQUE"] as TypeEntite[]).map((type) => (
                    <label key={type} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="typeEntite"
                        value={type}
                        checked={typeEntite === type}
                        onChange={() => setTypeEntite(type)}
                        className="size-4 accent-violet-600"
                      />
                      <span className="text-base font-medium text-slate-800">
                        {type === "PERSONNE_MORALE"
                          ? "Personne morale"
                          : "Personne physique"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="formeJuridique">Forme juridique</FieldLabel>
                  <Input id="formeJuridique" name="formeJuridique" placeholder="SARL, SAS…" className="rounded-lg" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="codeNaf">Code NAF</FieldLabel>
                  <Input id="codeNaf" name="codeNaf" placeholder="6920Z"
                    key={sireneData?.codeNaf ?? "code-naf-vide"}
                    defaultValue={sireneData?.codeNaf ?? ""} className="rounded-lg font-mono" />
                </Field>
              </div>
            </FieldGroup>
          </Section>

          {/* Activité */}
          <Section title="Activité">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="activite">Secteur / activité principale</FieldLabel>
                <Input
                  id="activite"
                  name="activite"
                  placeholder="Finance, Immobilier…"
                  className="rounded-lg"
                />
              </Field>
            </FieldGroup>
          </Section>

          {/* Localisation */}
          <Section title="Localisation">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="adresse">Adresse</FieldLabel>
                <Input id="adresse" name="adresse" key={sireneData?.adresse ?? "adresse-vide"}
                  defaultValue={sireneData?.adresse ?? ""}
                  placeholder="12 rue du Marché" className="rounded-lg" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="ville">Ville</FieldLabel>
                  <Input id="ville" name="ville" key={sireneData?.ville ?? "ville-vide"}
                    defaultValue={sireneData?.ville ?? ""}
                    placeholder="Paris" className="rounded-lg" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="codePostal">Code postal</FieldLabel>
                  <Input id="codePostal" name="codePostal" key={sireneData?.codePostal ?? "code-postal-vide"}
                    defaultValue={sireneData?.codePostal ?? ""}
                    placeholder="75001" className="rounded-lg" />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="pays">Pays</FieldLabel>
                <select id="pays" name="pays" defaultValue="France"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                  {["France","Belgique","Suisse","Luxembourg","Allemagne","Espagne","Italie","Royaume-Uni","Autre"].map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </Field>
            </FieldGroup>
          </Section>

          {/* Actions */}
          <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex items-center gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-lg border-slate-200">
              Annuler
            </Button>
            <Button type="submit" disabled={loading}
              className="rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold">
              {loading ? "Création…" : "Créer le client"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}