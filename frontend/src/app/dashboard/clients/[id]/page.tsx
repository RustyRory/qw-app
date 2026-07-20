"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconArrowLeft,
  IconPencil,
  IconRefresh,
  IconUpload,
  IconPlus,
  IconEye,
  IconTrash,
  IconCheck,
  IconBuilding,
  IconIdBadge2,
  IconUsersGroup,
  IconAddressBook,
  IconChartBar,
  IconBriefcase,
  IconCalendarEvent,
  IconClipboardCheck,
  IconAlertTriangle,
  IconChevronRight,
  IconX,
} from "@tabler/icons-react";
import { apiFetch } from "@/lib/apiFetch";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { StatusBadge, RiskBadge } from "@/lib/status";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import type {
  Client,
  ScoreRisque,
  AuditLog,
  BeneficiaireEffectif,
  Contact,
  Document,
  StatutClient,
  StatutKyc,
  NiveauRisque,
  Mission,
  PlanningEtape,
  Obligation,
  OperationSensible,
  TypeMission,
  TypePlanningEtape,
  TypeObligation,
  TypeOperationSensible,
  TypeContact,
  User,
} from "@/types";

const TABS = [
  { id: "infos", label: "Infos", icon: IconBuilding },
  { id: "kyc", label: "KYC & Docs", icon: IconIdBadge2 },
  { id: "ubo", label: "UBO", icon: IconUsersGroup },
  { id: "contacts", label: "Contacts", icon: IconAddressBook },
  { id: "scoring", label: "Scoring", icon: IconChartBar },
  { id: "missions", label: "Missions", icon: IconBriefcase },
  { id: "planning", label: "Planning", icon: IconCalendarEvent },
  { id: "obligations", label: "Obligations", icon: IconClipboardCheck },
  { id: "operations", label: "Opérations", icon: IconAlertTriangle },
] as const;

