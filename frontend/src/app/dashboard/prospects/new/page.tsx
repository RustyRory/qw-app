"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft, IconSearch, IconLoader2 } from "@tabler/icons-react";
import { apiFetch } from "@/lib/apiFetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import type { Prospect, TypeEntite } from "@/types";

interface SireneData {
  nom: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  codeNaf?: string;
}

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
    const clean = siret.replace(/\s/g, "");
    if (clean.length !== 14) { setSireneError("Le SIRET doit contenir 14 chiffres"); return; }
    setSireneLoading(true);
    setSireneError(null);
    try {
      const res = await fetch(
        `https://api.insee.fr/entreprises/sirene/V3.11/siret/${clean}`,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      const unite = data.etablissement?.uniteLegale;
      const adr = data.etablissement?.adresseEtablissement;
      setPrefill({
        nom: unite?.denominationUniteLegale || `${unite?.prenomUsuelUniteLegale ?? ""} ${unite?.nomUniteLegale ?? ""}`.trim(),
        adresse: `${adr?.numeroVoieEtablissement ?? ""} ${adr?.typeVoieEtablissement ?? ""} ${adr?.libelleVoieEtablissement ?? ""}`.trim(),
        ville: adr?.libelleCommuneEtablissement,
        codePostal: adr?.codePostalEtablissement,
        codeNaf: unite?.activitePrincipaleUniteLegale,
      });
    } catch {
      setSireneError("SIRET introuvable ou service SIRENE indisponible");
    } finally {
      setSireneLoading(false);
    }
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    // Utilise les vrais champs du nouveau backend
    const data = {
      nom: form.get("nom") as string,
      typeEntite,
      email: (form.get("email") as string) || undefined,
      telephone: (form.get("telephone") as string) || undefined,
      siret: siret.replace(/\s/g, "") || undefined,
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
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full bg-slate-50">
      <div className="bg-white border-b px-5 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/prospects" className="text-slate-400 hover:text-slate-600 transition-colors">
            <IconArrowLeft className="size-4" />
          </Link>
          <span className="text-slate-400 text-sm">Retour</span>
          <h1 className="text-xl font-bold text-slate-900">Nouveau prospect</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 md:px-8">
        <form onSubmit={handleSubmit} className="space-y-4">

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
          )}

          {/* SIRET */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">SIRET (14 chiffres)</p>
            </div>
            <div className="px-5 py-4 flex gap-2">
              <Input
                value={siret}
                onChange={(e) => setSiret(e.target.value)}
                placeholder="12345678900012"
                maxLength={17}
                className="font-mono rounded-lg"
              />
              <Button type="button" onClick={handleSirene} disabled={sireneLoading} variant="outline" className="shrink-0 rounded-lg gap-2">
                {sireneLoading ? <IconLoader2 className="size-4 animate-spin" /> : <IconSearch className="size-4" />}
                Rechercher SIRENE
              </Button>
            </div>
            {sireneError && <p className="px-5 pb-3 text-xs text-red-600">{sireneError}</p>}
            {prefill && <p className="px-5 pb-3 text-xs text-emerald-600 font-medium">✓ Données récupérées — {prefill.nom}</p>}
          </div>

          {/* Identité */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Identité</p>
            </div>
            <div className="px-5 py-4 space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="nom">Raison sociale / Nom <span className="text-red-500">*</span></FieldLabel>
                  <Input id="nom" name="nom" required defaultValue={prefill?.nom ?? ""} placeholder="SARL Dupont & Associés" className="rounded-lg" />
                </Field>
              </FieldGroup>
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Type d&apos;entité <span className="text-red-500">*</span></p>
                <div className="flex items-center gap-6">
                  {(["PERSONNE_MORALE", "PERSONNE_PHYSIQUE"] as TypeEntite[]).map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <div
                        onClick={() => setTypeEntite(type)}
                        className={`size-4 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all
                          ${typeEntite === type ? "border-violet-600 bg-violet-600" : "border-slate-400 bg-white"}`}
                      >
                        {typeEntite === type && <div className="size-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-base font-medium text-slate-800">
                        {type === "PERSONNE_MORALE" ? "Personne morale" : "Personne physique"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Contact</p>
            </div>
            <div className="px-5 py-4">
              <FieldGroup>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input id="email" name="email" type="email" placeholder="contact@example.com" className="rounded-lg" />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="telephone">Téléphone</FieldLabel>
                    <Input id="telephone" name="telephone" type="tel" placeholder="+33 6 00 00 00 00" className="rounded-lg" />
                  </Field>
                </div>
              </FieldGroup>
            </div>
          </div>

          {/* Activité */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Activité</p>
            </div>
            <div className="px-5 py-4">
              <FieldGroup>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="activite">Secteur / activité</FieldLabel>
                    <Input id="activite" name="activite" placeholder="Finance, Tech…" className="rounded-lg" />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="codeNaf">Code NAF</FieldLabel>
                    <Input id="codeNaf" name="codeNaf" placeholder="6920Z" defaultValue={prefill?.codeNaf ?? ""} className="rounded-lg font-mono" />
                  </Field>
                </div>
              </FieldGroup>
            </div>
          </div>

          {/* Localisation */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Localisation</p>
            </div>
            <div className="px-5 py-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="adresse">Adresse</FieldLabel>
                  <Input id="adresse" name="adresse" defaultValue={prefill?.adresse ?? ""} placeholder="12 rue du Marché" className="rounded-lg" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="ville">Ville</FieldLabel>
                    <Input id="ville" name="ville" defaultValue={prefill?.ville ?? ""} placeholder="Paris" className="rounded-lg" />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="codePostal">Code postal</FieldLabel>
                    <Input id="codePostal" name="codePostal" defaultValue={prefill?.codePostal ?? ""} placeholder="75001" className="rounded-lg" />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="pays">Pays</FieldLabel>
                  <select id="pays" name="pays" defaultValue="France"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30">
                    {["France","Belgique","Suisse","Luxembourg","Allemagne","Espagne","Italie","Royaume-Uni","Autre"].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </Field>
              </FieldGroup>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Notes internes</p>
            </div>
            <div className="px-5 py-4">
              <textarea name="notes" rows={4} placeholder="Zone de texte libre…"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none" />
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex items-center gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-lg border-slate-200">
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold">
              {loading ? "Création…" : "Créer le prospect"}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
