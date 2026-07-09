"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconArrowLeft,
  IconPencil,
  IconUserCheck,
  IconTrash,
} from "@tabler/icons-react";
import { apiFetch } from "@/lib/apiFetch";
import { StatusBadge } from "@/lib/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import type { Prospect, StatutKanban } from "@/types";

const KANBAN_STATUTS: StatutKanban[] = [
  "PRISE_CONTACT",
  "DECOUVERTE",
  "OPPORTUNITE",
  "LAB",
  "PREPARATION",
  "CONVERTI",
  "REFUSE",
];

export default function ProspectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);

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
    const form = new FormData(e.currentTarget);
    const data = {
      nom: form.get("nom") as string,
      email: (form.get("email") as string) || undefined,
      telephone: (form.get("telephone") as string) || undefined,
      activite: (form.get("activite") as string) || undefined,
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
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatutChange(statutKanban: StatutKanban) {
    try {
      await apiFetch(`/prospects/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ statutKanban }),
      });
      load();
    } catch (err) {
      setError((err as Error).message);
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
        { method: "POST" },
      );
      router.push(`/dashboard/clients/${client.id}`);
    } catch (err) {
      setError((err as Error).message);
      setConverting(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Supprimer ce prospect ?")) return;
    try {
      await apiFetch(`/prospects/${id}`, { method: "DELETE" });
      router.push("/dashboard/prospects");
    } catch (err) {
      setError((err as Error).message);
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

  const isConverti = prospect.statutKanban === "CONVERTI";

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
            <h1 className="text-xl font-semibold">{prospect.nom}</h1>
            <p className="text-sm text-muted-foreground">{prospect.ref}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isConverti ? (
            <select
              value={prospect.statutKanban}
              onChange={(e) =>
                handleStatutChange(e.target.value as StatutKanban)
              }
              className="h-8 rounded-md border border-input bg-background px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              {KANBAN_STATUTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ) : (
            <StatusBadge status={prospect.statutKanban} />
          )}
          <Link
            href={`/dashboard/prospects/${id}/questionnaire`}
            className="text-xs text-primary hover:underline"
          >
            Questionnaire d&apos;acceptation →
          </Link>
          {!isConverti && (
            <Button size="sm" onClick={handleConvert} disabled={converting}>
              <IconUserCheck className="size-4" />
              {converting ? "Conversion…" : "Convertir en client"}
            </Button>
          )}
          {prospect.client && (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/dashboard/clients/${prospect.client.id}`}>
                Voir le dossier client →
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-lg rounded-lg border p-4">
        {!editing ? (
          <div className="space-y-4">
            {!isConverti && (
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(true)}
                >
                  <IconPencil className="size-4" /> Modifier
                </Button>
                <Button size="sm" variant="destructive" onClick={handleDelete}>
                  <IconTrash className="size-4" /> Supprimer
                </Button>
              </div>
            )}
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              {[
                ["Type d'entité", prospect.typeEntite],
                ["SIRET", prospect.siret ?? "—"],
                ["Email", prospect.email ?? "—"],
                ["Téléphone", prospect.telephone ?? "—"],
                ["Secteur / activité", prospect.activite ?? "—"],
                ["Code NAF", prospect.codeNaf ?? "—"],
                [
                  "Adresse",
                  [prospect.adresse, prospect.ville, prospect.codePostal]
                    .filter(Boolean)
                    .join(", ") || "—",
                ],
                ["Pays", prospect.pays],
                ["Assigné à", prospect.assignedTo?.email ?? "—"],
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
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="nom">Raison sociale / Nom</FieldLabel>
                <Input
                  id="nom"
                  name="nom"
                  defaultValue={prospect.nom}
                  required
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
              <Field>
                <FieldLabel htmlFor="activite">Secteur / activité</FieldLabel>
                <Input
                  id="activite"
                  name="activite"
                  defaultValue={prospect.activite ?? ""}
                />
              </Field>
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