function HeaderBadge({ color, label }: { color: string; label: string }) {
  return (
    <span className={`flex items-center gap-1 text-xs font-semibold ${color}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function Modal({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
      />

      <div className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-white/20 bg-white shadow-2xl sm:max-w-xl sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
          <div>
            <h2 className="font-semibold text-slate-900">{title}</h2>
            {description && (
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
          >
            <IconX className="size-5" />
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function FormActions({
  saving,
  submitLabel,
  onCancel,
}: {
  saving: boolean;
  submitLabel: string;
  onCancel: () => void;
}) {
  return (
    <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={saving}
        className="h-11 rounded-xl"
      >
        Annuler
      </Button>

      <Button
        type="submit"
        disabled={saving}
        className="h-11 rounded-xl bg-gradient-to-r from-indigo-700 to-violet-700 text-white"
      >
        {saving ? "Enregistrement…" : submitLabel}
      </Button>
    </div>
  );
}

// ─── Onglet Infos ─────────────────────────────────────────────────────────────
function TabInfos({
  client,
  score,
  audit,
  onRefresh,
}: {
  client: Client;
  score?: ScoreRisque | null;
  audit: AuditLog[];
  onRefresh: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const data = {
      raisonSociale: form.get("raisonSociale") as string,
      chiffreAffaires: form.get("chiffreAffaires")
        ? Number(form.get("chiffreAffaires"))
        : undefined,
      effectif: form.get("effectif") ? Number(form.get("effectif")) : undefined,
      natureMission: (form.get("natureMission") as string) || undefined,
      adresseSiege: (form.get("adresseSiege") as string) || undefined,
      ville: (form.get("ville") as string) || undefined,
    };
    try {
      await apiFetch(`/clients/${client.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      setEditing(false);
      onRefresh();
    } finally {
      setSaving(false);
    }
  }

  if (editing)
    return (
      <form onSubmit={handleSave} className="space-y-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="raisonSociale">Raison sociale</FieldLabel>
              <Input
                id="raisonSociale"
                name="raisonSociale"
                defaultValue={client.raisonSociale}
                required
                className="rounded-xl"
              />
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="chiffreAffaires">CA annuel (€)</FieldLabel>
                <Input
                  id="chiffreAffaires"
                  name="chiffreAffaires"
                  type="number"
                  defaultValue={client.chiffreAffaires ?? ""}
                  className="rounded-xl"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="effectif">Effectif</FieldLabel>
                <Input
                  id="effectif"
                  name="effectif"
                  type="number"
                  defaultValue={client.effectif ?? ""}
                  className="rounded-xl"
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="adresseSiege">Adresse</FieldLabel>
              <Input
                id="adresseSiege"
                name="adresseSiege"
                defaultValue={client.adresseSiege ?? ""}
                className="rounded-xl"
              />
            </Field>
          </FieldGroup>
          <div className="flex gap-2">
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="bg-slate-800 text-white rounded-xl"
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
    );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors"
        >
          <IconPencil className="size-3.5" /> Modifier
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Identification */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/80">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Identification
            </p>
          </div>
          <dl className="divide-y divide-slate-50">
            {[
              [
                "Raison sociale",
                <strong key="rs">{client.raisonSociale}</strong>,
              ],
              ["SIRET", client.siret ?? "—"],
              ["SIREN", client.siren ?? "—"],
              ["Forme juridique", client.formeJuridique ?? "—"],
              ["Code NAF", client.codeNaf ?? "—"],
              [
                "Créée le",
                client.dateCreationEntreprise
                  ? new Date(client.dateCreationEntreprise).toLocaleDateString(
                      "fr-FR",
                    )
                  : "—",
              ],
            ].map(([label, value]) => (
              <div
                key={label as string}
                className="flex items-center px-4 py-2.5"
              >
                <dt className="w-32 shrink-0 text-xs text-slate-400">
                  {label}
                </dt>
                <dd className="text-sm text-slate-800">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Situation économique */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/80">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Situation économique
              </p>
            </div>
            <dl className="divide-y divide-slate-50">
              {[
                [
                  "CA annuel",
                  client.chiffreAffaires
                    ? `${client.chiffreAffaires.toLocaleString("fr-FR")} €`
                    : "—",
                ],
                [
                  "Effectif",
                  client.effectif ? `${client.effectif} salariés` : "—",
                ],
                ["Nature mission", client.natureMission ?? "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center px-4 py-2.5">
                  <dt className="w-32 shrink-0 text-xs text-slate-400">
                    {label}
                  </dt>
                  <dd className="text-sm font-medium text-slate-800">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="px-4 py-3 border-t border-slate-100">
              <button
                onClick={onRefresh}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                <IconRefresh className="size-3.5" /> Actualiser SIRENE
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Adresse */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/80">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Adresse du siège
          </p>
        </div>
        <p className="px-4 py-3 text-sm text-slate-700">
          {[client.adresseSiege, client.codePostal, client.ville, client.pays]
            .filter(Boolean)
            .join(" — ") || "—"}
        </p>
      </div>

      {/* Audit trail */}
      {audit.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100">
            <p className="text-xs font-bold uppercase tracking-widest text-violet-500">
              Audit trail (10 dernières actions)
            </p>
          </div>
          <div className="divide-y divide-slate-50">
            {audit.slice(0, 10).map((log) => (
              <div key={log.id} className="flex items-center gap-3 px-4 py-3">
                {log.utilisateur && (
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold uppercase text-slate-600">
                    {log.utilisateur.prenom?.[0]}
                    {log.utilisateur.nom?.[0]}
                  </div>
                )}
                <p className="flex-1 text-sm text-slate-700">
                  <span className="font-semibold">
                    {log.utilisateur
                      ? `${log.utilisateur.prenom} ${log.utilisateur.nom[0]}.`
                      : "Système"}
                  </span>{" "}
                  <span className="text-slate-500">{log.action}</span>
                </p>
                <span className="shrink-0 text-xs text-slate-400">
                  {new Date(log.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Onglet KYC ───────────────────────────────────────────────────────────────
function TabKyc({
  client,
  onRefresh,
}: {
  client: Client;
  onRefresh: () => void;
}) {
  const { can } = useRole();
  const [docs, setDocs] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    apiFetch<Document[]>(`/documents/client/${client.id}`)
      .then(setDocs)
      .catch(() => {});
  }, [client.id]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    body.append("type", "AUTRE");
    try {
      await apiFetch(`/documents/client/${client.id}`, {
        method: "POST",
        body,
      });
      const updated = await apiFetch<Document[]>(
        `/documents/client/${client.id}`,
      );
      setDocs(updated);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const kycItems = [
    { label: "PPE vérifié", ok: true },
    {
      label: `Screening : ${client.screeningStatut === "OK" ? "✅ OK" : "⚠️ " + client.screeningStatut}`,
      ok: client.screeningStatut === "OK",
    },
    { label: "Bénéficiaires effectifs saisis", ok: client.uboSaisi },
    { label: "Documents uploadés", ok: docs.length > 0 },
  ];
  const okCount = kycItems.filter((i) => i.ok).length;

  return (
    <div className="space-y-4">
      {/* Checklist */}
      <div className="bg-amber-50 rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-amber-200">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-700">
            Checklist KYC
          </p>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 rounded-full bg-amber-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500"
                style={{ width: `${(okCount / kycItems.length) * 100}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-amber-700">
              {okCount}/{kycItems.length}
            </span>
          </div>
        </div>
        <div className="px-4 py-4 space-y-2">
          {kycItems.map(({ label, ok }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-base">{ok ? "✅" : "❌"}</span>
              <span className="text-sm text-slate-700">{label}</span>
            </div>
          ))}
          {can.validerQuestionnaire && client.kycStatut !== "VALIDE" && (
            <button
              onClick={async () => {
                await apiFetch(`/clients/${client.id}/kyc/valider`, {
                  method: "PATCH",
                });
                onRefresh();
              }}
              className="mt-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              [Valider KYC ✓] (RESPONSABLE)
            </button>
          )}
        </div>
      </div>

      {/* Données KYC */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/80">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Données KYC
          </p>
        </div>
        <div className="px-4 py-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-slate-600">
              PPE : <strong>{client.ppe ? "Oui ⚠️" : "Non"}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600">
              Screening :{" "}
              <span
                className={
                  client.screeningStatut === "OK"
                    ? "text-emerald-600 font-semibold"
                    : "text-amber-600 font-semibold"
                }
              >
                ● {client.screeningStatut}
                {client.screeningDate &&
                  ` (${new Date(client.screeningDate).toLocaleDateString("fr-FR")})`}
              </span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600">
              UBO saisi : <strong>{client.uboSaisi ? "Oui" : "Non"}</strong>
            </span>
          </div>
          <div className="flex gap-4 mt-3">
            <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              [Modifier PPE]
            </button>
            <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              [Relancer screening]
            </button>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Documents
          </p>
          <label className="cursor-pointer">
            <input
              type="file"
              className="sr-only"
              onChange={handleUpload}
              disabled={uploading}
            />
            <span className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 transition-colors">
              <IconUpload className="size-3.5" />
              {uploading ? "Upload…" : "Uploader"}
            </span>
          </label>
        </div>
        {docs.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            Aucun document
          </div>
        ) : (
          <>
            {/* Desktop */}
            <table className="hidden md:table w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Type", "Nom", "Taille", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {docs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {doc.typeMime}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {doc.nomFichier}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {Math.round(doc.taille / 1024)} Ko
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/api/documents/${doc.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          <IconEye className="size-4" />
                        </a>
                        <button className="text-slate-400 hover:text-red-500 transition-colors">
                          <IconTrash className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Mobile */}
            <div className="md:hidden divide-y divide-slate-100">
              {docs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 text-xs font-bold uppercase">
                    {doc.nomFichier.split(".").pop()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {doc.nomFichier}
                    </p>
                    <p className="text-xs text-slate-400">
                      {Math.round(doc.taille / 1024)} Ko
                    </p>
                  </div>
                  <a
                    href={`/api/documents/${doc.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-blue-600"
                  >
                    <IconEye className="size-4" />
                  </a>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Onglet UBO ───────────────────────────────────────────────────────────────
function TabUbo({
  clientId,
  onRefresh,
}: {
  clientId: string;
  onRefresh: () => void;
}) {
  const [ubos, setUbos] = useState<BeneficiaireEffectif[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BeneficiaireEffectif | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<BeneficiaireEffectif[]>(`/beneficiaires/client/${clientId}`)
      .then(setUbos)
      .catch((err: Error) => {
        setError(err.message);
        setUbos([]);
      })
      .finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  const total = ubos.reduce(
    (sum, ubo) => sum + Number(ubo.pourcentageDetention),
    0,
  );

  function openCreate() {
    setEditing(null);
    setError(null);
    setFormOpen(true);
  }

  function openEdit(ubo: BeneficiaireEffectif) {
    setEditing(ubo);
    setError(null);
    setFormOpen(true);
  }

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const form = new FormData(event.currentTarget);

    const payload = {
      ...(editing ? {} : { clientId }),
      nom: String(form.get("nom") ?? "").trim(),
      prenom: String(form.get("prenom") ?? "").trim() || undefined,
      dateNaissance:
        String(form.get("dateNaissance") ?? "").trim() || undefined,
      nationalite: String(form.get("nationalite") ?? "").trim() || undefined,
      adresse: String(form.get("adresse") ?? "").trim() || undefined,
      pourcentageDetention: Number(form.get("pourcentageDetention")),
      ppe: form.get("ppe") === "on",
    };

    try {
      await apiFetch(
        editing ? `/beneficiaires/${editing.id}` : "/beneficiaires",
        {
          method: editing ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );

      setFormOpen(false);
      setEditing(null);
      setLoading(true);
      load();
      onRefresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d’enregistrer le bénéficiaire.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Supprimer ce bénéficiaire effectif ?")) return;

    try {
      await apiFetch(`/beneficiaires/${id}`, { method: "DELETE" });
      setLoading(true);
      load();
      onRefresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer le bénéficiaire.",
      );
    }
  }

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-violet-700">
              Bénéficiaires effectifs
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Personnes détenant directement ou indirectement plus de 25 % du
              capital.
            </p>
          </div>

          <Button
            size="sm"
            onClick={openCreate}
            className="w-full rounded-xl bg-violet-700 text-white sm:w-auto"
          >
            <IconPlus className="size-4" />
            Ajouter UBO
          </Button>
        </div>

        {error && !formOpen && (
          <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">
            Chargement des bénéficiaires…
          </div>
        ) : ubos.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            Aucun bénéficiaire effectif saisi
          </div>
        ) : (
          <>
            <div className="grid gap-3 p-4">
              {ubos.map((ubo) => (
                <article
                  key={ubo.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-violet-200 hover:bg-violet-50/20"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">
                          {[ubo.prenom, ubo.nom].filter(Boolean).join(" ")}
                        </p>

                        <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                          {Number(ubo.pourcentageDetention)} %
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            ubo.ppe
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          PPE : {ubo.ppe ? "Oui" : "Non"}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                        <p>
                          Date de naissance :{" "}
                          {ubo.dateNaissance
                            ? new Date(ubo.dateNaissance).toLocaleDateString(
                                "fr-FR",
                              )
                            : "—"}
                        </p>
                        <p>Nationalité : {ubo.nationalite ?? "—"}</p>
                        {ubo.adresse && (
                          <p className="sm:col-span-2">
                            Adresse : {ubo.adresse}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(ubo)}
                        className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
                      >
                        Modifier
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(ubo.id)}
                        className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="border-t border-amber-100 bg-amber-50 px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-amber-800">
                  Total détenu
                </p>
                <p className="font-bold text-amber-800">{total} % / 100 %</p>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-amber-200">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{ width: `${Math.min(total, 100)}%` }}
                />
              </div>
            </div>
          </>
        )}
      </section>

      {formOpen && (
        <Modal
          title={editing ? "Modifier un UBO" : "Ajouter un UBO"}
          description="Renseignez l’identité et le pourcentage de détention du bénéficiaire."
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        >
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="ubo-prenom">Prénom</FieldLabel>
                  <Input
                    id="ubo-prenom"
                    name="prenom"
                    defaultValue={editing?.prenom ?? ""}
                    className="h-11 rounded-xl"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="ubo-nom">Nom *</FieldLabel>
                  <Input
                    id="ubo-nom"
                    name="nom"
                    defaultValue={editing?.nom ?? ""}
                    className="h-11 rounded-xl"
                    required
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="ubo-date">Date de naissance</FieldLabel>
                  <Input
                    id="ubo-date"
                    name="dateNaissance"
                    type="date"
                    defaultValue={editing?.dateNaissance?.slice(0, 10) ?? ""}
                    className="h-11 rounded-xl"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="ubo-nationalite">Nationalité</FieldLabel>
                  <Input
                    id="ubo-nationalite"
                    name="nationalite"
                    defaultValue={editing?.nationalite ?? ""}
                    className="h-11 rounded-xl"
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="ubo-adresse">Adresse</FieldLabel>
                <Input
                  id="ubo-adresse"
                  name="adresse"
                  defaultValue={editing?.adresse ?? ""}
                  className="h-11 rounded-xl"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="ubo-detention">
                  Pourcentage de détention *
                </FieldLabel>
                <Input
                  id="ubo-detention"
                  name="pourcentageDetention"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  defaultValue={editing?.pourcentageDetention ?? ""}
                  className="h-11 rounded-xl"
                  required
                />
              </Field>

              <label className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <input
                  type="checkbox"
                  name="ppe"
                  defaultChecked={editing?.ppe ?? false}
                  className="mt-0.5 size-4 accent-amber-600"
                />
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    Personne politiquement exposée (PPE)
                  </p>
                  <p className="mt-1 text-xs text-amber-700">
                    Cochez cette case lorsque le bénéficiaire est identifié
                    comme PPE.
                  </p>
                </div>
              </label>
            </FieldGroup>

            <FormActions
              saving={saving}
              submitLabel={editing ? "Mettre à jour" : "Ajouter"}
              onCancel={() => {
                setFormOpen(false);
                setEditing(null);
              }}
            />
          </form>
        </Modal>
      )}
    </>
  );
}

// ─── Onglet Contacts ──────────────────────────────────────────────────────────
const CONTACT_LABELS: Record<TypeContact, string> = {
  INTERVENANT: "Intervenant",
  AVOCAT: "Avocat",
  COMMISSAIRE_COMPTES: "Commissaire aux comptes",
  NOTAIRE: "Notaire",
  AUTRE: "Autre",
};

function TabContacts({ clientId }: { clientId: string }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<Contact[]>(`/contacts/client/${clientId}`)
      .then(setContacts)
      .catch((err: Error) => {
        setError(err.message);
        setContacts([]);
      })
      .finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setError(null);
    setFormOpen(true);
  }

  function openEdit(contact: Contact) {
    setEditing(contact);
    setError(null);
    setFormOpen(true);
  }

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const form = new FormData(event.currentTarget);

    const payload = {
      ...(editing ? {} : { clientId }),
      nom: String(form.get("nom") ?? "").trim(),
      prenom: String(form.get("prenom") ?? "").trim() || undefined,
      email: String(form.get("email") ?? "").trim() || undefined,
      telephone: String(form.get("telephone") ?? "").trim() || undefined,
      type: form.get("type") as TypeContact,
      roleDetail: String(form.get("roleDetail") ?? "").trim() || undefined,
    };

    try {
      await apiFetch(editing ? `/contacts/${editing.id}` : "/contacts", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });

      setFormOpen(false);
      setEditing(null);
      setLoading(true);
      load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d’enregistrer le contact.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Supprimer ce contact ?")) return;

    try {
      await apiFetch(`/contacts/${id}`, { method: "DELETE" });
      setLoading(true);
      load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer le contact.",
      );
    }
  }

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-cyan-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-cyan-100 bg-gradient-to-r from-cyan-50 to-blue-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-800">
              Contacts du client
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Intervenants et professionnels associés au dossier.
            </p>
          </div>

          <Button
            size="sm"
            onClick={openCreate}
            className="w-full rounded-xl bg-cyan-700 text-white sm:w-auto"
          >
            <IconPlus className="size-4" />
            Ajouter
          </Button>
        </div>

        {error && !formOpen && (
          <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">
            Chargement des contacts…
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            Aucun contact enregistré
          </div>
        ) : (
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            {contacts.map((contact) => (
              <article
                key={contact.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-cyan-200 hover:bg-cyan-50/20"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-bold uppercase text-white">
                    {contact.prenom?.[0] ?? ""}
                    {contact.nom?.[0] ?? ""}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">
                      {[contact.prenom, contact.nom].filter(Boolean).join(" ")}
                    </p>

                    <span className="mt-2 inline-flex rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-700">
                      {CONTACT_LABELS[contact.type]}
                    </span>

                    <div className="mt-3 space-y-1 text-xs text-slate-500">
                      {contact.roleDetail && <p>{contact.roleDetail}</p>}
                      {contact.email && (
                        <p className="break-all">{contact.email}</p>
                      )}
                      {contact.telephone && <p>{contact.telephone}</p>}
                    </div>

                    <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => openEdit(contact)}
                        className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(contact.id)}
                        className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {formOpen && (
        <Modal
          title={editing ? "Modifier le contact" : "Ajouter un contact"}
          description="Renseignez les coordonnées et la fonction du contact."
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        >
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="contact-prenom">Prénom</FieldLabel>
                  <Input
                    id="contact-prenom"
                    name="prenom"
                    defaultValue={editing?.prenom ?? ""}
                    className="h-11 rounded-xl"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="contact-nom">Nom *</FieldLabel>
                  <Input
                    id="contact-nom"
                    name="nom"
                    defaultValue={editing?.nom ?? ""}
                    className="h-11 rounded-xl"
                    required
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="contact-email">E-mail</FieldLabel>
                  <Input
                    id="contact-email"
                    name="email"
                    type="email"
                    defaultValue={editing?.email ?? ""}
                    className="h-11 rounded-xl"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="contact-telephone">Téléphone</FieldLabel>
                  <Input
                    id="contact-telephone"
                    name="telephone"
                    defaultValue={editing?.telephone ?? ""}
                    className="h-11 rounded-xl"
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="contact-type">
                  Type de contact *
                </FieldLabel>
                <select
                  id="contact-type"
                  name="type"
                  defaultValue={editing?.type ?? "AUTRE"}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  required
                >
                  {Object.entries(CONTACT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field>
                <FieldLabel htmlFor="contact-role">Fonction / rôle</FieldLabel>
                <Input
                  id="contact-role"
                  name="roleDetail"
                  defaultValue={editing?.roleDetail ?? ""}
                  className="h-11 rounded-xl"
                />
              </Field>
            </FieldGroup>

            <FormActions
              saving={saving}
              submitLabel={editing ? "Mettre à jour" : "Ajouter"}
              onCancel={() => {
                setFormOpen(false);
                setEditing(null);
              }}
            />
          </form>
        </Modal>
      )}
    </>
  );
}

// ─── Onglet Scoring ───────────────────────────────────────────────────────────
function TabScoring({
  clientId,
  onRefresh,
}: {
  clientId: string;
  onRefresh: () => void;
}) {
  const [scores, setScores] = useState<ScoreRisque[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<ScoreRisque[]>(`/scoring/client/${clientId}`)
      .then(setScores)
      .catch((err: Error) => {
        setError(err.message);
        setScores([]);
      })
      .finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const form = new FormData(event.currentTarget);

    const payload = {
      clientId,
      clientCaracteristiques: Number(form.get("clientCaracteristiques")),
      activiteSecteur: Number(form.get("activiteSecteur")),
      zoneGeographique: Number(form.get("zoneGeographique")),
      typeMission: Number(form.get("typeMission")),
    };

    try {
      await apiFetch("/scoring", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setFormOpen(false);
      setLoading(true);
      load();
      onRefresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de calculer le score.",
      );
    } finally {
      setSaving(false);
    }
  }

  const latest = scores[0];
  const niveauColor: Record<NiveauRisque, string> = {
    ELEVE: "text-red-600",
    MOYEN: "text-amber-600",
    FAIBLE: "text-emerald-600",
  };
  const barColor: Record<NiveauRisque, string> = {
    ELEVE: "bg-red-500",
    MOYEN: "bg-amber-500",
    FAIBLE: "bg-emerald-500",
  };

  return (
    <>
      <div className="space-y-4">
        <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-800">
                Score de risque
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Évaluation ARPEC sur un total de 150 points.
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setError(null);
                setFormOpen(true);
              }}
              className="w-full rounded-xl bg-blue-700 text-white sm:w-auto"
            >
              <IconRefresh className="size-4" />
              {latest ? "Recalculer" : "Évaluer"}
            </Button>
          </div>

          {error && !formOpen && (
            <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-400">
              Chargement du scoring…
            </div>
          ) : latest ? (
            <div className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Score courant
                  </p>
                  <p
                    className={`mt-2 text-4xl font-bold ${niveauColor[latest.niveau]}`}
                  >
                    {latest.score}
                    <span className="text-lg font-normal text-slate-400">
                      {" "}
                      / 150
                    </span>
                  </p>
                </div>
                <RiskBadge level={latest.niveau} />
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${barColor[latest.niveau]}`}
                  style={{
                    width: `${Math.min((latest.score / 150) * 100, 100)}%`,
                  }}
                />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  [
                    "Caractéristiques client",
                    latest.reponses.clientCaracteristiques,
                    50,
                  ],
                  ["Activité / secteur", latest.reponses.activiteSecteur, 40],
                  ["Zone géographique", latest.reponses.zoneGeographique, 30],
                  ["Type de mission", latest.reponses.typeMission, 30],
                ].map(([label, value, max]) => (
                  <div
                    key={String(label)}
                    className="rounded-xl bg-slate-50 p-3"
                  >
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-slate-600">{label}</span>
                      <span className="font-mono font-semibold text-slate-700">
                        {String(value)} / {String(max)}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{
                          width: `${(Number(value) / Number(max)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-xs text-slate-400">
                Calculé le{" "}
                {new Date(latest.createdAt).toLocaleDateString("fr-FR")}
              </p>
            </div>
          ) : (
            <div className="p-10 text-center text-sm text-slate-400">
              Aucun score calculé pour ce client
            </div>
          )}
        </section>

        {scores.length > 1 && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Historique
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {scores.slice(1).map((score) => (
                <div
                  key={score.id}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {score.score} / 150
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(score.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <RiskBadge level={score.niveau} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {formOpen && (
        <Modal
          title="Calculer le score de risque"
          description="Attribuez une note à chacune des quatre dimensions ARPEC."
          onClose={() => setFormOpen(false)}
        >
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <FieldGroup>
              {[
                ["clientCaracteristiques", "Caractéristiques du client", 50],
                ["activiteSecteur", "Activité et secteur", 40],
                ["zoneGeographique", "Zone géographique", 30],
                ["typeMission", "Type de mission", 30],
              ].map(([name, label, max]) => (
                <Field key={String(name)}>
                  <FieldLabel htmlFor={`score-${name}`}>
                    {String(label)} (0 à {String(max)})
                  </FieldLabel>
                  <Input
                    id={`score-${name}`}
                    name={String(name)}
                    type="number"
                    min={0}
                    max={Number(max)}
                    defaultValue={
                      latest?.reponses?.[
                        name as keyof ScoreRisque["reponses"]
                      ] ?? 0
                    }
                    className="h-11 rounded-xl"
                    required
                  />
                </Field>
              ))}
            </FieldGroup>

            <FormActions
              saving={saving}
              submitLabel="Calculer le score"
              onCancel={() => setFormOpen(false)}
            />
          </form>
        </Modal>
      )}
    </>
  );
}

// ─── Onglet Missions ──────────────────────────────────────────────────────────
const MISSION_LABELS: Record<TypeMission, string> = {
  COMPTABILITE: "Comptabilité",
  AUDIT: "Audit",
  CONSEIL: "Conseil",
  JURIDIQUE: "Juridique",
  AUTRE: "Autre",
};

function TabMissions({ clientId }: { clientId: string }) {
  const [items, setItems] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Mission | null>(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<Mission[]>(`/missions/client/${clientId}`)
      .then(setItems)
      .catch((err: Error) => {
        setError(err.message);
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setError(null);
    setFormOpen(true);
  }

  function openEdit(item: Mission) {
    setEditing(item);
    setError(null);
    setFormOpen(true);
  }

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const form = new FormData(event.currentTarget);

    const payload = editing
      ? {
          description:
            String(form.get("description") ?? "").trim() || undefined,
          dateFin: String(form.get("dateFin") ?? "").trim() || undefined,
          honoraires:
            String(form.get("honoraires") ?? "").trim() !== ""
              ? Number(form.get("honoraires"))
              : undefined,
        }
      : {
          clientId,
          type: form.get("type") as TypeMission,
          description:
            String(form.get("description") ?? "").trim() || undefined,
          dateDebut: String(form.get("dateDebut")),
          dateFin: String(form.get("dateFin") ?? "").trim() || undefined,
          honoraires:
            String(form.get("honoraires") ?? "").trim() !== ""
              ? Number(form.get("honoraires"))
              : undefined,
        };

    try {
      await apiFetch(editing ? `/missions/${editing.id}` : "/missions", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });

      setFormOpen(false);
      setEditing(null);
      setLoading(true);
      load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d’enregistrer la mission.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(id: string, statut: string) {
    setBusy(id);
    setError(null);

    try {
      await apiFetch(`/missions/${id}/statut`, {
        method: "PATCH",
        body: JSON.stringify({ statut }),
      });
      setLoading(true);
      load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de modifier le statut.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Supprimer cette mission ?")) return;

    setBusy(id);
    try {
      await apiFetch(`/missions/${id}`, { method: "DELETE" });
      setLoading(true);
      load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-800">
              Missions
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Missions contractuelles rattachées au dossier client.
            </p>
          </div>

          <Button
            size="sm"
            onClick={openCreate}
            className="w-full rounded-xl bg-indigo-700 text-white sm:w-auto"
          >
            <IconPlus className="size-4" />
            Créer une mission
          </Button>
        </div>

        {error && !formOpen && (
          <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">
            Chargement des missions…
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            Aucune mission enregistrée
          </div>
        ) : (
          <div className="grid gap-4 p-4">
            {items.map((item) => {
              const closed =
                item.statut === "TERMINEE" || item.statut === "RESILIEE";

              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold uppercase text-slate-900">
                          {MISSION_LABELS[item.type]}
                        </p>
                        <StatusBadge status={item.statut} />
                      </div>

                      {item.description && (
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {item.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                        <span>
                          Début :{" "}
                          {new Date(item.dateDebut).toLocaleDateString("fr-FR")}
                        </span>
                        <span>
                          Fin :{" "}
                          {item.dateFin
                            ? new Date(item.dateFin).toLocaleDateString("fr-FR")
                            : "—"}
                        </span>
                        <span>
                          Honoraires :{" "}
                          {item.honoraires != null
                            ? `${Number(item.honoraires).toLocaleString("fr-FR")} €`
                            : "—"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
                    >
                      Modifier
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    {!closed && item.statut !== "SUSPENDUE" && (
                      <button
                        disabled={busy === item.id}
                        onClick={() => changeStatus(item.id, "SUSPENDUE")}
                        className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 disabled:opacity-50"
                      >
                        Suspendre
                      </button>
                    )}

                    {!closed && item.statut === "SUSPENDUE" && (
                      <button
                        disabled={busy === item.id}
                        onClick={() => changeStatus(item.id, "EN_COURS")}
                        className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 disabled:opacity-50"
                      >
                        Reprendre
                      </button>
                    )}

                    {!closed && (
                      <>
                        <button
                          disabled={busy === item.id}
                          onClick={() => changeStatus(item.id, "TERMINEE")}
                          className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 disabled:opacity-50"
                        >
                          Terminer
                        </button>
                        <button
                          disabled={busy === item.id}
                          onClick={() => changeStatus(item.id, "RESILIEE")}
                          className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
                        >
                          Résilier
                        </button>
                      </>
                    )}

                    <button
                      disabled={busy === item.id}
                      onClick={() => remove(item.id)}
                      className="ml-auto rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50"
                    >
                      Supprimer
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {formOpen && (
        <Modal
          title={editing ? "Modifier la mission" : "Créer une mission"}
          description={
            editing
              ? "Les champs autorisés par le backend sont la description, la date de fin et les honoraires."
              : "Renseignez les informations principales de la nouvelle mission."
          }
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        >
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <FieldGroup>
              {!editing && (
                <>
                  <Field>
                    <FieldLabel htmlFor="mission-type">Type *</FieldLabel>
                    <select
                      id="mission-type"
                      name="type"
                      defaultValue="COMPTABILITE"
                      className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                      required
                    >
                      {Object.entries(MISSION_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="mission-debut">
                      Date de début *
                    </FieldLabel>
                    <Input
                      id="mission-debut"
                      name="dateDebut"
                      type="date"
                      defaultValue={new Date().toISOString().slice(0, 10)}
                      className="h-11 rounded-xl"
                      required
                    />
                  </Field>
                </>
              )}

              <Field>
                <FieldLabel htmlFor="mission-description">
                  Description
                </FieldLabel>
                <textarea
                  id="mission-description"
                  name="description"
                  defaultValue={editing?.description ?? ""}
                  rows={4}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-indigo-100"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="mission-fin">Date de fin</FieldLabel>
                  <Input
                    id="mission-fin"
                    name="dateFin"
                    type="date"
                    defaultValue={editing?.dateFin?.slice(0, 10) ?? ""}
                    className="h-11 rounded-xl"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="mission-honoraires">
                    Honoraires (€)
                  </FieldLabel>
                  <Input
                    id="mission-honoraires"
                    name="honoraires"
                    type="number"
                    min={0}
                    step="0.01"
                    defaultValue={editing?.honoraires ?? ""}
                    className="h-11 rounded-xl"
                  />
                </Field>
              </div>
            </FieldGroup>

            <FormActions
              saving={saving}
              submitLabel={editing ? "Mettre à jour" : "Créer la mission"}
              onCancel={() => {
                setFormOpen(false);
                setEditing(null);
              }}
            />
          </form>
        </Modal>
      )}
    </>
  );
}

// ─── Onglet Planning ──────────────────────────────────────────────────────────
const PLANNING_TYPE_LABELS: Record<TypePlanningEtape, string> = {
  REGLEMENTAIRE: "Réglementaire",
  MANUELLE: "Manuelle",
};

function TabPlanning({ clientId }: { clientId: string }) {
  const [items, setItems] = useState<PlanningEtape[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([
      apiFetch<PlanningEtape[]>(`/planning/client/${clientId}`),
      apiFetch<User[]>("/users").catch(() => []),
    ])
      .then(([steps, allUsers]) => {
        setItems(steps);
        setUsers(allUsers);
      })
      .catch((err: Error) => {
        setError(err.message);
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const form = new FormData(event.currentTarget);

    const payload = {
      clientId,
      titre: String(form.get("titre") ?? "").trim(),
      description: String(form.get("description") ?? "").trim() || undefined,
      type: form.get("type") as TypePlanningEtape,
      dateEcheance: String(form.get("dateEcheance") ?? "").trim() || undefined,
      assignedToId: String(form.get("assignedToId") ?? "").trim() || undefined,
    };

    try {
      await apiFetch("/planning", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setFormOpen(false);
      setLoading(true);
      load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de créer l’étape.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function complete(id: string) {
    setBusy(id);
    setError(null);

    try {
      await apiFetch(`/planning/${id}/completer`, { method: "PATCH" });
      setLoading(true);
      load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de compléter l’étape.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Supprimer cette étape ?")) return;

    setBusy(id);
    try {
      await apiFetch(`/planning/${id}`, { method: "DELETE" });
      setLoading(true);
      load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-teal-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-teal-100 bg-gradient-to-r from-teal-50 to-cyan-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-800">
              Planning et diligences
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Étapes manuelles ou réglementaires liées au dossier.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => {
              setError(null);
              setFormOpen(true);
            }}
            className="w-full rounded-xl bg-teal-700 text-white sm:w-auto"
          >
            <IconPlus className="size-4" />
            Ajouter une étape
          </Button>
        </div>

        {error && !formOpen && (
          <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">
            Chargement du planning…
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            Aucune étape planifiée
          </div>
        ) : (
          <div className="grid gap-3 p-4">
            {items.map((item) => {
              const closed =
                item.statut === "FAIT" || item.statut === "ANNULEE";

              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={item.statut} />
                        <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                          {PLANNING_TYPE_LABELS[item.type]}
                        </span>
                      </div>

                      <p className="mt-3 font-semibold text-slate-900">
                        {item.titre}
                      </p>

                      {item.description && (
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {item.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                        <span>
                          Échéance :{" "}
                          {item.dateEcheance
                            ? new Date(item.dateEcheance).toLocaleDateString(
                                "fr-FR",
                              )
                            : "—"}
                        </span>
                        <span>
                          Assigné à :{" "}
                          {item.assignedTo
                            ? `${item.assignedTo.prenom} ${item.assignedTo.nom}`
                            : "Non assigné"}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      {!closed && (
                        <button
                          disabled={busy === item.id}
                          onClick={() => complete(item.id)}
                          className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 disabled:opacity-50"
                        >
                          Marquer fait
                        </button>
                      )}

                      <button
                        disabled={busy === item.id}
                        onClick={() => remove(item.id)}
                        className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {formOpen && (
        <Modal
          title="Ajouter une étape"
          description="Créez une nouvelle diligence pour ce client."
          onClose={() => setFormOpen(false)}
        >
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="planning-titre">Titre *</FieldLabel>
                <Input
                  id="planning-titre"
                  name="titre"
                  className="h-11 rounded-xl"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="planning-description">
                  Description
                </FieldLabel>
                <textarea
                  id="planning-description"
                  name="description"
                  rows={4}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="planning-type">Type *</FieldLabel>
                  <select
                    id="planning-type"
                    name="type"
                    defaultValue="MANUELLE"
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                    required
                  >
                    <option value="REGLEMENTAIRE">Réglementaire</option>
                    <option value="MANUELLE">Manuelle</option>
                  </select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="planning-date">Échéance</FieldLabel>
                  <Input
                    id="planning-date"
                    name="dateEcheance"
                    type="date"
                    className="h-11 rounded-xl"
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="planning-user">Assigné à</FieldLabel>
                <select
                  id="planning-user"
                  name="assignedToId"
                  defaultValue=""
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="">Non assigné</option>
                  {users
                    .filter((user) => user.isActive)
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.prenom} {user.nom} — {user.role}
                      </option>
                    ))}
                </select>
              </Field>
            </FieldGroup>

            <FormActions
              saving={saving}
              submitLabel="Ajouter l’étape"
              onCancel={() => setFormOpen(false)}
            />
          </form>
        </Modal>
      )}
    </>
  );
}

// ─── Onglet Obligations ───────────────────────────────────────────────────────
const OBLIGATION_LABELS: Record<TypeObligation, string> = {
  KYC_VERIFICATION: "Vérification KYC",
  EVALUATION_RISQUE: "Évaluation du risque",
  MISE_A_JOUR_DOCS: "Mise à jour des documents",
  VALIDATION_RELATION: "Validation de la relation",
  LETTRE_MISSION: "Lettre de mission",
};

function TabObligations({ clientId }: { clientId: string }) {
  const [items, setItems] = useState<Obligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<Obligation[]>(`/obligations/client/${clientId}`)
      .then(setItems)
      .catch((err: Error) => {
        setError(err.message);
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  const completed = items.filter((item) => item.statut === "FAIT").length;
  const percentage = items.length ? (completed / items.length) * 100 : 0;

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const form = new FormData(event.currentTarget);

    const payload = {
      clientId,
      type: form.get("type") as TypeObligation,
      dateEcheance: String(form.get("dateEcheance") ?? "").trim() || undefined,
    };

    try {
      await apiFetch("/obligations", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setFormOpen(false);
      setLoading(true);
      load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de créer l’obligation.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function markDone(id: string) {
    setBusy(id);
    setError(null);

    try {
      await apiFetch(`/obligations/${id}/fait`, { method: "PATCH" });
      setLoading(true);
      load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de marquer l’obligation comme faite.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-800">
              Tableau des obligations
            </p>
            <p className="mt-1 text-xs text-amber-700/70">
              Suivi réglementaire du dossier client.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="h-2 w-24 overflow-hidden rounded-full bg-amber-200">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-xs font-bold text-amber-800">
                {completed}/{items.length}
              </span>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setError(null);
                setFormOpen(true);
              }}
              className="w-full rounded-xl bg-amber-700 text-white sm:w-auto"
            >
              <IconPlus className="size-4" />
              Ajouter
            </Button>
          </div>
        </div>

        {error && !formOpen && (
          <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">
            Chargement des obligations…
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            Aucune obligation enregistrée
          </div>
        ) : (
          <div className="grid gap-3 p-4">
            {items.map((item) => {
              const closed = item.statut === "FAIT" || item.statut === "EXPIRE";

              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-amber-100 bg-amber-50/30 p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">
                          {OBLIGATION_LABELS[item.type]}
                        </p>
                        <StatusBadge status={item.statut} />
                      </div>
                      <p className="mt-3 text-xs text-slate-500">
                        Échéance :{" "}
                        {item.dateEcheance
                          ? new Date(item.dateEcheance).toLocaleDateString(
                              "fr-FR",
                            )
                          : "—"}
                      </p>
                    </div>

                    {!closed && (
                      <button
                        disabled={busy === item.id}
                        onClick={() => markDone(item.id)}
                        className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 disabled:opacity-50"
                      >
                        Marquer comme fait
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {formOpen && (
        <Modal
          title="Ajouter une obligation"
          description="Créez une nouvelle obligation réglementaire pour ce dossier."
          onClose={() => setFormOpen(false)}
        >
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="obligation-type">Type *</FieldLabel>
                <select
                  id="obligation-type"
                  name="type"
                  defaultValue="KYC_VERIFICATION"
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  required
                >
                  {Object.entries(OBLIGATION_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field>
                <FieldLabel htmlFor="obligation-date">
                  Date d’échéance
                </FieldLabel>
                <Input
                  id="obligation-date"
                  name="dateEcheance"
                  type="date"
                  className="h-11 rounded-xl"
                />
              </Field>
            </FieldGroup>

            <FormActions
              saving={saving}
              submitLabel="Ajouter l’obligation"
              onCancel={() => setFormOpen(false)}
            />
          </form>
        </Modal>
      )}
    </>
  );
}

// ─── Onglet Opérations sensibles ──────────────────────────────────────────────
const OPERATION_LABELS: Record<TypeOperationSensible, string> = {
  SANS_JUSTIFICATION: "Sans justification économique",
  COMPLEXE: "Opération complexe",
  SANS_OBJET_LICITE: "Sans objet licite",
  INHABITUELLE: "Opération inhabituelle",
  ECONOMIE_VIRTUELLE: "Économie virtuelle",
  ESPECES: "Transaction en espèces",
  AUTRE: "Autre",
};

function TabOperations({ clientId }: { clientId: string }) {
  const [items, setItems] = useState<OperationSensible[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<OperationSensible[]>(`/operations-sensibles/client/${clientId}`)
      .then(setItems)
      .catch((err: Error) => {
        setError(err.message);
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const form = new FormData(event.currentTarget);

    const payload = {
      clientId,
      type: form.get("type") as TypeOperationSensible,
      description: String(form.get("description") ?? "").trim(),
      montant:
        String(form.get("montant") ?? "").trim() !== ""
          ? Number(form.get("montant"))
          : undefined,
      devise: String(form.get("devise") ?? "").trim() || undefined,
    };

    try {
      await apiFetch("/operations-sensibles", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setFormOpen(false);
      setLoading(true);
      load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de signaler l’opération.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function classer(id: string) {
    if (!window.confirm("Classer cette opération sensible ?")) return;

    setBusy(id);
    setError(null);

    try {
      await apiFetch(`/operations-sensibles/${id}/classer`, {
        method: "PATCH",
      });
      setLoading(true);
      load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de classer l’opération.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function declarerTracfin(id: string) {
    const date = window.prompt(
      "Date de déclaration TRACFIN (AAAA-MM-JJ)",
      new Date().toISOString().slice(0, 10),
    );

    if (!date) return;

    setBusy(id);
    setError(null);

    try {
      await apiFetch(`/operations-sensibles/${id}/tracfin`, {
        method: "PATCH",
        body: JSON.stringify({ date }),
      });
      setLoading(true);
      load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de déclarer l’opération à TRACFIN.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-red-100 bg-gradient-to-r from-red-50 to-rose-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-red-700">
              Opérations sensibles
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Signalements et décisions LCB-FT liés à ce dossier.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => {
              setError(null);
              setFormOpen(true);
            }}
            className="w-full rounded-xl bg-red-700 text-white hover:bg-red-800 sm:w-auto"
          >
            <IconPlus className="size-4" />
            Signaler
          </Button>
        </div>

        {error && !formOpen && (
          <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">
            Chargement des opérations…
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            Aucune opération sensible
          </div>
        ) : (
          <div className="grid gap-4 p-4">
            {items.map((item) => {
              const closed =
                item.statut === "CLASSEE" || item.statut === "TRACFIN_DECLARE";

              return (
                <article
                  key={item.id}
                  className={`rounded-2xl border p-4 ${
                    item.statut === "SIGNALEE"
                      ? "border-red-200 bg-red-50/50"
                      : "border-slate-200 bg-slate-50/50"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-slate-400">
                          {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                        <StatusBadge status={item.statut} />
                      </div>

                      <p className="mt-3 text-sm font-semibold text-slate-900">
                        {OPERATION_LABELS[item.type]}
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {item.description}
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        Montant :{" "}
                        {item.montant != null
                          ? `${Number(item.montant).toLocaleString("fr-FR")} ${
                              item.devise ?? "EUR"
                            }`
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {!closed && (
                    <div className="mt-4 flex flex-col gap-2 border-t border-red-100 pt-4 sm:flex-row">
                      <button
                        disabled={busy === item.id}
                        onClick={() => classer(item.id)}
                        className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-amber-700 disabled:opacity-50"
                      >
                        Classer
                      </button>

                      <button
                        disabled={busy === item.id}
                        onClick={() => declarerTracfin(item.id)}
                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
                      >
                        Déclarer TRACFIN
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {formOpen && (
        <Modal
          title="Signaler une opération sensible"
          description="Décrivez l’opération et précisez son type ainsi que son montant éventuel."
          onClose={() => setFormOpen(false)}
        >
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="operation-type">Type *</FieldLabel>
                <select
                  id="operation-type"
                  name="type"
                  defaultValue="INHABITUELLE"
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  required
                >
                  {Object.entries(OPERATION_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field>
                <FieldLabel htmlFor="operation-description">
                  Description *
                </FieldLabel>
                <textarea
                  id="operation-description"
                  name="description"
                  rows={5}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="operation-montant">Montant</FieldLabel>
                  <Input
                    id="operation-montant"
                    name="montant"
                    type="number"
                    min={0}
                    step="0.01"
                    className="h-11 rounded-xl"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="operation-devise">Devise</FieldLabel>
                  <Input
                    id="operation-devise"
                    name="devise"
                    defaultValue="EUR"
                    maxLength={3}
                    className="h-11 rounded-xl uppercase"
                  />
                </Field>
              </div>
            </FieldGroup>

            <FormActions
              saving={saving}
              submitLabel="Signaler l’opération"
              onCancel={() => setFormOpen(false)}
            />
          </form>
        </Modal>
      )}
    </>
  );
}

// ─── Empty tab ────────────────────────────────────────────────────────────────
function EmptyTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        <IconPlus className="size-5 text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-600 mb-1">Aucun {label}</p>
      <p className="text-xs text-slate-400">
        Ce module sera disponible prochainement
      </p>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [score, setScore] = useState<ScoreRisque | null>(null);
  const [audit, setAudit] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeTab = searchParams.get("tab") ?? "infos";

  const load = useCallback(() => {
    apiFetch<Client>(`/clients/${id}`)
      .then((c) => {
        setClient(c);
        return apiFetch<ScoreRisque | null>(
          `/scoring/client/${id}/courant`,
        ).catch(() => null);
      })
      .then((s) => {
        setScore(s);
        return apiFetch<AuditLog[]>(`/audit/${id}`).catch(() => []);
      })
      .then((logs) => setAudit(logs))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  function setTab(tab: string) {
    router.push(`/dashboard/clients/${id}?tab=${tab}`, { scroll: false });
  }

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-6 animate-spin rounded-full border-2 border-slate-800 border-t-transparent" />
      </div>
    );
  if (error || !client)
    return (
      <div className="p-6 text-sm text-red-600">
        {error ?? "Client introuvable"}
      </div>
    );

  const niveauColor: Record<NiveauRisque, string> = {
    ELEVE: "text-red-600",
    MOYEN: "text-amber-600",
    FAIBLE: "text-emerald-600",
  };
  const kycColor: Record<StatutKyc, string> = {
    VALIDE: "text-emerald-600",
    COMPLET: "text-blue-600",
    INCOMPLET: "text-amber-600",
    EXPIRE: "text-red-600",
  };
  const statutColor: Record<StatutClient, string> = {
    ACTIF: "text-emerald-600",
    INACTIF: "text-slate-400",
    RESILIE: "text-red-600",
  };

  return (
    <div className="min-h-full bg-slate-50 pb-24 md:pb-8">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 md:px-8 md:py-6">
        {/* En-tête du dossier */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-800 to-violet-700 p-5 text-white shadow-xl sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-fuchsia-300/15 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <Link
                  href="/dashboard/clients"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-100 transition hover:text-white"
                >
                  <IconArrowLeft className="size-4" />
                  Retour aux clients
                </Link>

                <div className="mt-4 flex items-start gap-4">
                  <div className="hidden size-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-inner sm:flex">
                    <IconBuilding className="size-7" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">
                      Dossier client
                    </p>

                    <h1 className="mt-1 break-words text-2xl font-bold tracking-tight sm:text-3xl">
                      {client.raisonSociale}
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-blue-100">
                      Réf. {client.ref}
                      {client.siret ? ` • SIRET ${client.siret}` : ""}
                      {client.codeNaf ? ` • ${client.codeNaf}` : ""}
                      {client.ville ? ` • ${client.ville}` : ""}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                    ● {client.statut}
                  </span>

                  <span className="rounded-full border border-blue-300/30 bg-blue-400/15 px-3 py-1.5 text-xs font-semibold text-blue-100">
                    ● KYC {client.kycStatut}
                  </span>

                  {score ? (
                    <span className="rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-100">
                      ● RISQUE {score.niveau} ({score.score}/150)
                    </span>
                  ) : (
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white/80">
                      Pas de scoring
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setTab("infos")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-800 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50 sm:w-auto"
                >
                  <IconPencil className="size-4" />
                  Éditer
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/15 pt-5 sm:grid-cols-4">
              <div className="rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-blue-100">
                  Statut KYC
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {client.kycStatut}
                </p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-blue-100">
                  Screening
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {client.screeningStatut}
                </p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-blue-100">
                  UBO saisi
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {client.uboSaisi ? "Oui" : "Non"}
                </p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-blue-100">
                  Score courant
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {score ? `${score.score}/150` : "Non évalué"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Onglets */}
        <div className="sticky top-0 z-20 mt-5 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur-xl">
          <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max gap-1">
              {TABS.map(({ id: tabId, label, icon: Icon }) => {
                const active = activeTab === tabId;

                return (
                  <button
                    key={tabId}
                    type="button"
                    onClick={() => setTab(tabId)}
                    className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="size-4 shrink-0" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Contenu de l’onglet */}
        <main className="mt-5">
          {activeTab === "infos" && (
            <TabInfos
              client={client}
              score={score}
              audit={audit}
              onRefresh={load}
            />
          )}
          {activeTab === "kyc" && <TabKyc client={client} onRefresh={load} />}
          {activeTab === "ubo" && <TabUbo clientId={id} onRefresh={load} />}
          {activeTab === "contacts" && <TabContacts clientId={id} />}
          {activeTab === "scoring" && (
            <TabScoring clientId={id} onRefresh={load} />
          )}
          {activeTab === "missions" && <TabMissions clientId={id} />}
          {activeTab === "planning" && <TabPlanning clientId={id} />}
          {activeTab === "obligations" && <TabObligations clientId={id} />}
          {activeTab === "operations" && <TabOperations clientId={id} />}
        </main>
      </div>
    </div>
  );
}
