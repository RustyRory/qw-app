"use client";

import { useCallback, useEffect, useState } from "react";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";

import { apiFetch } from "@/lib/apiFetch";
import { PAYS } from "@/lib/pays";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import type { BeneficiaireEffectif } from "@/types";

// Seuil légal de détention à partir duquel une personne est bénéficiaire
// effectif (sauf contrôle par d'autres moyens).
const SEUIL_UBO = 25;

export function BeneficiairesPanel({
  cible,
  cibleId,
  lectureSeule = false,
  onChange,
}: {
  cible: "client" | "prospect";
  cibleId: string;
  lectureSeule?: boolean;
  onChange?: () => void;
}) {
  const [ubos, setUbos] = useState<BeneficiaireEffectif[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BeneficiaireEffectif | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pourcentage, setPourcentage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<BeneficiaireEffectif[]>(`/beneficiaires/${cible}/${cibleId}`)
      .then(setUbos)
      .catch(() => setUbos([]))
      .finally(() => setLoading(false));
  }, [cible, cibleId]);

  useEffect(() => {
    load();
  }, [load]);

  const total = ubos.reduce((s, u) => s + Number(u.pourcentageDetention), 0);

  function ouvrir(ubo: BeneficiaireEffectif | null) {
    setEditing(ubo);
    setPourcentage(ubo ? String(Number(ubo.pourcentageDetention)) : "");
    setError(null);
    setFormOpen(true);
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const texte = (cle: string) =>
      ((form.get(cle) as string | null) ?? "").trim() || undefined;
    const body = {
      nom: texte("nom"),
      prenom: texte("prenom"),
      dateNaissance: texte("dateNaissance"),
      nationalite: texte("nationalite"),
      adresse: texte("adresse"),
      pourcentageDetention: Number(pourcentage),
      ppe: form.get("ppe") === "on",
    };
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await apiFetch(`/beneficiaires/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/beneficiaires", {
          method: "POST",
          body: JSON.stringify({
            ...body,
            [cible === "client" ? "clientId" : "prospectId"]: cibleId,
          }),
        });
      }
      setFormOpen(false);
      load();
      onChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(ubo: BeneficiaireEffectif) {
    if (!window.confirm(`Supprimer ${ubo.prenom ?? ""} ${ubo.nom} ?`)) return;
    try {
      await apiFetch(`/beneficiaires/${ubo.id}`, { method: "DELETE" });
      load();
      onChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const pct = Number(pourcentage);
  const sousSeuil = pourcentage !== "" && pct < SEUIL_UBO;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Bénéficiaires effectifs
          </p>
          {ubos.length > 0 && (
            <p
              className={`text-xs ${total > 100 ? "text-red-600" : "text-slate-400"}`}
            >
              Total détenu : {Math.round(total * 100) / 100} %
            </p>
          )}
        </div>
        {!lectureSeule && !formOpen && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => ouvrir(null)}
            className="rounded-lg"
          >
            <IconPlus className="size-4" />
            Ajouter
          </Button>
        )}
      </div>

      {error && (
        <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="space-y-3 border-b border-slate-100 bg-slate-50 px-4 py-4"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="ubo-nom">Nom *</FieldLabel>
              <Input
                id="ubo-nom"
                name="nom"
                required
                defaultValue={editing?.nom ?? ""}
                className="rounded-xl bg-white"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ubo-prenom">Prénom</FieldLabel>
              <Input
                id="ubo-prenom"
                name="prenom"
                defaultValue={editing?.prenom ?? ""}
                className="rounded-xl bg-white"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ubo-naissance">Date de naissance</FieldLabel>
              <Input
                id="ubo-naissance"
                name="dateNaissance"
                type="date"
                defaultValue={editing?.dateNaissance?.slice(0, 10) ?? ""}
                className="rounded-xl bg-white"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ubo-nationalite">Nationalité</FieldLabel>
              <select
                id="ubo-nationalite"
                name="nationalite"
                defaultValue={editing?.nationalite ?? "France"}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              >
                {editing?.nationalite &&
                  !PAYS.includes(editing.nationalite) && (
                    <option value={editing.nationalite}>
                      {editing.nationalite}
                    </option>
                  )}
                {PAYS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="ubo-pct">% de détention *</FieldLabel>
              <Input
                id="ubo-pct"
                type="number"
                min={0}
                max={100}
                step="0.01"
                required
                value={pourcentage}
                onChange={(e) => setPourcentage(e.target.value)}
                className="rounded-xl bg-white"
              />
              {sousSeuil && (
                <p className="mt-1 text-xs text-amber-700">
                  Sous le seuil légal de {SEUIL_UBO} % : ne saisir que si cette
                  personne contrôle la société par d’autres moyens.
                </p>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="ubo-adresse">Adresse</FieldLabel>
              <Input
                id="ubo-adresse"
                name="adresse"
                defaultValue={editing?.adresse ?? ""}
                className="rounded-xl bg-white"
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="ppe"
              defaultChecked={editing?.ppe ?? false}
            />
            Personne politiquement exposée (PPE)
          </label>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormOpen(false)}
              className="rounded-xl"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={saving} className="rounded-xl">
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="p-6 text-center text-sm text-slate-400">
          Chargement…
        </div>
      ) : ubos.length === 0 ? (
        <div className="p-6 text-center text-sm text-slate-400">
          Aucun bénéficiaire effectif saisi
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {ubos.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between gap-2 px-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-800">
                  {u.prenom} {u.nom}
                  {u.ppe && (
                    <span className="ml-2 rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-semibold text-red-700">
                      PPE
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-400">
                  {Number(u.pourcentageDetention)} % ·{" "}
                  {u.nationalite ?? "nationalité non renseignée"}
                </p>
              </div>
              {!lectureSeule && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => ouvrir(u)}
                    aria-label={`Modifier ${u.nom}`}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  >
                    <IconEdit className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(u)}
                    aria-label={`Supprimer ${u.nom}`}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                  >
                    <IconTrash className="size-4" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
