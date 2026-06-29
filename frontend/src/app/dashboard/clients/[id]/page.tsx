"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import * as Tabs from "@radix-ui/react-tabs";
import {
  IconArrowLeft,
  IconPencil,
  IconCheck,
  IconUpload,
  IconRefresh,
} from "@tabler/icons-react";
import { apiFetch } from "@/lib/apiFetch";
import { useAuth } from "@/hooks/useAuth";
import { StatusBadge, RiskBadge } from "@/lib/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import type {
  Client,
  KycData,
  RiskScore,
  AuditLog,
  ClientDocument,
} from "@/types";

// ── Info tab ──────────────────────────────────────────────────────────────────

function InfoTab({
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
      prenom: form.get("prenom"),
      nom: form.get("nom"),
      email: form.get("email") || undefined,
      telephone: form.get("telephone") || undefined,
      raisonSociale: form.get("raisonSociale") || undefined,
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
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg border p-4 text-sm">
          {[
            ["Référence", client.reference],
            ["Prénom", client.prenom],
            ["Nom", client.nom],
            ["Raison sociale", client.raisonSociale ?? "—"],
            ["Email", client.email ?? "—"],
            ["Téléphone", client.telephone ?? "—"],
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </div>
      )}
      <FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="prenom">Prénom</FieldLabel>
            <Input
              id="prenom"
              name="prenom"
              defaultValue={client.prenom}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="nom">Nom</FieldLabel>
            <Input id="nom" name="nom" defaultValue={client.nom} required />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="raisonSociale">Raison sociale</FieldLabel>
          <Input
            id="raisonSociale"
            name="raisonSociale"
            defaultValue={client.raisonSociale ?? ""}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={client.email ?? ""}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="telephone">Téléphone</FieldLabel>
          <Input
            id="telephone"
            name="telephone"
            defaultValue={client.telephone ?? ""}
          />
        </Field>
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

// ── KYC tab ───────────────────────────────────────────────────────────────────

function KycTab({ clientId }: { clientId: string }) {
  const [kyc, setKyc] = useState<KycData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );

  useEffect(() => {
    apiFetch<KycData>(`/kyc/${clientId}`)
      .then(setKyc)
      .catch(() => setKyc({}))
      .finally(() => setLoading(false));
  }, [clientId]);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const form = new FormData(e.currentTarget);
    const data: KycData = {
      nationalite: (form.get("nationalite") as string) || undefined,
      paysResidence: (form.get("paysResidence") as string) || undefined,
      secteurActivite: (form.get("secteurActivite") as string) || undefined,
      formeJuridique: (form.get("formeJuridique") as string) || undefined,
      estPep: form.get("estPep") === "on",
      paysHautRisque: form.get("paysHautRisque") === "on",
    };
    const ca = form.get("chiffreAffaires") as string;
    if (ca) data.chiffreAffaires = parseFloat(ca);

    try {
      await apiFetch(`/kyc/${clientId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      setMsg({ type: "ok", text: "Enregistré" });
    } catch (err) {
      setMsg({ type: "err", text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return <div className="text-sm text-muted-foreground">Chargement…</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {msg && (
        <div
          className={`rounded p-2 text-sm ${msg.type === "ok" ? "bg-green-50 text-green-700" : "bg-destructive/10 text-destructive"}`}
        >
          {msg.text}
        </div>
      )}
      <FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="nationalite">Nationalité</FieldLabel>
            <Input
              id="nationalite"
              name="nationalite"
              defaultValue={kyc?.nationalite ?? ""}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="paysResidence">Pays de résidence</FieldLabel>
            <Input
              id="paysResidence"
              name="paysResidence"
              defaultValue={kyc?.paysResidence ?? ""}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="secteurActivite">
              Secteur d&apos;activité
            </FieldLabel>
            <Input
              id="secteurActivite"
              name="secteurActivite"
              defaultValue={kyc?.secteurActivite ?? ""}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="formeJuridique">Forme juridique</FieldLabel>
            <Input
              id="formeJuridique"
              name="formeJuridique"
              defaultValue={kyc?.formeJuridique ?? ""}
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="chiffreAffaires">
            Chiffre d&apos;affaires (€)
          </FieldLabel>
          <Input
            id="chiffreAffaires"
            name="chiffreAffaires"
            type="number"
            step="0.01"
            defaultValue={kyc?.chiffreAffaires ?? ""}
          />
        </Field>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="estPep"
              defaultChecked={kyc?.estPep}
              className="size-4"
            />
            Personne politiquement exposée (PEP)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="paysHautRisque"
              defaultChecked={kyc?.paysHautRisque}
              className="size-4"
            />
            Pays à haut risque
          </label>
        </div>
      </FieldGroup>
      <Button type="submit" size="sm" disabled={saving}>
        {saving ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}

// ── Documents tab ─────────────────────────────────────────────────────────────

function DocumentsTab({ clientId }: { clientId: string }) {
  const [docs, setDocs] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadDocs = useCallback(() => {
    apiFetch<ClientDocument[]>(`/documents/${clientId}`)
      .then(setDocs)
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [clientId]);

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
      await apiFetch(`/documents/upload/${clientId}`, { method: "POST", body });
      loadDocs();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-4">
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
      {loading ? (
        <div className="text-sm text-muted-foreground">Chargement…</div>
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Scoring tab ───────────────────────────────────────────────────────────────

function ScoringTab({ clientId }: { clientId: string }) {
  const [scores, setScores] = useState<RiskScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const loadScores = useCallback(() => {
    apiFetch<RiskScore[]>(`/scoring/${clientId}`)
      .then(setScores)
      .catch(() => setScores([]))
      .finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => {
    loadScores();
  }, [loadScores]);

  async function handleRecalculate() {
    setRecalculating(true);
    try {
      await apiFetch(`/scoring/${clientId}`, { method: "POST" });
      loadScores();
    } catch (err) {
      console.error(err);
    } finally {
      setRecalculating(false);
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
                Score : {latest.score}
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
          onClick={handleRecalculate}
          disabled={recalculating || loading}
        >
          <IconRefresh className="size-4" />
          {recalculating ? "Calcul…" : "Recalculer"}
        </Button>
      </div>
      {scores.length > 0 && (
        <div className="overflow-hidden rounded-lg border">
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
                  <td className="px-4 py-2">{s.score}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {new Date(s.calculatedAt).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Audit tab ─────────────────────────────────────────────────────────────────

function AuditTab({ clientId }: { clientId: string }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<AuditLog[]>(`/audit/${clientId}`)
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading)
    return <div className="text-sm text-muted-foreground">Chargement…</div>;

  if (logs.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Aucune entrée d&apos;audit
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex items-start justify-between rounded-lg border px-4 py-3 text-sm"
        >
          <div>
            <p className="font-medium">{log.action}</p>
            {log.utilisateur && (
              <p className="text-xs text-muted-foreground">
                par {log.utilisateur.prenom} {log.utilisateur.nom}
              </p>
            )}
          </div>
          <span className="ml-4 shrink-0 text-xs text-muted-foreground">
            {new Date(log.createdAt).toLocaleDateString("fr-FR")}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const TABS = [
  { value: "info", label: "Informations" },
  { value: "kyc", label: "KYC" },
  { value: "documents", label: "Documents" },
  { value: "scoring", label: "Scoring" },
  { value: "audit", label: "Audit" },
];

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadClient = useCallback(() => {
    setLoading(true);
    apiFetch<Client>(`/clients/${id}`)
      .then(setClient)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    loadClient();
  }, [loadClient]);

  async function handleValidate() {
    try {
      await apiFetch(`/clients/${id}/validate`, { method: "PATCH" });
      loadClient();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (loading)
    return <div className="p-6 text-sm text-muted-foreground">Chargement…</div>;
  if (error || !client)
    return (
      <div className="p-6 text-sm text-destructive">
        {error ?? "Client introuvable"}
      </div>
    );

  const canValidate = role === "admin" || role === "responsable";

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
            <h1 className="text-xl font-semibold">
              {client.prenom} {client.nom}
            </h1>
            <p className="text-sm text-muted-foreground">{client.reference}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={client.statut} />
          {canValidate && client.statut === "en_cours" && (
            <Button size="sm" onClick={handleValidate}>
              <IconCheck className="size-4" />
              Valider le dossier
            </Button>
          )}
        </div>
      </div>

      <Tabs.Root defaultValue="info">
        <Tabs.List className="flex border-b">
          {TABS.map(({ value, label }) => (
            <Tabs.Trigger
              key={value}
              value={value}
              className="-mb-px px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground"
            >
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="info" className="pt-4">
          <InfoTab client={client} onUpdate={loadClient} />
        </Tabs.Content>
        <Tabs.Content value="kyc" className="pt-4">
          <KycTab clientId={id} />
        </Tabs.Content>
        <Tabs.Content value="documents" className="pt-4">
          <DocumentsTab clientId={id} />
        </Tabs.Content>
        <Tabs.Content value="scoring" className="pt-4">
          <ScoringTab clientId={id} />
        </Tabs.Content>
        <Tabs.Content value="audit" className="pt-4">
          <AuditTab clientId={id} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
