"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconArrowLeft,
  IconChevronDown,
  IconPencil,
} from "@tabler/icons-react";
import { apiFetch } from "@/lib/apiFetch";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { ScoringPanel } from "@/components/scoring-panel";
import type { Prospect, StatutKanban, TypeEntite, User } from "@/types";

const KANBAN_LABELS: Record<StatutKanban, string> = {
  PRISE_CONTACT: "Prise de contact",
  DECOUVERTE: "Découverte",
  OPPORTUNITE: "Opportunité",
  LAB: "LAB à effectuer",
  PREPARATION: "Préparation client",
  CONVERTI: "Converti",
  REFUSE: "Refusé",
};

const KANBAN_ACTIFS: StatutKanban[] = [
  "PRISE_CONTACT",
  "DECOUVERTE",
  "OPPORTUNITE",
  "LAB",
  "PREPARATION",
];

export default function ProspectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { can } = useRole();

  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);

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

  useEffect(() => {
    apiFetch<User[]>("/users")
      .then(setUsers)
      .catch(() => setUsers([]));
  }, []);

  async function handleAssignChange(newAssignedToId: string | null) {
    setShowAssignDropdown(false);
    if (!prospect) return;
    const prev = prospect.assignedTo ?? null;
    const nextUser = newAssignedToId
      ? (users.find((u) => u.id === newAssignedToId) ?? null)
      : null;
    setProspect((p) => (p ? { ...p, assignedTo: nextUser } : p));
    try {
      await apiFetch(`/prospects/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ assignedToId: newAssignedToId }),
      });
    } catch {
      setProspect((p) => (p ? { ...p, assignedTo: prev } : p));
    }
  }

  async function handleStatutChange(newStatut: StatutKanban) {
    setShowDropdown(false);
    if (!prospect || prospect.statutKanban === newStatut) return;
    const prev = prospect.statutKanban;
    setProspect((p) => (p ? { ...p, statutKanban: newStatut } : p));
    try {
      await apiFetch(`/prospects/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ statutKanban: newStatut }),
      });
    } catch {
      setProspect((p) => (p ? { ...p, statutKanban: prev } : p));
    }
  }

  async function handleSave(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const data = {
      nom: form.get("nom") as string,
      typeEntite: form.get("typeEntite") as TypeEntite,
      email: (form.get("email") as string) || undefined,
      telephone: (form.get("telephone") as string) || undefined,
      siret: (form.get("siret") as string) || undefined,
      activite: (form.get("activite") as string) || undefined,
      codeNaf: (form.get("codeNaf") as string) || undefined,
      adresse: (form.get("adresse") as string) || undefined,
      ville: (form.get("ville") as string) || undefined,
      pays: (form.get("pays") as string) || undefined,
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

  async function handleConvert() {
    if (
      !window.confirm(
        "Convertir ce prospect en client ? Cette action est irréversible.",
      )
    ) {
      return;
    }

    setConverting(true);
    setError(null);

    try {
      const client = await apiFetch<{ id: string }>(
        `/prospects/${id}/convert`,
        { method: "POST" },
      );

      router.push(`/dashboard/clients/${client.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de convertir le prospect en client.",
      );
      setConverting(false);
    }
  }

  async function handleRefuse() {
    if (!confirm("Refuser ce prospect ?")) return;
    try {
      await apiFetch(`/prospects/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ statutKanban: "REFUSE" }),
      });
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDelete() {
    if (!confirm("Supprimer définitivement ce prospect ?")) return;
    try {
      await apiFetch(`/prospects/${id}`, { method: "DELETE" });
      router.push("/dashboard/prospects");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (loading)
    return (
      <div className="flex h-full items-center justify-center py-20">
        <div className="size-6 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
      </div>
    );

  if (error || !prospect)
    return (
      <div className="p-6 text-sm text-red-600">
        {error ?? "Prospect introuvable"}
      </div>
    );

  const isArchived =
    prospect.statutKanban === "CONVERTI" || prospect.statutKanban === "REFUSE";
  const currentIdx = KANBAN_ACTIFS.indexOf(prospect.statutKanban);

  return (
    <div className="min-h-full bg-slate-50">
      {/* ── Hero header ── */}
      <div
        className="px-5 pt-6 pb-10 md:px-8"
        style={{
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
        }}
      >
        <Link
          href="/dashboard/prospects"
          className="inline-flex items-center gap-1.5 text-indigo-200 hover:text-white text-sm mb-4 transition-colors"
        >
          <IconArrowLeft className="size-4" /> Retour
        </Link>

        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white text-lg font-bold uppercase">
              {prospect.nom.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-white truncate">
                {prospect.nom}
              </h1>
              <p className="text-indigo-200 text-xs font-mono mt-0.5">
                {prospect.ref}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {!isArchived && (
              <>
                <button
                  onClick={() => setEditing(!editing)}
                  className="flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/30 transition-colors"
                >
                  <IconPencil className="size-3.5" /> Éditer
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-1.5 rounded-xl bg-white text-indigo-700 px-3 py-1.5 text-xs font-semibold hover:bg-indigo-50 transition-colors"
                  >
                    {KANBAN_LABELS[prospect.statutKanban]}
                    <IconChevronDown className="size-3.5" />
                  </button>
                  {showDropdown && (
                    <div className="absolute right-0 top-full mt-1 z-20 w-52 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                      {KANBAN_ACTIFS.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatutChange(s)}
                          className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-slate-50
                            ${prospect.statutKanban === s ? "font-semibold text-indigo-700 bg-indigo-50" : "text-slate-700"}`}
                        >
                          {KANBAN_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
            {isArchived && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  prospect.statutKanban === "CONVERTI"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {KANBAN_LABELS[prospect.statutKanban]}
              </span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="px-4 -mt-4 space-y-4 pb-6 md:px-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* ── Colonne gauche ── */}
          <div className="space-y-3">
            {!editing ? (
              <>
                {/* Identité */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/80">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Bloc identité
                    </p>
                  </div>
                  <dl className="divide-y divide-slate-50">
                    {[
                      [
                        "Type",
                        prospect.typeEntite === "PERSONNE_MORALE"
                          ? "Personne morale"
                          : "Personne physique",
                      ],
                      ["SIRET", prospect.siret ?? "—"],
                      ["Code NAF", prospect.codeNaf ?? "—"],
                      ["Secteur", prospect.activite ?? "—"],
                      ["Adresse", prospect.adresse ?? "—"],
                      ["Ville", prospect.ville ?? "—"],
                      ["Pays", prospect.pays],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between px-4 py-2.5"
                      >
                        <dt className="text-xs text-slate-400 shrink-0 w-24">
                          {label}
                        </dt>
                        <dd className="text-sm font-medium text-slate-800 text-right truncate">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {/* Contact */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/80">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Bloc contact
                    </p>
                  </div>
                  <dl className="divide-y divide-slate-50">
                    {[
                      ["Mail", prospect.email ?? "—"],
                      ["Tél", prospect.telephone ?? "—"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between px-4 py-2.5"
                      >
                        <dt className="text-xs text-slate-400 shrink-0 w-24">
                          {label}
                        </dt>
                        <dd className="text-sm font-medium text-slate-800 text-right truncate">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {/* Notes */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/80">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Notes internes
                    </p>
                  </div>
                  <div className="px-4 py-3">
                    {prospect.notes ? (
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">
                        {prospect.notes}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-300 italic">
                        Aucune note
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <form onSubmit={handleSave}>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="nom">
                        Nom / Raison sociale
                      </FieldLabel>
                      <Input
                        id="nom"
                        name="nom"
                        defaultValue={prospect.nom}
                        required
                        className="rounded-xl"
                      />
                    </Field>
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">
                        Type d&apos;entité
                      </p>
                      <div className="flex gap-6">
                        {(
                          [
                            "PERSONNE_MORALE",
                            "PERSONNE_PHYSIQUE",
                          ] as TypeEntite[]
                        ).map((t) => (
                          <label
                            key={t}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="radio"
                              name="typeEntite"
                              value={t}
                              defaultChecked={prospect.typeEntite === t}
                              className="accent-indigo-600 size-4"
                            />
                            <span className="text-sm text-slate-700">
                              {t === "PERSONNE_MORALE"
                                ? "Personne morale"
                                : "Personne physique"}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="email">Email</FieldLabel>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          defaultValue={prospect.email ?? ""}
                          className="rounded-xl"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="telephone">Téléphone</FieldLabel>
                        <Input
                          id="telephone"
                          name="telephone"
                          defaultValue={prospect.telephone ?? ""}
                          className="rounded-xl"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="siret">SIRET</FieldLabel>
                        <Input
                          id="siret"
                          name="siret"
                          defaultValue={prospect.siret ?? ""}
                          className="rounded-xl font-mono"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="activite">Secteur</FieldLabel>
                        <Input
                          id="activite"
                          name="activite"
                          defaultValue={prospect.activite ?? ""}
                          className="rounded-xl"
                        />
                      </Field>
                    </div>
                    <Field>
                      <FieldLabel htmlFor="adresse">Adresse</FieldLabel>
                      <Input
                        id="adresse"
                        name="adresse"
                        defaultValue={prospect.adresse ?? ""}
                        className="rounded-xl"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="notes">Notes</FieldLabel>
                      <textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        defaultValue={prospect.notes ?? ""}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
                      />
                    </Field>
                  </FieldGroup>
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={saving}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                    >
                      {saving ? "Enregistrement…" : "Enregistrer"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setEditing(false)}
                      className="rounded-xl"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* ── Colonne droite — Pipeline ── */}
          <div className="space-y-3">
            {/* Questionnaire */}
            <div className="bg-amber-50 rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-amber-200">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-700">
                  Questionnaire d&apos;acceptation{" "}
                </p>
              </div>
              <div className="px-4 py-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-amber-500" />
                  <p className="text-sm font-medium text-slate-700">
                    Statut :{" "}
                    <span className="text-amber-700 font-semibold">
                      EN COURS
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Link
                    href={`/dashboard/prospects/${id}/questionnaire`}
                    className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
                  >
                    Ouvrir le questionnaire
                  </Link>
                  <span className="text-xs text-slate-400">
                    (RESPONSABLE/EXPERT)
                  </span>
                </div>
                {can.validerQuestionnaire && (
                  <div className="flex items-center gap-4 pt-1 border-t border-amber-200">
                    <button className="text-sm font-semibold text-emerald-600 hover:text-emerald-800">
                      Valider ✓
                    </button>
                    <span className="text-slate-300">|</span>
                    <button className="text-sm font-semibold text-red-500 hover:text-red-700">
                      Refuser ✗
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Score de risque */}
            <ScoringPanel entityType="prospect" entityId={prospect.id} />

            {/* Step visuel */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/80">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Étapes Kanban
                </p>
              </div>
              <div className="px-4 py-4 space-y-2">
                {KANBAN_ACTIFS.map((step, i) => {
                  const isCurrent = prospect.statutKanban === step;
                  const isPast = currentIdx > i;
                  return (
                    <div key={step} className="flex items-center gap-3">
                      <div
                        className={`size-3 rounded-full shrink-0 ${
                          isCurrent
                            ? "bg-indigo-600"
                            : isPast
                              ? "bg-emerald-500"
                              : "border-2 border-slate-300 bg-white"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          isCurrent
                            ? "font-semibold text-indigo-600"
                            : isPast
                              ? "text-emerald-600 line-through"
                              : "text-slate-400"
                        }`}
                      >
                        {KANBAN_LABELS[step]}
                        {isCurrent && (
                          <span className="ml-2 text-xs font-normal text-slate-400">
                            (actuel)
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
                {prospect.statutKanban === "CONVERTI" && (
                  <div className="flex items-center gap-3">
                    <div className="size-3 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-sm font-semibold text-emerald-600">
                      Converti ✓
                    </span>
                  </div>
                )}
                {prospect.statutKanban === "REFUSE" && (
                  <div className="flex items-center gap-3">
                    <div className="size-3 rounded-full bg-red-500 shrink-0" />
                    <span className="text-sm font-semibold text-red-600">
                      Refusé ✗
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Assigné */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/80">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Users assignés
                </p>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(prospect.assignedTo ?? prospect.createdBy) && (
                    <div className="flex size-7 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white uppercase">
                      {(prospect.assignedTo ?? prospect.createdBy)?.prenom?.[0]}
                      {(prospect.assignedTo ?? prospect.createdBy)?.nom?.[0]}
                    </div>
                  )}
                  <p className="text-sm text-slate-700">
                    {prospect.assignedTo
                      ? `${prospect.assignedTo.prenom} ${prospect.assignedTo.nom}`
                      : prospect.createdBy
                        ? `${prospect.createdBy.prenom} ${prospect.createdBy.nom}`
                        : "Non assigné"}
                  </p>
                </div>
                <button
                  onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  {showAssignDropdown ? "[Fermer]" : "[Changer]"}
                </button>
              </div>

              {showAssignDropdown && (
                <div className="border-t border-slate-100 divide-y divide-slate-50 max-h-64 overflow-y-auto">
                  <button
                    onClick={() => handleAssignChange(null)}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-slate-50
                      ${!prospect.assignedTo ? "font-semibold text-indigo-700 bg-indigo-50" : "text-slate-700"}`}
                  >
                    Non assigné
                  </button>
                  {users
                    .filter((u) => u.isActive)
                    .map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleAssignChange(u.id)}
                        className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-slate-50
                          ${prospect.assignedTo?.id === u.id ? "font-semibold text-indigo-700 bg-indigo-50" : "text-slate-700"}`}
                      >
                        {u.prenom} {u.nom}
                        <span className="ml-1 text-xs text-slate-400">
                          — {u.role}
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Actions bas ── */}
        {!isArchived && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <button
                onClick={handleDelete}
                className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
              >
                Supprimer
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={handleRefuse}
                className="text-sm font-medium text-amber-600 hover:text-amber-800 transition-colors"
              >
                Refuser le prospect
              </button>
            </div>
            {can.convertirProspect && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleConvert}
                  disabled={converting}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {converting ? "Conversion…" : "Convertir en client →"}
                </Button>
                <span className="text-xs text-slate-400">(RESPONSABLE)</span>
              </div>
            )}
          </div>
        )}

        {prospect.statutKanban === "CONVERTI" && prospect.client && (
          <div className="flex justify-end">
            <Link
              href={`/dashboard/clients/${prospect.client.id}`}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Voir le dossier client →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
