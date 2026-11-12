"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconArrowLeft, IconPhoto, IconTrash } from "@tabler/icons-react";

import { apiFetch } from "@/lib/apiFetch";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";

interface ParametresCabinet {
  nom: string;
  raisonSociale: string;
  formeJuridique: string;
  adresse: string;
  codePostal: string;
  ville: string;
  capitalSocial: string;
  siret: string;
  codeApe: string;
  tvaIntracommunautaire: string;
  email: string | null;
  telephone: string | null;
  logoDataUri: string | null;
}

const CHAMPS: {
  cle: keyof ParametresCabinet;
  label: string;
  requis: boolean;
}[] = [
  { cle: "nom", label: "Nom commercial", requis: true },
  { cle: "raisonSociale", label: "Raison sociale", requis: true },
  { cle: "formeJuridique", label: "Forme juridique", requis: true },
  { cle: "capitalSocial", label: "Capital social", requis: true },
  { cle: "adresse", label: "Adresse", requis: true },
  { cle: "codePostal", label: "Code postal", requis: true },
  { cle: "ville", label: "Ville", requis: true },
  { cle: "siret", label: "SIRET", requis: true },
  { cle: "codeApe", label: "Code APE", requis: true },
  {
    cle: "tvaIntracommunautaire",
    label: "N° TVA intracommunautaire",
    requis: true,
  },
  { cle: "email", label: "Email", requis: false },
  { cle: "telephone", label: "Téléphone", requis: false },
];

const LOGO_MAX = 1024 * 1024; // 1 Mo

// Coordonnées du cabinet reprises sur les lettres de mission (en-tête,
// pied de page). Les lettres déjà signées ne changent pas.
export default function CabinetPage() {
  const { ready } = useAuth(["ADMIN"]);
  const [cabinet, setCabinet] = useState<ParametresCabinet | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    apiFetch<ParametresCabinet>("/cabinet")
      .then(setCabinet)
      .catch((e: Error) => setError(e.message));
  }, []);

  function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !cabinet) return;
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setError("Le logo doit être une image PNG ou JPEG.");
      return;
    }
    if (file.size > LOGO_MAX) {
      setError("Logo trop lourd (1 Mo maximum).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setCabinet({ ...cabinet, logoDataUri: reader.result as string });
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!cabinet) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const {
        nom,
        raisonSociale,
        formeJuridique,
        adresse,
        codePostal,
        ville,
        capitalSocial,
        siret,
        codeApe,
        tvaIntracommunautaire,
        email,
        telephone,
        logoDataUri,
      } = cabinet;
      const saved = await apiFetch<ParametresCabinet>("/cabinet", {
        method: "PUT",
        body: JSON.stringify({
          nom,
          raisonSociale,
          formeJuridique,
          adresse,
          codePostal,
          ville,
          capitalSocial,
          siret,
          codeApe,
          tvaIntracommunautaire,
          email: email || null,
          telephone: telephone || null,
          logoDataUri,
        }),
      });
      setCabinet(saved);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return null;

  return (
    <div className="min-h-full bg-slate-50 pb-20 md:pb-8">
      <header className="border-b bg-white px-4 py-4 sm:px-6 md:px-8">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link
            href="/dashboard/admin"
            aria-label="Retour à l’administration"
            className="flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
          >
            <IconArrowLeft className="size-4" />
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-600">
              Administration
            </p>
            <h1 className="text-xl font-bold text-slate-900">Cabinet</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 md:px-8">
        {!cabinet ? (
          <p className="py-10 text-center text-sm text-slate-400">
            {error ?? "Chargement…"}
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
          >
            <p className="text-sm text-slate-500">
              Ces informations apparaissent dans l’en-tête et le pied de page
              des lettres de mission générées ensuite (les lettres déjà signées
              ne changent pas).
            </p>
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                Coordonnées enregistrées.
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {CHAMPS.map(({ cle, label, requis }) => (
                <Field key={cle}>
                  <FieldLabel htmlFor={`cab-${cle}`}>
                    {label}
                    {requis && " *"}
                  </FieldLabel>
                  <Input
                    id={`cab-${cle}`}
                    required={requis}
                    value={(cabinet[cle] as string | null) ?? ""}
                    onChange={(e) =>
                      setCabinet({ ...cabinet, [cle]: e.target.value })
                    }
                    className="rounded-xl"
                  />
                </Field>
              ))}
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Logo</p>
              <div className="flex flex-wrap items-center gap-3">
                {cabinet.logoDataUri ? (
                  <img
                    src={cabinet.logoDataUri}
                    alt="Logo du cabinet"
                    className="h-14 w-auto rounded-lg border border-slate-200 bg-white p-1"
                  />
                ) : (
                  <span className="text-xs text-slate-400">
                    Logo par défaut
                  </span>
                )}
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  <IconPhoto className="size-4" />
                  Choisir une image
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="sr-only"
                    onChange={handleLogo}
                  />
                </label>
                {cabinet.logoDataUri && (
                  <button
                    type="button"
                    onClick={() =>
                      setCabinet({ ...cabinet, logoDataUri: null })
                    }
                    className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                  >
                    <IconTrash className="size-4" />
                    Retirer
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving} className="rounded-xl">
                {saving ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
