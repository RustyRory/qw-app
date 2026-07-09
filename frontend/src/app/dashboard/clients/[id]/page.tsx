"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import * as Tabs from "@radix-ui/react-tabs";
import { IconArrowLeft, IconPencil, IconUpload } from "@tabler/icons-react";
import { apiFetch } from "@/lib/apiFetch";
import { StatusBadge, RiskBadge } from "@/lib/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import type {
  Client,
  Document as ClientDocument,
  BeneficiaireEffectif,
  Contact,
  ScoreRisque,
  Mission,
  LettreMission,
  PlanningEtape,
  Obligation,
  OperationSensible,
  TypeContact,
  TypeMission,
  StatutMission,
  TypePlanningEtape,
  TypeObligation,
  TypeOperationSensible,
} from "@/types";

// ── Onglet Infos ──────────────────────────────────────────────────────────────

function InfosTab({
  client,
  onUpdate,
}: {
  client: Client;
  onUpdate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const data = {
      raisonSociale: form.get("raisonSociale") as string,
      activitePrincipale:
        (form.get("activitePrincipale") as string) || undefined,
      chiffreAffaires: form.get("chiffreAffaires")
        ? Number(form.get("chiffreAffaires"))
        : undefined,
      effectif: form.get("effectif") ? Number(form.get("effectif")) : undefined,
      adresseSiege: (form.get("adresseSiege") as string) || undefined,
      ville: (form.get("ville") as string) || undefined,
      codePostal: (form.get("codePostal") as string) || undefined,
    };
    try {
      await apiFetch(`/clients/${client.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      setEditing(false);
      onUpdate();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <IconPencil className="size-4" /> Modifier
          </Button>
        </div>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 rounded-lg border p-4 text-sm sm:grid-cols-2">
          {[
            ["Raison sociale", client.raisonSociale],
            ["SIRET", client.siret ?? "—"],
            ["SIREN", client.siren ?? "—"],
            ["Forme juridique", client.formeJuridique ?? "—"],
            ["Code NAF", client.codeNaf ?? "—"],
            ["Activité principale", client.activitePrincipale ?? "—"],
            [
              "Adresse",
              [client.adresseSiege, client.codePostal, client.ville]
                .filter(Boolean)
                .join(" — ") || "—",
            ],
            ["Pays", client.pays],
            [
              "CA annuel",
              client.chiffreAffaires
                ? `${client.chiffreAffaires.toLocaleString("fr-FR")} €`
                : "—",
            ],
            ["Effectif", client.effectif ?? "—"],
            ["Créé le", new Date(client.createdAt).toLocaleDateString("fr-FR")],
          ].map(([label, value]) => (
            <div key={label as string}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      {error && (
        <div className="rounded bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </div>
      )}
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="raisonSociale">Raison sociale</FieldLabel>
          <Input
            id="raisonSociale"
            name="raisonSociale"
            defaultValue={client.raisonSociale}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="activitePrincipale">
            Activité principale
          </FieldLabel>
          <Input
            id="activitePrincipale"
            name="activitePrincipale"
            defaultValue={client.activitePrincipale ?? ""}
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
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="effectif">Effectif</FieldLabel>
            <Input
              id="effectif"
              name="effectif"
              type="number"
              defaultValue={client.effectif ?? ""}
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="adresseSiege">Adresse</FieldLabel>
          <Input
            id="adresseSiege"
            name="adresseSiege"
            defaultValue={client.adresseSiege ?? ""}
          />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="ville">Ville</FieldLabel>
            <Input id="ville" name="ville" defaultValue={client.ville ?? ""} />
          </Field>
          <Field>
            <FieldLabel htmlFor="codePostal">Code postal</FieldLabel>
            <Input
              id="codePostal"
              name="codePostal"
              defaultValue={client.codePostal ?? ""}
            />
          </Field>
        </div>
      </FieldGroup>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "Enregistrement…" : "Enregistrer"}
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
  );
}

// ── Onglet KYC & Documents ────────────────────────────────────────────────────

function KycTab({
  client,
  onUpdate,
}: {
  client: Client;
  onUpdate: () => void;
}) {
  const [docs, setDocs] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);

  const loadDocs = useCallback(() => {
    apiFetch<ClientDocument[]>(`/documents/${client.id}`)
      .then(setDocs)
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [client.id]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    try {
      await apiFetch(`/documents/upload/${client.id}`, {
        method: "POST",
        body,
      });
      loadDocs();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDeleteDoc(id: string) {
    if (!confirm("Supprimer ce document ?")) return;
    await apiFetch(`/documents/${id}`, { method: "DELETE" });
    loadDocs();
  }

  async function handleValidateKyc() {
    setValidating(true);
    try {
      await apiFetch(`/clients/${client.id}/validate`, { method: "PATCH" });
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setValidating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium">Données KYC</h3>
          {client.kycStatut !== "VALIDE" && (
            <Button size="sm" onClick={handleValidateKyc} disabled={validating}>
              {validating ? "Validation…" : "Valider KYC ✓"}
            </Button>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">Statut KYC</dt>
            <dd className="mt-0.5">
              <StatusBadge status={client.kycStatut} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">PPE</dt>
            <dd className="mt-0.5 font-medium">{client.ppe ? "Oui" : "Non"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Screening</dt>
            <dd className="mt-0.5">
              <StatusBadge status={client.screeningStatut} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">UBO saisi</dt>
            <dd className="mt-0.5 font-medium">
              {client.uboSaisi ? "Oui" : "Non"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium">Documents</h3>
          <label className="cursor-pointer">
            <input
              type="file"
              className="sr-only"
              onChange={handleUpload}
              disabled={uploading}
            />
            <Button size="sm" variant="outline" asChild>
              <span>
                <IconUpload className="size-4" />
                {uploading ? "Upload…" : "Ajouter un document"}
              </span>
            </Button>
          </label>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : docs.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Aucun document
          </div>
        ) : (
          <div className="space-y-2">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{doc.nomFichier}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.typeMime} · {Math.round(doc.taille / 1024)} Ko
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                  <a
                    href={`/api/documents/file/${doc.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    Télécharger
                  </a>
                  <button
                    onClick={() => handleDeleteDoc(doc.id)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Onglet Bénéficiaires effectifs ────────────────────────────────────────────

function BeneficiairesTab({ clientId }: { clientId: string }) {
  const [items, setItems] = useState<BeneficiaireEffectif[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    apiFetch<BeneficiaireEffectif[]>(`/beneficiaires/client/${clientId}`)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = {
      clientId,
      nom: form.get("nom") as string,
      prenom: (form.get("prenom") as string) || undefined,
      nationalite: (form.get("nationalite") as string) || undefined,
      pourcentageDetention: Number(form.get("pourcentageDetention")),
      ppe: form.get("ppe") === "on",
    };
    await apiFetch("/beneficiaires", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce bénéficiaire ?")) return;
    await apiFetch(`/beneficiaires/${id}`, { method: "DELETE" });
    load();
  }

  const total = items.reduce(
    (sum, b) => sum + Number(b.pourcentageDetention),
    0,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Total détenu : {total}% / 100%
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowForm((v) => !v)}
        >
          + Ajouter UBO
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="grid grid-cols-2 gap-3 rounded-lg border p-4 sm:grid-cols-4"
        >
          <Input name="prenom" placeholder="Prénom" />
          <Input name="nom" placeholder="Nom *" required />
          <Input name="nationalite" placeholder="Nationalité" />
          <Input
            name="pourcentageDetention"
            type="number"
            step="0.01"
            placeholder="% détention *"
            required
          />
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <input type="checkbox" name="ppe" className="size-4" /> PPE
          </label>
          <div className="col-span-2 flex justify-end gap-2">
            <Button type="submit" size="sm">
              Ajouter
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun bénéficiaire effectif
        </p>
      ) : (
        <div className="divide-y rounded-lg border">
          {items.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {b.prenom} {b.nom} — {b.pourcentageDetention}%
                  {b.ppe && (
                    <span className="ml-2 text-xs text-destructive">PPE</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {b.nationalite ?? "—"}
                </p>
              </div>
              <button
                onClick={() => handleDelete(b.id)}
                className="text-xs text-destructive hover:underline"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Onglet Contacts ────────────────────────────────────────────────────────────

function ContactsTab({ clientId }: { clientId: string }) {
  const [items, setItems] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    apiFetch<Contact[]>(`/contacts/client/${clientId}`)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = {
      clientId,
      nom: form.get("nom") as string,
      prenom: (form.get("prenom") as string) || undefined,
      email: (form.get("email") as string) || undefined,
      telephone: (form.get("telephone") as string) || undefined,
      type: form.get("type") as TypeContact,
    };
    await apiFetch("/contacts", { method: "POST", body: JSON.stringify(data) });
    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce contact ?")) return;
    await apiFetch(`/contacts/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowForm((v) => !v)}
        >
          + Ajouter
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="grid grid-cols-2 gap-3 rounded-lg border p-4 sm:grid-cols-4"
        >
          <Input name="prenom" placeholder="Prénom" />
          <Input name="nom" placeholder="Nom *" required />
          <Input name="email" type="email" placeholder="Email" />
          <Input name="telephone" placeholder="Téléphone" />
          <select
            name="type"
            required
            defaultValue="AUTRE"
            className="col-span-2 h-9 rounded-md border border-input bg-background px-3 text-sm sm:col-span-1"
          >
            <option value="INTERVENANT">Intervenant</option>
            <option value="AVOCAT">Avocat</option>
            <option value="COMMISSAIRE_COMPTES">Commissaire aux comptes</option>
            <option value="NOTAIRE">Notaire</option>
            <option value="AUTRE">Autre</option>
          </select>
          <div className="col-span-2 flex justify-end gap-2 sm:col-span-1">
            <Button type="submit" size="sm">
              Ajouter
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun contact</p>
      ) : (
        <div className="divide-y rounded-lg border">
          {items.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {c.prenom} {c.nom}{" "}
                  <span className="ml-2">
                    <StatusBadge status={c.type} />
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {c.email ?? "—"} {c.telephone ? `· ${c.telephone}` : ""}
                </p>
              </div>
              <button
                onClick={() => handleDelete(c.id)}
                className="text-xs text-destructive hover:underline"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Onglet Scoring ARPEC ───────────────────────────────────────────────────────

function ScoringTab({ clientId }: { clientId: string }) {
  const [scores, setScores] = useState<ScoreRisque[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    apiFetch<ScoreRisque[]>(`/scoring/client/${clientId}`)
      .then(setScores)
      .catch(() => setScores([]))
      .finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const data = {
      clientId,
      clientCaracteristiques: Number(form.get("clientCaracteristiques")),
      activiteSecteur: Number(form.get("activiteSecteur")),
      zoneGeographique: Number(form.get("zoneGeographique")),
      typeMission: Number(form.get("typeMission")),
    };
    try {
      await apiFetch("/scoring", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  const latest = scores[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {latest ? (
            <>
              <RiskBadge level={latest.niveau} />
              <span className="text-sm text-muted-foreground">
                Score : {latest.score} / 150
              </span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">
              Aucun scoring calculé
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowForm((v) => !v)}
        >
          + Évaluer
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 gap-3 rounded-lg border p-4 sm:grid-cols-2"
        >
          <Field>
            <FieldLabel>Caractéristiques client (0–50)</FieldLabel>
            <Input
              name="clientCaracteristiques"
              type="number"
              min={0}
              max={50}
              required
            />
          </Field>
          <Field>
            <FieldLabel>Activité / secteur (0–40)</FieldLabel>
            <Input
              name="activiteSecteur"
              type="number"
              min={0}
              max={40}
              required
            />
          </Field>
          <Field>
            <FieldLabel>Zone géographique (0–30)</FieldLabel>
            <Input
              name="zoneGeographique"
              type="number"
              min={0}
              max={30}
              required
            />
          </Field>
          <Field>
            <FieldLabel>Type de mission (0–30)</FieldLabel>
            <Input name="typeMission" type="number" min={0} max={30} required />
          </Field>
          <div className="col-span-2 flex justify-end">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Calcul…" : "Enregistrer l'évaluation"}
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : scores.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  Niveau
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  Score
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  Calculé par
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {scores.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-2">
                    <RiskBadge level={s.niveau} />
                  </td>
                  <td className="px-4 py-2">{s.score} / 150</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {s.calculatedBy
                      ? `${s.calculatedBy.prenom} ${s.calculatedBy.nom}`
                      : "—"}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {new Date(s.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

// ── Onglet Missions ────────────────────────────────────────────────────────────

function MissionRow({
  mission,
  onUpdate,
}: {
  mission: Mission;
  onUpdate: () => void;
}) {
  const [lettres, setLettres] = useState<LettreMission[]>([]);
  const [showLettres, setShowLettres] = useState(false);

  function loadLettres() {
    apiFetch<LettreMission[]>(`/lettres-mission/mission/${mission.id}`)
      .then(setLettres)
      .catch(() => setLettres([]));
  }

  async function handleStatutChange(statut: StatutMission) {
    await apiFetch(`/missions/${mission.id}/statut`, {
      method: "PATCH",
      body: JSON.stringify({ statut }),
    });
    onUpdate();
  }

  async function handleCreateLettre() {
    const contenu = prompt("Contenu de la lettre (texte libre) :");
    if (!contenu) return;
    await apiFetch("/lettres-mission", {
      method: "POST",
      body: JSON.stringify({
        missionId: mission.id,
        contenu: { texte: contenu },
      }),
    });
    loadLettres();
  }

  async function handleSigner(id: string) {
    await apiFetch(`/lettres-mission/${id}/signer`, { method: "PATCH" });
    loadLettres();
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">
            {mission.type} <StatusBadge status={mission.statut} />
          </p>
          <p className="text-xs text-muted-foreground">
            Du {new Date(mission.dateDebut).toLocaleDateString("fr-FR")}
            {mission.dateFin &&
              ` au ${new Date(mission.dateFin).toLocaleDateString("fr-FR")}`}
            {mission.honoraires != null && ` — ${mission.honoraires} €`}
          </p>
          {mission.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {mission.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={mission.statut}
            onChange={(e) =>
              handleStatutChange(e.target.value as StatutMission)
            }
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="EN_COURS">En cours</option>
            <option value="SUSPENDUE">Suspendue</option>
            <option value="TERMINEE">Terminée</option>
            <option value="RESILIEE">Résiliée</option>
          </select>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowLettres((v) => !v);
              if (!showLettres) loadLettres();
            }}
          >
            Lettres de mission
          </Button>
        </div>
      </div>

      {showLettres && (
        <div className="mt-3 space-y-2 border-t pt-3">
          <Button size="sm" variant="outline" onClick={handleCreateLettre}>
            + Générer une lettre
          </Button>
          {lettres.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between rounded border px-3 py-2 text-xs"
            >
              <span>
                v{l.version} — {l.signeeParExpert ? "Signée ✓" : "Non signée"}
              </span>
              {!l.signeeParExpert && (
                <button
                  onClick={() => handleSigner(l.id)}
                  className="text-primary hover:underline"
                >
                  Signer
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MissionsTab({ clientId }: { clientId: string }) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    apiFetch<Mission[]>(`/missions/client/${clientId}`)
      .then(setMissions)
      .catch(() => setMissions([]))
      .finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = {
      clientId,
      type: form.get("type") as TypeMission,
      description: (form.get("description") as string) || undefined,
      dateDebut: form.get("dateDebut") as string,
      honoraires: form.get("honoraires")
        ? Number(form.get("honoraires"))
        : undefined,
    };
    await apiFetch("/missions", { method: "POST", body: JSON.stringify(data) });
    setShowForm(false);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowForm((v) => !v)}
        >
          + Créer mission
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 gap-3 rounded-lg border p-4 sm:grid-cols-2"
        >
          <select
            name="type"
            required
            defaultValue="COMPTABILITE"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="COMPTABILITE">Comptabilité</option>
            <option value="AUDIT">Audit</option>
            <option value="CONSEIL">Conseil</option>
            <option value="JURIDIQUE">Juridique</option>
            <option value="AUTRE">Autre</option>
          </select>
          <Input name="dateDebut" type="date" required />
          <Input name="honoraires" type="number" placeholder="Honoraires (€)" />
          <Input
            name="description"
            placeholder="Description"
            className="col-span-2"
          />
          <div className="col-span-2 flex justify-end">
            <Button type="submit" size="sm">
              Créer
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : missions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune mission</p>
      ) : (
        <div className="space-y-3">
          {missions.map((m) => (
            <MissionRow key={m.id} mission={m} onUpdate={load} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Onglet Planning ────────────────────────────────────────────────────────────

function PlanningTab({ clientId }: { clientId: string }) {
  const [items, setItems] = useState<PlanningEtape[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    apiFetch<PlanningEtape[]>(`/planning/client/${clientId}`)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = {
      clientId,
      titre: form.get("titre") as string,
      type: form.get("type") as TypePlanningEtape,
      dateEcheance: (form.get("dateEcheance") as string) || undefined,
    };
    await apiFetch("/planning", { method: "POST", body: JSON.stringify(data) });
    setShowForm(false);
    load();
  }

  async function handleComplete(id: string) {
    await apiFetch(`/planning/${id}/completer`, { method: "PATCH" });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette étape ?")) return;
    await apiFetch(`/planning/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowForm((v) => !v)}
        >
          + Ajouter étape
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 gap-3 rounded-lg border p-4 sm:grid-cols-2"
        >
          <Input
            name="titre"
            placeholder="Titre *"
            required
            className="col-span-2"
          />
          <select
            name="type"
            required
            defaultValue="MANUELLE"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="REGLEMENTAIRE">Réglementaire</option>
            <option value="MANUELLE">Manuelle</option>
          </select>
          <Input name="dateEcheance" type="date" />
          <div className="col-span-2 flex justify-end">
            <Button type="submit" size="sm">
              Ajouter
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune étape planifiée</p>
      ) : (
        <div className="divide-y rounded-lg border">
          {items.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {e.titre} <StatusBadge status={e.statut} />
                </p>
                <p className="text-xs text-muted-foreground">
                  {e.type}{" "}
                  {e.dateEcheance &&
                    `· échéance ${new Date(e.dateEcheance).toLocaleDateString("fr-FR")}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {e.statut !== "FAIT" && (
                  <button
                    onClick={() => handleComplete(e.id)}
                    className="text-xs text-primary hover:underline"
                  >
                    Marquer fait
                  </button>
                )}
                <button
                  onClick={() => handleDelete(e.id)}
                  className="text-xs text-destructive hover:underline"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Onglet Obligations ─────────────────────────────────────────────────────────

function ObligationsTab({ clientId }: { clientId: string }) {
  const [items, setItems] = useState<Obligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    apiFetch<Obligation[]>(`/obligations/client/${clientId}`)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = {
      clientId,
      type: form.get("type") as TypeObligation,
      dateEcheance: (form.get("dateEcheance") as string) || undefined,
    };
    await apiFetch("/obligations", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setShowForm(false);
    load();
  }

  async function handleMarquerFait(id: string) {
    await apiFetch(`/obligations/${id}/fait`, { method: "PATCH" });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowForm((v) => !v)}
        >
          + Ajouter obligation
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 gap-3 rounded-lg border p-4 sm:grid-cols-2"
        >
          <select
            name="type"
            required
            defaultValue="KYC_VERIFICATION"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="KYC_VERIFICATION">Vérification KYC</option>
            <option value="EVALUATION_RISQUE">Évaluation du risque</option>
            <option value="MISE_A_JOUR_DOCS">Mise à jour des documents</option>
            <option value="VALIDATION_RELATION">
              Validation de la relation
            </option>
            <option value="LETTRE_MISSION">Lettre de mission</option>
          </select>
          <Input name="dateEcheance" type="date" />
          <div className="col-span-2 flex justify-end">
            <Button type="submit" size="sm">
              Ajouter
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune obligation</p>
      ) : (
        <div className="divide-y rounded-lg border">
          {items.map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">{o.type}</p>
                <p className="text-xs text-muted-foreground">
                  {o.dateEcheance &&
                    `Échéance : ${new Date(o.dateEcheance).toLocaleDateString("fr-FR")}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={o.statut} />
                {o.statut !== "FAIT" && (
                  <button
                    onClick={() => handleMarquerFait(o.id)}
                    className="text-xs text-primary hover:underline"
                  >
                    Marquer fait
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Onglet Opérations sensibles ────────────────────────────────────────────────

function OperationsTab({ clientId }: { clientId: string }) {
  const [items, setItems] = useState<OperationSensible[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    apiFetch<OperationSensible[]>(`/operations-sensibles/client/${clientId}`)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = {
      clientId,
      type: form.get("type") as TypeOperationSensible,
      description: form.get("description") as string,
      montant: form.get("montant") ? Number(form.get("montant")) : undefined,
      devise: (form.get("devise") as string) || undefined,
    };
    await apiFetch("/operations-sensibles", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setShowForm(false);
    load();
  }

  async function handleClasser(id: string) {
    await apiFetch(`/operations-sensibles/${id}/classer`, { method: "PATCH" });
    load();
  }

  async function handleTracfin(id: string) {
    const date = prompt("Date de déclaration TRACFIN (AAAA-MM-JJ) :");
    if (!date) return;
    await apiFetch(`/operations-sensibles/${id}/tracfin`, {
      method: "PATCH",
      body: JSON.stringify({ date }),
    });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowForm((v) => !v)}
        >
          + Signaler
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 gap-3 rounded-lg border p-4 sm:grid-cols-2"
        >
          <select
            name="type"
            required
            defaultValue="INHABITUELLE"
            className="col-span-2 h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="SANS_JUSTIFICATION">Sans justification</option>
            <option value="COMPLEXE">Complexe</option>
            <option value="SANS_OBJET_LICITE">Sans objet licite</option>
            <option value="INHABITUELLE">Inhabituelle</option>
            <option value="ECONOMIE_VIRTUELLE">Économie virtuelle</option>
            <option value="ESPECES">Espèces</option>
            <option value="AUTRE">Autre</option>
          </select>
          <Input
            name="description"
            placeholder="Description *"
            required
            className="col-span-2"
          />
          <Input name="montant" type="number" placeholder="Montant" />
          <Input name="devise" placeholder="Devise (EUR…)" maxLength={3} />
          <div className="col-span-2 flex justify-end">
            <Button type="submit" size="sm">
              Signaler
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune opération sensible
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((op) => (
            <div key={op.id} className="rounded-lg border p-4 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  {op.type} <StatusBadge status={op.statut} />
                </p>
                <span className="text-xs text-muted-foreground">
                  {new Date(op.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <p className="mt-1 text-muted-foreground">{op.description}</p>
              {op.montant != null && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Montant : {op.montant} {op.devise ?? ""}
                </p>
              )}
              {op.statut !== "CLASSEE" && op.statut !== "TRACFIN_DECLARE" && (
                <div className="mt-2 flex gap-3">
                  <button
                    onClick={() => handleClasser(op.id)}
                    className="text-xs text-primary hover:underline"
                  >
                    Classer
                  </button>
                  <button
                    onClick={() => handleTracfin(op.id)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Déclarer TRACFIN
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────────

const TABS = [
  { value: "infos", label: "Infos" },
  { value: "kyc", label: "KYC & Docs" },
  { value: "beneficiaires", label: "UBO" },
  { value: "contacts", label: "Contacts" },
  { value: "scoring", label: "Scoring" },
  { value: "missions", label: "Missions" },
  { value: "planning", label: "Planning" },
  { value: "obligations", label: "Obligations" },
  { value: "operations", label: "Opérations" },
];

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [client, setClient] = useState<Client | null>(null);
  const [score, setScore] = useState<ScoreRisque | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tab = searchParams.get("tab") ?? "infos";

  function setTab(value: string) {
    router.replace(`/dashboard/clients/${id}?tab=${value}`);
  }

  const loadClient = useCallback(() => {
    setLoading(true);
    apiFetch<Client>(`/clients/${id}`)
      .then(setClient)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
    apiFetch<ScoreRisque | null>(`/scoring/client/${id}/courant`)
      .then(setScore)
      .catch(() => setScore(null));
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadClient();
  }, [loadClient]);

  if (loading)
    return <div className="p-6 text-sm text-muted-foreground">Chargement…</div>;
  if (error || !client)
    return (
      <div className="p-6 text-sm text-destructive">
        {error ?? "Client introuvable"}
      </div>
    );

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/clients"
            className="text-muted-foreground hover:text-foreground"
          >
            <IconArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">{client.raisonSociale}</h1>
            <p className="text-sm text-muted-foreground">
              {client.ref}
              {client.siret && ` — SIRET ${client.siret}`}
              {client.ville && ` — ${client.ville}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={client.statut} />
          <StatusBadge status={client.kycStatut} />
          {score && <RiskBadge level={score.niveau} />}
        </div>
      </div>

      <Tabs.Root value={tab} onValueChange={setTab}>
        <Tabs.List className="flex flex-wrap border-b">
          {TABS.map(({ value, label }) => (
            <Tabs.Trigger
              key={value}
              value={value}
              className="-mb-px px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground"
            >
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="infos" className="pt-4">
          <InfosTab client={client} onUpdate={loadClient} />
        </Tabs.Content>
        <Tabs.Content value="kyc" className="pt-4">
          <KycTab client={client} onUpdate={loadClient} />
        </Tabs.Content>
        <Tabs.Content value="beneficiaires" className="pt-4">
          <BeneficiairesTab clientId={id} />
        </Tabs.Content>
        <Tabs.Content value="contacts" className="pt-4">
          <ContactsTab clientId={id} />
        </Tabs.Content>
        <Tabs.Content value="scoring" className="pt-4">
          <ScoringTab clientId={id} />
        </Tabs.Content>
        <Tabs.Content value="missions" className="pt-4">
          <MissionsTab clientId={id} />
        </Tabs.Content>
        <Tabs.Content value="planning" className="pt-4">
          <PlanningTab clientId={id} />
        </Tabs.Content>
        <Tabs.Content value="obligations" className="pt-4">
          <ObligationsTab clientId={id} />
        </Tabs.Content>
        <Tabs.Content value="operations" className="pt-4">
          <OperationsTab clientId={id} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
