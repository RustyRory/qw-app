"use client";

import type { Mission } from "@/types";

const FORMULES = ["Madame, Monsieur,", "Madame,", "Monsieur,"];

const champ =
  "w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

// Lit les paramètres de lettre d'un formulaire (champs nommés lm_*).
export function lireParametresLettre(form: FormData) {
  const texte = (cle: string) =>
    ((form.get(cle) as string | null) ?? "").trim();
  const repartitionCapital = [0, 1, 2]
    .map((i) => ({
      associe: texte(`lm_associe_${i}`),
      detention: texte(`lm_detention_${i}`),
    }))
    .filter((l) => l.associe || l.detention);
  const pct = texte("lm_fraisDeboursPct");
  return {
    formuleAppel: texte("lm_formuleAppel") || undefined,
    dateClotureExercice: texte("lm_dateClotureExercice") || null,
    dateEffet: texte("lm_dateEffet") || null,
    repartitionCapital,
    periodeHonoraires: texte("lm_periodeHonoraires") || null,
    fraisDeboursPct: pct ? Number(pct) : undefined,
    rythmeFacturation: texte("lm_rythmeFacturation") || null,
    rythmePaiement: texte("lm_rythmePaiement") || null,
  };
}

// Paramètres repris dans la lettre de mission (formule d'appel, « Votre
// entité », §4.1 honoraires, §4.2 facturation et règlement).
export function ParametresLettreFields({
  mission,
}: {
  mission?: Mission | null;
}) {
  const capital = mission?.repartitionCapital ?? [];
  return (
    <details className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
      <summary className="cursor-pointer text-xs font-semibold text-slate-600">
        Paramètres de la lettre de mission
      </summary>
      <div className="mt-3 space-y-3 text-xs text-slate-600">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="space-y-1">
            <span>Formule d’appel</span>
            <select
              name="lm_formuleAppel"
              defaultValue={mission?.formuleAppel ?? FORMULES[0]}
              className={champ}
            >
              {FORMULES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span>Date de clôture de l’exercice</span>
            <input
              type="date"
              name="lm_dateClotureExercice"
              defaultValue={mission?.dateClotureExercice?.slice(0, 10) ?? ""}
              className={champ}
            />
          </label>
          <label className="space-y-1">
            <span>Date d’effet du contrat</span>
            <input
              type="date"
              name="lm_dateEffet"
              defaultValue={mission?.dateEffet?.slice(0, 10) ?? ""}
              title="Par défaut : date de début de la mission"
              className={champ}
            />
          </label>
        </div>

        <div className="space-y-1">
          <span>Répartition du capital social (3 lignes max.)</span>
          {[0, 1, 2].map((i) => (
            <div key={i} className="grid grid-cols-3 gap-2">
              <input
                name={`lm_associe_${i}`}
                defaultValue={capital[i]?.associe ?? ""}
                placeholder="Associé"
                className={`${champ} col-span-2`}
              />
              <input
                name={`lm_detention_${i}`}
                defaultValue={capital[i]?.detention ?? ""}
                placeholder="Parts ou %"
                className={champ}
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="space-y-1 sm:col-span-2">
            <span>§4.1 — Période des honoraires</span>
            <input
              name="lm_periodeHonoraires"
              defaultValue={mission?.periodeHonoraires ?? ""}
              placeholder="Par défaut : l’exercice de la mission"
              className={champ}
            />
          </label>
          <label className="space-y-1">
            <span>§4.1 — Frais de débours (%)</span>
            <input
              type="number"
              name="lm_fraisDeboursPct"
              min={0}
              max={100}
              step="0.5"
              defaultValue={mission?.fraisDeboursPct ?? 5}
              className={champ}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span>§4.2 — Rythme de facturation</span>
            <input
              name="lm_rythmeFacturation"
              defaultValue={mission?.rythmeFacturation ?? ""}
              placeholder="Par défaut : facture annuelle"
              className={champ}
            />
          </label>
          <label className="space-y-1">
            <span>§4.2 — Rythme et mode de paiement</span>
            <input
              name="lm_rythmePaiement"
              defaultValue={mission?.rythmePaiement ?? ""}
              placeholder="Par défaut : au comptant, par virement"
              className={champ}
            />
          </label>
        </div>
      </div>
    </details>
  );
}
