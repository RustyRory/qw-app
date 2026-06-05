"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft, IconPencil, IconUserCheck } from "@tabler/icons-react";
import { apiFetch } from "@/lib/apiFetch";
import { useAuth } from "@/hooks/useAuth";
import { StatusBadge } from "@/lib/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import type { Prospect } from "@/types";

export default function ProspectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { role } = useAuth();
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch<Prospect>(`/prospects/${id}`)
      .then(setProspect)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleSave(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setEditError(null);
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
      await apiFetch(`/prospects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      setEditing(false);
      load();
    } catch (err) {
      setEditError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleConvert() {
    if (
      !confirm(
        "Convertir ce prospect en client ? Cette action est irréversible.",
      )
    )
      return;
    setConverting(true);
    try {
      const client = await apiFetch<{ id: string }>(
        `/prospects/${id}/convert`,
        {
          method: "POST",
        },
      );
      router.push(`/dashboard/clients/${client.id}`);
    } catch (err) {
      setError((err as Error).message);
      setConverting(false);
    }
  }

  if (loading)
    return <div className="p-6 text-sm text-muted-foreground">Chargement…</div>;
  if (error || !prospect)
    return (
      <div className="p-6 text-sm text-destructive">
        {error ?? "Prospect introuvable"}
      </div>
    );

  const isConverti = prospect.statut === "converti";
  const canEdit = !isConverti;
  const canConvert =
    !isConverti &&
    (role === "admin" || role === "responsable" || role === "collaborateur");

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/prospects"
            className="text-muted-foreground hover:text-foreground"
          >
            <IconArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">
              {prospect.prenom} {prospect.nom}
            </h1>
            {prospect.raisonSociale && (
              <p className="text-sm text-muted-foreground">
                {prospect.raisonSociale}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={prospect.statut} />
          {canConvert && (
            <Button size="sm" onClick={handleConvert} disabled={converting}>
              <IconUserCheck className="size-4" />
              {converting ? "Conversion…" : "Convertir en client"}
            </Button>
          )}
          {isConverti && prospect.clientId && (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/dashboard/clients/${prospect.clientId}`}>
                Voir le dossier client →
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-lg rounded-lg border p-4">
        {!editing ? (
          <div className="space-y-4">
            {canEdit && (
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(true)}
                >
                  <IconPencil className="size-4" /> Modifier
                </Button>
              </div>
            )}
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              {[
                ["Prénom", prospect.prenom],
                ["Nom", prospect.nom],
                ["Raison sociale", prospect.raisonSociale ?? "—"],
                ["Email", prospect.email ?? "—"],
                ["Téléphone", prospect.telephone ?? "—"],
                ["Secteur d'activité", prospect.secteurActivite ?? "—"],
                ["Pays de résidence", prospect.paysResidence ?? "—"],
                ["PEP", prospect.estPep ? "Oui" : "Non"],
                [
                  "Créé le",
                  new Date(prospect.createdAt).toLocaleDateString("fr-FR"),
                ],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="mt-0.5 font-medium">{value}</dd>
                </div>
              ))}
              {prospect.notes && (
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground">Notes</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-sm">
                    {prospect.notes}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {editError && (
              <div className="rounded bg-destructive/10 p-2 text-sm text-destructive">
                {editError}
              </div>
            )}
            <FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="prenom">Prénom</FieldLabel>
                  <Input
                    id="prenom"
                    name="prenom"
                    defaultValue={prospect.prenom}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="nom">Nom</FieldLabel>
                  <Input
                    id="nom"
                    name="nom"
                    defaultValue={prospect.nom}
                    required
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="raisonSociale">Raison sociale</FieldLabel>
                <Input
                  id="raisonSociale"
                  name="raisonSociale"
                  defaultValue={prospect.raisonSociale ?? ""}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={prospect.email ?? ""}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="telephone">Téléphone</FieldLabel>
                <Input
                  id="telephone"
                  name="telephone"
                  defaultValue={prospect.telephone ?? ""}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="secteurActivite">
                    Secteur d&apos;activité
                  </FieldLabel>
                  <Input
                    id="secteurActivite"
                    name="secteurActivite"
                    defaultValue={prospect.secteurActivite ?? ""}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="paysResidence">
                    Pays de résidence
                  </FieldLabel>
                  <Input
                    id="paysResidence"
                    name="paysResidence"
                    defaultValue={prospect.paysResidence ?? ""}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="notes">Notes</FieldLabel>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  defaultValue={prospect.notes ?? ""}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="estPep"
                  defaultChecked={prospect.estPep}
                  className="size-4"
                />
                Personne politiquement exposée (PEP)
              </label>
            </FieldGroup>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Enregistrement…" : "Enregistrer"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setEditing(false)}
              >
                Annuler
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
