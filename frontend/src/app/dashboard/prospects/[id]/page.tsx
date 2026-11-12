"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconArrowLeft,
  IconChevronDown,
  IconEye,
  IconLock,
  IconPencil,
  IconRefresh,
  IconX,
} from "@tabler/icons-react";
import { apiFetch, downloadFile, fetchBlobUrl } from "@/lib/apiFetch";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { ScoringPanel } from "@/components/scoring-panel";
import { StatusBadge, OBLIGATION_TYPE_LABELS } from "@/lib/status";
import { fetchSirene } from "@/lib/sirene";
import { DocumentsPanel } from "@/components/documents-panel";
import { BeneficiairesPanel } from "@/components/beneficiaires-panel";
import {
  accederDossierLocal,
  deplacerFichierLocal,
  supprimerDossierSiVide,
} from "@/lib/local-folder";
import type {
  AssignationTache,
  Mission,
  Obligation,
  PlanningEtape,
  Prospect,
  RepartitionTravauxCategorie,
  StatutKanban,
  TypeEntite,
  TypeMission,
  User,
} from "@/types";

const MISSION_TYPE_LABELS: Record<TypeMission, string> = {
  COMPTABILITE: "Comptabilité",
  AUDIT: "Audit",
  CONSEIL: "Conseil",
  JURIDIQUE: "Juridique",
  AUTRE: "Autre",
};

const KANBAN_LABELS: Record<StatutKanban, string> = {
  PRISE_CONTACT: "Prise de contact",
  PREPARATION_LAB: "Préparation LAB",
  VALIDATION_LAB: "Validation LAB",
  LM_A_FAIRE: "Prospects LM à faire",
  LM_ENVOYEE: "Prospects LM envoyées",
  CONVERTI: "Clients LM validées",
  REFUSE: "Prospects refusés",
};

// Statuts sélectionnables à la main. « Converti » n'y figure pas : il n'est
// posé que par le bouton « Convertir en client » (création réelle du
// client) ; « Refusé » passe par « Refuser le prospect » (motif requis).
const KANBAN_ACTIFS: StatutKanban[] = [
  "PRISE_CONTACT",
  "PREPARATION_LAB",
  "VALIDATION_LAB",
  "LM_A_FAIRE",
  "LM_ENVOYEE",
];

export default function ProspectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { can, role, userId } = useRole();

  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [conditionsConversion, setConditionsConversion] = useState<
    string[] | null
  >(null);
  const [refusOpen, setRefusOpen] = useState(false);
  const [motifRefus, setMotifRefus] = useState("");
  const [refusing, setRefusing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [sireneLoading, setSireneLoading] = useState(false);
  const [sireneError, setSireneError] = useState<string | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionsLoading, setMissionsLoading] = useState(true);
  const [missionType, setMissionType] = useState<TypeMission>("COMPTABILITE");
  const [creatingMission, setCreatingMission] = useState(false);
  const [missionError, setMissionError] = useState<string | null>(null);
  const [signingLettre, setSigningLettre] = useState(false);
  const [catalogue, setCatalogue] = useState<RepartitionTravauxCategorie[]>([]);
  const [repartition, setRepartition] = useState<
    Record<string, AssignationTache>
  >({});
  const [deletingMissionId, setDeletingMissionId] = useState<string | null>(
    null,
  );
  const [editingMissionId, setEditingMissionId] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);
  const [previewLettre, setPreviewLettre] = useState<{
    id: string;
    url: string;
  } | null>(null);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [etapes, setEtapes] = useState<PlanningEtape[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch<Prospect>(`/prospects/${id}`)
      .then(setProspect)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
    apiFetch<string[]>(`/prospects/${id}/conditions-conversion`)
      .then(setConditionsConversion)
      .catch(() => setConditionsConversion(null));
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

  const loadMissions = useCallback(() => {
    setMissionsLoading(true);
    apiFetch<Mission[]>(`/missions/prospect/${id}`)
      .then(setMissions)
      .catch(() => setMissions([]))
      .finally(() => setMissionsLoading(false));
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMissions();
  }, [loadMissions]);

  useEffect(() => {
    apiFetch<RepartitionTravauxCategorie[]>("/missions/repartition-catalogue")
      .then(setCatalogue)
      .catch(() => setCatalogue([]));
  }, []);

  // Tâches "à faire" générées automatiquement par le pipeline LAB → lettre
  // de mission (questionnaire à remplir/valider, LM à faire/valider/signer).
  // Purement informatif ici : ces obligations/étapes sont ouvertes et
  // clôturées par le backend, pas d'action manuelle depuis cette carte.
  useEffect(() => {
    apiFetch<Obligation[]>(`/obligations/prospect/${id}`)
      .then(setObligations)
      .catch(() => setObligations([]));
    apiFetch<PlanningEtape[]>(`/planning/prospect/${id}`)
      .then(setEtapes)
      .catch(() => setEtapes([]));
  }, [id, prospect?.questionnaire?.statut]);

  async function handleCreateMission(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreatingMission(true);
    setMissionError(null);
    const form = new FormData(e.currentTarget);
    // Chaque ligne non touchée par le collaborateur reste à "N/A" (pas de
    // présomption Cabinet/Client par défaut).
    const repartitionTravaux =
      catalogue.length > 0
        ? catalogue.flatMap((cat) =>
            cat.lignes.map((ligne) => ({
              id: ligne.id,
              assignation: repartition[ligne.id] ?? "NA",
            })),
          )
        : undefined;
    try {
      await apiFetch<Mission>("/missions", {
        method: "POST",
        body: JSON.stringify({
          prospectId: id,
          type: missionType,
          dateDebut: form.get("dateDebut") as string,
          description: (form.get("description") as string) || undefined,
          honoraires: form.get("honoraires")
            ? Number(form.get("honoraires"))
            : undefined,
          repartitionTravaux,
        }),
      });
      setRepartition({});
      loadMissions();
    } catch (err) {
      setMissionError(
        err instanceof Error
          ? err.message
          : "Impossible de préparer la lettre de mission.",
      );
    } finally {
      setCreatingMission(false);
    }
  }

  async function handleDownloadLettre(lettreId: string) {
    try {
      await downloadFile(
        `/lettres-mission/${lettreId}/download`,
        `lettre-mission-${lettreId}.pdf`,
      );
    } catch (err) {
      setMissionError(
        err instanceof Error
          ? err.message
          : "Impossible de télécharger la lettre de mission.",
      );
    }
  }

  async function handlePreviewLettre(lettreId: string) {
    setPreviewLoading(lettreId);
    setMissionError(null);
    try {
      const url = await fetchBlobUrl(`/lettres-mission/${lettreId}/download`);
      setPreviewLettre({ id: lettreId, url });
    } catch (err) {
      setMissionError(
        err instanceof Error
          ? err.message
          : "Impossible d'afficher l'aperçu de la lettre de mission.",
      );
    } finally {
      setPreviewLoading(null);
    }
  }

  function closePreviewLettre() {
    if (previewLettre) URL.revokeObjectURL(previewLettre.url);
    setPreviewLettre(null);
  }

  async function handleValiderLettre(lettreId: string) {
    setSigningLettre(true);
    setMissionError(null);
    try {
      await apiFetch(`/lettres-mission/${lettreId}/valider`, {
        method: "PATCH",
      });
      loadMissions();
    } catch (err) {
      setMissionError(
        err instanceof Error
          ? err.message
          : "Impossible de valider la lettre de mission.",
      );
    } finally {
      setSigningLettre(false);
    }
  }

  async function handleSignerLettre(lettreId: string) {
    setSigningLettre(true);
    setMissionError(null);
    try {
      await apiFetch(`/lettres-mission/${lettreId}/signer`, {
        method: "PATCH",
      });
      loadMissions();
    } catch (err) {
      setMissionError(
        err instanceof Error
          ? err.message
          : "Impossible de signer la lettre de mission.",
      );
    } finally {
      setSigningLettre(false);
    }
  }

  async function handleDeleteMission(missionId: string) {
    if (
      !confirm(
        "Supprimer cette mission et son brouillon de lettre de mission ? Cette action est irréversible.",
      )
    ) {
      return;
    }
    setDeletingMissionId(missionId);
    setMissionError(null);
    try {
      await apiFetch(`/missions/${missionId}`, { method: "DELETE" });
      loadMissions();
    } catch (err) {
      setMissionError(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer cette mission.",
      );
    } finally {
      setDeletingMissionId(null);
    }
  }

  function openEditMission(m: Mission) {
    setEditingMissionId(m.id);
    setMissionError(null);
    setRepartition(
      Object.fromEntries(
        (m.repartitionTravaux ?? []).map((a) => [a.id, a.assignation]),
      ),
    );
  }

  async function handleUpdateMission(
    e: React.SyntheticEvent<HTMLFormElement>,
    m: Mission,
  ) {
    e.preventDefault();
    setCreatingMission(true);
    setMissionError(null);
    const form = new FormData(e.currentTarget);
    const repartitionTravaux =
      catalogue.length > 0
        ? catalogue.flatMap((cat) =>
            cat.lignes.map((ligne) => ({
              id: ligne.id,
              assignation: repartition[ligne.id] ?? "NA",
            })),
          )
        : undefined;
    try {
      await apiFetch<Mission>(`/missions/${m.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          description: (form.get("description") as string) || undefined,
          dateFin: (form.get("dateFin") as string) || undefined,
          honoraires: form.get("honoraires")
            ? Number(form.get("honoraires"))
            : undefined,
          repartitionTravaux,
        }),
      });
      setEditingMissionId(null);
      setRepartition({});
      loadMissions();
    } catch (err) {
      setMissionError(
        err instanceof Error
          ? err.message
          : "Impossible de modifier cette mission.",
      );
    } finally {
      setCreatingMission(false);
    }
  }

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
    // Champ vidé → null (effacement), sauf pays (obligatoire, défaut France).
    const texte = (cle: string) => {
      const v = form.get(cle);
      if (v === null) return undefined; // champ absent du formulaire
      return (v as string).trim() || null;
    };
    const nombre = (cle: string) => {
      const v = texte(cle);
      return v === undefined || v === null ? v : Number(v);
    };
    const siret = texte("siret");
    const data = {
      nom: form.get("nom") as string,
      typeEntite: form.get("typeEntite") as TypeEntite,
      email: texte("email"),
      telephone: texte("telephone"),
      siret: siret ? siret.replace(/\s/g, "") : siret,
      formeJuridique: texte("formeJuridique"),
      representantLegal: texte("representantLegal"),
      activite: texte("activite"),
      codeNaf: texte("codeNaf"),
      adresse: texte("adresse"),
      ville: texte("ville"),
      codePostal: texte("codePostal"),
      pays: texte("pays") ?? undefined,
      notes: texte("notes"),
      chiffreAffaires: nombre("chiffreAffaires"),
      effectif: nombre("effectif"),
      capitalSocial: nombre("capitalSocial"),
      regimeFiscal: texte("regimeFiscal"),
      regimeTva: texte("regimeTva"),
      tvaIntracommunautaire: texte("tvaIntracommunautaire"),
      existenceSalaries: form.get("existenceSalaries")
        ? form.get("existenceSalaries") === "oui"
        : undefined,
      conventionCollective: texte("conventionCollective"),
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

  async function handleRefreshSirene() {
    if (!prospect?.siret) return;
    setSireneLoading(true);
    setSireneError(null);
    try {
      const data = await fetchSirene(prospect.siret);
      await apiFetch(`/prospects/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          nom: data.nom || undefined,
          formeJuridique: data.formeJuridique,
          representantLegal: data.representantLegal,
          codeNaf: data.codeNaf,
          activite: data.secteurActivite,
          adresse: data.adresse,
          ville: data.ville,
          codePostal: data.codePostal,
          capitalSocial: data.capitalSocial,
          tvaIntracommunautaire: data.tvaIntracommunautaire,
          existenceSalaries: data.existenceSalaries,
        }),
      });
      load();
    } catch (err) {
      setSireneError(
        err instanceof Error
          ? err.message
          : "SIRET introuvable ou service SIRENE indisponible",
      );
    } finally {
      setSireneLoading(false);
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
      const client = await apiFetch<{
        id: string;
        deplacementsDocuments: { de: string; vers: string }[];
      }>(`/prospects/${id}/convert`, { method: "POST" });

      // Range les fichiers du dossier local dans Clients/<Réf> <Nom>/.
      if (userId && client.deplacementsDocuments.length > 0) {
        let echecs = 0;
        try {
          const dossier = await accederDossierLocal(userId, true);
          for (const d of client.deplacementsDocuments) {
            const ok = await deplacerFichierLocal(dossier, d.de, d.vers).catch(
              () => false,
            );
            if (!ok) echecs++;
          }
          const ancienDossier = client.deplacementsDocuments[0].de
            .split("/")
            .slice(0, 2)
            .join("/");
          await supprimerDossierSiVide(dossier, ancienDossier);
        } catch {
          echecs = client.deplacementsDocuments.length;
        }
        if (echecs > 0) {
          window.alert(
            `Client créé. ${echecs} fichier(s) n’ont pas pu être rangés dans votre dossier local : utilisez « Synchroniser » dans Mon profil.`,
          );
        }
      }

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

  async function handleRefuse(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!motifRefus.trim()) return;
    setRefusing(true);
    try {
      await apiFetch(`/prospects/${id}/refuser`, {
        method: "PATCH",
        body: JSON.stringify({ motif: motifRefus.trim() }),
      });
      setRefusOpen(false);
      setMotifRefus("");
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRefusing(false);
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

  // Verrouillage réel : existence d'un Client lié, pas juste le statut
  // kanban "CONVERTI" (librement déplaçable sans déclencher la conversion).
  const hasClient = !!prospect.client;
  const isArchived = hasClient || prospect.statutKanban === "REFUSE";
  const currentIdx = KANBAN_ACTIFS.indexOf(prospect.statutKanban);
  // Miroir front de assertCollaborateurPeutTraiter (backend) : un
  // COLLABORATEUR ne peut traiter que les prospects non assignés ou
  // assignés à lui-même — RESPONSABLE/EXPERT_COMPTABLE/ADMIN sans contrainte.
  const peutTraiter =
    role !== "COLLABORATEUR" ||
    !prospect.assignedTo ||
    prospect.assignedTo.id === userId;
  // Suppression : règle distincte, plus stricte — un COLLABORATEUR ne peut
  // supprimer que ce qu'il a lui-même créé (fausse manip), indépendamment
  // de l'assignation actuelle (cf. prospects.service.ts::remove).
  const peutSupprimer =
    role !== "COLLABORATEUR" || prospect.createdBy?.id === userId;
  // Refuser un prospect est une décision métier réservée à
  // RESPONSABLE/EXPERT_COMPTABLE/ADMIN (cf. prospects.controller.ts).
  const peutRefuser = role !== "COLLABORATEUR";

  // Champs légaux requis sur la lettre de mission — miroir front de ce que
  // le template affiche en "À compléter" faute de donnée (cf.
  // lettre-mission.template.ts). Convention collective non requise si le
  // prospect n'a explicitement aucun salarié (existenceSalaries === false).
  const champsLegauxManquants = [
    !prospect.capitalSocial && "Capital social",
    !prospect.regimeFiscal && "Régime fiscal",
    !prospect.regimeTva && "Régime TVA",
    !prospect.tvaIntracommunautaire && "N° TVA intracommunautaire",
    prospect.existenceSalaries == null && "Existence de salariés",
    prospect.existenceSalaries !== false &&
      !prospect.conventionCollective &&
      "Convention collective appliquée",
  ].filter((v): v is string => !!v);

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
            {!isArchived && peutTraiter && (
              <button
                onClick={() => setEditing(!editing)}
                className="flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/30 transition-colors"
              >
                <IconPencil className="size-3.5" /> Éditer
              </button>
            )}
            {/* Le statut kanban reste toujours modifiable, y compris sur un
                prospect réellement converti — c'est un outil de suivi, pas
                un reflet strict de l'état réel (voir prospects.service.ts).
                Reste toutefois soumis à l'assignation pour un COLLABORATEUR. */}
            <div className="relative">
              <button
                onClick={() => peutTraiter && setShowDropdown(!showDropdown)}
                disabled={!peutTraiter}
                title={
                  peutTraiter
                    ? undefined
                    : "Seul le collaborateur assigné peut modifier ce statut"
                }
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                  !peutTraiter
                    ? "bg-white/60 text-indigo-400 cursor-not-allowed"
                    : prospect.statutKanban === "REFUSE"
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : "bg-white text-indigo-700 hover:bg-indigo-50"
                }`}
              >
                {KANBAN_LABELS[prospect.statutKanban]}
                {peutTraiter && <IconChevronDown className="size-3.5" />}
              </button>
              {showDropdown && peutTraiter && (
                <div className="absolute right-0 top-full mt-1 z-20 w-52 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                  {prospect.statutKanban === "REFUSE" && (
                    <p className="px-4 py-2 text-[11px] text-slate-400 border-b border-slate-100">
                      Revenir en arrière :
                    </p>
                  )}
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
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="px-4 -mt-4 space-y-4 pb-6 md:px-8">
        {prospect.statutKanban === "REFUSE" && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">Prospect refusé</p>
            <p className="mt-1 whitespace-pre-line">
              {prospect.motifRefus || "Motif non renseigné"}
            </p>
            <p className="mt-2 text-xs text-red-600">
              Archivé automatiquement 7 jours après le refus. Pour le réactiver,
              changez son statut ci-dessus.
            </p>
          </div>
        )}
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
                  {!isArchived && peutTraiter && (
                    <div className="px-4 py-3 border-t border-slate-100 space-y-1.5">
                      <button
                        onClick={handleRefreshSirene}
                        disabled={!prospect.siret || sireneLoading}
                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <IconRefresh
                          className={`size-3.5 ${sireneLoading ? "animate-spin" : ""}`}
                        />
                        {sireneLoading ? "Actualisation…" : "Actualiser SIRENE"}
                      </button>
                      {!prospect.siret && (
                        <p className="text-xs text-slate-400">
                          Aucun SIRET enregistré pour ce prospect.
                        </p>
                      )}
                      {sireneError && (
                        <p className="text-xs text-red-600">{sireneError}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Informations légales — reprises telles quelles sur la
                    lettre de mission (cf. bannière plus bas si incomplètes). */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/80">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Informations légales
                    </p>
                  </div>
                  <dl className="divide-y divide-slate-50">
                    {(
                      [
                        [
                          "Capital social",
                          prospect.capitalSocial
                            ? `${prospect.capitalSocial.toLocaleString("fr-FR")} €`
                            : null,
                        ],
                        ["Régime fiscal", prospect.regimeFiscal],
                        ["Régime TVA", prospect.regimeTva],
                        [
                          "N° TVA intracommunautaire",
                          prospect.tvaIntracommunautaire,
                        ],
                        [
                          "Existence de salariés",
                          prospect.existenceSalaries == null
                            ? null
                            : prospect.existenceSalaries
                              ? "Oui"
                              : "Non",
                        ],
                        [
                          "Convention collective",
                          prospect.existenceSalaries === false
                            ? "Sans objet"
                            : prospect.conventionCollective,
                        ],
                      ] as [string, string | null][]
                    ).map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between px-4 py-2.5 gap-3"
                      >
                        <dt className="text-xs text-slate-400 shrink-0 w-32">
                          {label}
                        </dt>
                        <dd
                          className={`text-sm text-right truncate ${
                            value
                              ? "font-medium text-slate-800"
                              : "font-semibold text-amber-700"
                          }`}
                        >
                          {value ?? "⚠ À compléter"}
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

                {/* Notes internes — mises en évidence : jamais visibles du
                    client, donc distinguées visuellement des autres blocs. */}
                <div className="bg-violet-50 rounded-2xl border border-violet-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-violet-200 flex items-center gap-1.5">
                    <IconLock className="size-3.5 text-violet-500" />
                    <p className="text-xs font-bold uppercase tracking-widest text-violet-700">
                      Notes internes
                    </p>
                  </div>
                  <div className="px-4 py-3">
                    {prospect.notes ? (
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">
                        {prospect.notes}
                      </p>
                    ) : (
                      <p className="text-sm text-violet-300 italic">
                        Aucune note
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <form onSubmit={handleSave} className="space-y-3">
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
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <Field>
                        <FieldLabel htmlFor="codePostal">
                          Code postal
                        </FieldLabel>
                        <Input
                          id="codePostal"
                          name="codePostal"
                          defaultValue={prospect.codePostal ?? ""}
                          className="rounded-xl"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="ville">Ville</FieldLabel>
                        <Input
                          id="ville"
                          name="ville"
                          defaultValue={prospect.ville ?? ""}
                          className="rounded-xl"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="pays">Pays</FieldLabel>
                        <Input
                          id="pays"
                          name="pays"
                          defaultValue={prospect.pays ?? "France"}
                          className="rounded-xl"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="formeJuridique">
                          Forme juridique
                        </FieldLabel>
                        <Input
                          id="formeJuridique"
                          name="formeJuridique"
                          defaultValue={prospect.formeJuridique ?? ""}
                          className="rounded-xl"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="representantLegal">
                          Représentant légal
                        </FieldLabel>
                        <Input
                          id="representantLegal"
                          name="representantLegal"
                          defaultValue={prospect.representantLegal ?? ""}
                          className="rounded-xl"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="codeNaf">Code NAF</FieldLabel>
                        <Input
                          id="codeNaf"
                          name="codeNaf"
                          defaultValue={prospect.codeNaf ?? ""}
                          className="rounded-xl"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="chiffreAffaires">
                          Chiffre d’affaires (€)
                        </FieldLabel>
                        <Input
                          id="chiffreAffaires"
                          name="chiffreAffaires"
                          type="number"
                          min={0}
                          step="0.01"
                          defaultValue={prospect.chiffreAffaires ?? ""}
                          className="rounded-xl"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="effectif">Effectif</FieldLabel>
                        <Input
                          id="effectif"
                          name="effectif"
                          type="number"
                          min={0}
                          step={1}
                          defaultValue={prospect.effectif ?? ""}
                          className="rounded-xl"
                        />
                      </Field>
                    </div>
                  </FieldGroup>
                </div>

                {/* Informations légales — nécessaires à la génération de la
                    lettre de mission (elles y apparaissent en "À compléter"
                    tant qu'elles ne sont pas renseignées ici). */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Informations légales (lettre de mission)
                  </p>
                  <FieldGroup>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="capitalSocial">
                          Capital social (€)
                        </FieldLabel>
                        <Input
                          id="capitalSocial"
                          name="capitalSocial"
                          type="number"
                          step="0.01"
                          defaultValue={prospect.capitalSocial ?? ""}
                          className="rounded-xl"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="regimeFiscal">
                          Régime fiscal
                        </FieldLabel>
                        <Input
                          id="regimeFiscal"
                          name="regimeFiscal"
                          placeholder="IS, IR…"
                          defaultValue={prospect.regimeFiscal ?? ""}
                          className="rounded-xl"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="regimeTva">Régime TVA</FieldLabel>
                        <Input
                          id="regimeTva"
                          name="regimeTva"
                          placeholder="Réel normal, franchise en base…"
                          defaultValue={prospect.regimeTva ?? ""}
                          className="rounded-xl"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="tvaIntracommunautaire">
                          N° TVA intracommunautaire
                        </FieldLabel>
                        <Input
                          id="tvaIntracommunautaire"
                          name="tvaIntracommunautaire"
                          defaultValue={prospect.tvaIntracommunautaire ?? ""}
                          className="rounded-xl font-mono"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="existenceSalaries">
                          Existence de salariés
                        </FieldLabel>
                        <select
                          id="existenceSalaries"
                          name="existenceSalaries"
                          defaultValue={
                            prospect.existenceSalaries == null
                              ? ""
                              : prospect.existenceSalaries
                                ? "oui"
                                : "non"
                          }
                          className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        >
                          <option value="">Non renseigné</option>
                          <option value="oui">Oui</option>
                          <option value="non">Non</option>
                        </select>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="conventionCollective">
                          Convention collective appliquée
                        </FieldLabel>
                        <Input
                          id="conventionCollective"
                          name="conventionCollective"
                          defaultValue={prospect.conventionCollective ?? ""}
                          className="rounded-xl"
                        />
                      </Field>
                    </div>
                  </FieldGroup>
                </div>

                {/* Notes internes — bloc dédié, distinct du reste du
                    formulaire (même traitement visuel qu'en lecture seule). */}
                <div className="bg-violet-50 rounded-2xl border border-violet-200 shadow-sm p-4 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <IconLock className="size-3.5 text-violet-500" />
                    <FieldLabel
                      htmlFor="notes"
                      className="text-xs font-bold uppercase tracking-widest text-violet-700"
                    >
                      Notes internes
                    </FieldLabel>
                  </div>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    defaultValue={prospect.notes ?? ""}
                    className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
                  />
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
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
                    {prospect.questionnaire ? (
                      <StatusBadge status={prospect.questionnaire.statut} />
                    ) : (
                      <span className="text-slate-500 font-semibold">
                        Non créé
                      </span>
                    )}
                  </p>
                </div>

                {prospect.questionnaire?.statut === "REFUSE" &&
                  prospect.questionnaire.motifRefus && (
                    <p className="text-xs text-red-600">
                      Motif : {prospect.questionnaire.motifRefus}
                    </p>
                  )}

                {/* La validation/le refus du questionnaire ne se font que
                    depuis la sous-page dédiée — ici on n'affiche que le
                    statut (ci-dessus) et un lien vers cette sous-page. */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Link
                    href={`/dashboard/prospects/${id}/questionnaire`}
                    className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
                  >
                    Voir le questionnaire →
                  </Link>
                  <span className="text-xs text-slate-400">
                    (RESPONSABLE/EXPERT)
                  </span>
                </div>
              </div>
            </div>

            {/* À faire — tâches ouvertes automatiquement par le pipeline
                LAB → lettre de mission (lecture seule, gérées par le
                backend au fil des validations/signatures). */}
            {(obligations.length > 0 || etapes.length > 0) && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/80">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    À faire
                  </p>
                </div>
                <ul className="divide-y divide-slate-50">
                  {etapes.map((etape) => (
                    <li
                      key={`etape-${etape.id}`}
                      className="flex items-center justify-between gap-3 px-4 py-2.5"
                    >
                      <span className="text-sm text-slate-700">
                        {etape.titre}
                      </span>
                      <StatusBadge status={etape.statut} />
                    </li>
                  ))}
                  {obligations.map((obligation) => (
                    <li
                      key={`obligation-${obligation.id}`}
                      className="flex items-center justify-between gap-3 px-4 py-2.5"
                    >
                      <span className="text-sm text-slate-700">
                        {OBLIGATION_TYPE_LABELS[obligation.type] ??
                          obligation.type}
                      </span>
                      <StatusBadge status={obligation.statut} />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Lettre de mission */}
            {prospect.questionnaire?.statut === "VALIDE" && !isArchived && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/80">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Lettre de mission
                  </p>
                </div>
                <div className="px-4 py-4 space-y-3">
                  {champsLegauxManquants.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                      <p className="font-semibold">
                        Informations manquantes sur la fiche prospect — la
                        lettre de mission affichera « À compléter » pour :
                      </p>
                      <ul className="mt-1 list-disc pl-4">
                        {champsLegauxManquants.map((champ) => (
                          <li key={champ}>{champ}</li>
                        ))}
                      </ul>
                      {!editing && peutTraiter && (
                        <button
                          type="button"
                          onClick={() => setEditing(true)}
                          className="mt-2 font-semibold text-amber-900 underline hover:text-amber-950"
                        >
                          Compléter la fiche →
                        </button>
                      )}
                    </div>
                  )}
                  {missionError && (
                    <p className="text-xs text-red-600">{missionError}</p>
                  )}

                  {missionsLoading ? (
                    <p className="text-xs text-slate-400">Chargement…</p>
                  ) : missions.length === 0 ? (
                    <form
                      onSubmit={handleCreateMission}
                      className="space-y-2.5"
                    >
                      <p className="text-xs text-slate-500">
                        Préparez la mission pour générer un brouillon de lettre
                        de mission, prête à être envoyée une fois le prospect
                        validé.
                      </p>
                      <select
                        value={missionType}
                        onChange={(e) =>
                          setMissionType(e.target.value as TypeMission)
                        }
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      >
                        {Object.entries(MISSION_TYPE_LABELS).map(
                          ([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ),
                        )}
                      </select>
                      <Input
                        name="dateDebut"
                        type="date"
                        required
                        defaultValue={new Date().toISOString().slice(0, 10)}
                        className="h-9 rounded-lg text-sm"
                      />
                      <Input
                        name="honoraires"
                        type="number"
                        step="0.01"
                        placeholder="Honoraires (€ HT)"
                        className="h-9 rounded-lg text-sm"
                      />
                      <textarea
                        name="description"
                        rows={2}
                        placeholder="Description (facultatif)"
                        className="w-full resize-none rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />

                      {catalogue.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-slate-600">
                            Répartition des travaux
                            <span className="ml-1 font-normal text-slate-400">
                              — à défaut : N/A pour toutes les tâches
                            </span>
                          </p>
                          {catalogue.map((cat) => (
                            <div key={cat.titre}>
                              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                {cat.titre}
                              </p>
                              <div className="overflow-x-auto rounded-lg border border-slate-200">
                                <table className="w-full min-w-[360px] text-xs">
                                  <thead className="bg-slate-50 text-slate-500">
                                    <tr>
                                      <th className="px-2 py-1.5 text-left font-semibold">
                                        Tâche
                                      </th>
                                      <th className="px-2 py-1.5 text-center font-semibold">
                                        Cabinet
                                      </th>
                                      <th className="px-2 py-1.5 text-center font-semibold">
                                        Client
                                      </th>
                                      <th className="px-2 py-1.5 text-center font-semibold">
                                        N/A
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {cat.lignes.map((ligne) => {
                                      const value =
                                        repartition[ligne.id] ?? "NA";
                                      return (
                                        <tr key={ligne.id}>
                                          <td className="px-2 py-1.5 text-slate-700">
                                            {ligne.tache}
                                          </td>
                                          {(
                                            [
                                              "CABINET",
                                              "CLIENT",
                                              "NA",
                                            ] as AssignationTache[]
                                          ).map((option) => (
                                            <td
                                              key={option}
                                              className="px-2 py-1.5"
                                            >
                                              <div className="flex items-center justify-center">
                                                <input
                                                  type="checkbox"
                                                  name={`repartition-${ligne.id}`}
                                                  checked={value === option}
                                                  onChange={() =>
                                                    setRepartition((prev) => ({
                                                      ...prev,
                                                      [ligne.id]: option,
                                                    }))
                                                  }
                                                  className="size-4 rounded border-slate-300 accent-indigo-600 cursor-pointer"
                                                />
                                              </div>
                                            </td>
                                          ))}
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <Button
                        type="submit"
                        size="sm"
                        disabled={creatingMission}
                        className="w-full rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold"
                      >
                        {creatingMission
                          ? "Préparation…"
                          : "Préparer la lettre de mission"}
                      </Button>
                    </form>
                  ) : (
                    missions.map((m) => {
                      const lettre = m.lettresMission?.[0];
                      // Signée par l'expert seul reste réversible (erreur
                      // humaine) — seul un envoi effectif en signature au
                      // client (DocuSign) verrouille définitivement.
                      const verrouillee = !!lettre?.docusignEnvelopeId;

                      if (editingMissionId === m.id) {
                        return (
                          <form
                            key={m.id}
                            onSubmit={(e) => handleUpdateMission(e, m)}
                            className="space-y-2.5 rounded-lg border border-indigo-100 bg-indigo-50/40 p-2.5"
                          >
                            <p className="text-xs font-semibold text-slate-600">
                              Modifier — {MISSION_TYPE_LABELS[m.type]}
                            </p>
                            <Input
                              name="dateFin"
                              type="date"
                              defaultValue={m.dateFin ?? ""}
                              placeholder="Date de fin"
                              className="h-9 rounded-lg text-sm"
                            />
                            <Input
                              name="honoraires"
                              type="number"
                              step="0.01"
                              defaultValue={m.honoraires ?? ""}
                              placeholder="Honoraires (€ HT)"
                              className="h-9 rounded-lg text-sm"
                            />
                            <textarea
                              name="description"
                              rows={2}
                              defaultValue={m.description ?? ""}
                              placeholder="Description (facultatif)"
                              className="w-full resize-none rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                            />

                            {catalogue.length > 0 && (
                              <div className="space-y-3">
                                <p className="text-xs font-semibold text-slate-600">
                                  Répartition des travaux
                                </p>
                                {catalogue.map((cat) => (
                                  <div key={cat.titre}>
                                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                      {cat.titre}
                                    </p>
                                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                                      <table className="w-full min-w-[360px] text-xs">
                                        <thead className="bg-slate-50 text-slate-500">
                                          <tr>
                                            <th className="px-2 py-1.5 text-left font-semibold">
                                              Tâche
                                            </th>
                                            <th className="px-2 py-1.5 text-center font-semibold">
                                              Cabinet
                                            </th>
                                            <th className="px-2 py-1.5 text-center font-semibold">
                                              Client
                                            </th>
                                            <th className="px-2 py-1.5 text-center font-semibold">
                                              N/A
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                          {cat.lignes.map((ligne) => {
                                            const value =
                                              repartition[ligne.id] ?? "NA";
                                            return (
                                              <tr key={ligne.id}>
                                                <td className="px-2 py-1.5 text-slate-700">
                                                  {ligne.tache}
                                                </td>
                                                {(
                                                  [
                                                    "CABINET",
                                                    "CLIENT",
                                                    "NA",
                                                  ] as AssignationTache[]
                                                ).map((option) => (
                                                  <td
                                                    key={option}
                                                    className="px-2 py-1.5"
                                                  >
                                                    <div className="flex items-center justify-center">
                                                      <input
                                                        type="checkbox"
                                                        name={`repartition-edit-${ligne.id}`}
                                                        checked={
                                                          value === option
                                                        }
                                                        onChange={() =>
                                                          setRepartition(
                                                            (prev) => ({
                                                              ...prev,
                                                              [ligne.id]:
                                                                option,
                                                            }),
                                                          )
                                                        }
                                                        className="size-4 rounded border-slate-300 accent-indigo-600 cursor-pointer"
                                                      />
                                                    </div>
                                                  </td>
                                                ))}
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <Button
                                type="submit"
                                size="sm"
                                disabled={creatingMission}
                                className="flex-1 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold"
                              >
                                {creatingMission
                                  ? "Enregistrement…"
                                  : "Enregistrer"}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingMissionId(null);
                                  setRepartition({});
                                }}
                                className="rounded-lg"
                              >
                                Annuler
                              </Button>
                            </div>
                          </form>
                        );
                      }

                      return (
                        <div key={m.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-700">
                              {MISSION_TYPE_LABELS[m.type]}
                            </p>
                            {lettre && (
                              <span
                                className={`text-xs font-semibold ${
                                  lettre.signeeParExpert
                                    ? "text-emerald-600"
                                    : lettre.valideeParResponsable
                                      ? "text-blue-600"
                                      : "text-amber-600"
                                }`}
                              >
                                {lettre.signeeParExpert
                                  ? "Signée (expert) ✓"
                                  : lettre.valideeParResponsable
                                    ? "Validée (responsable) ✓"
                                    : "Brouillon — en attente de validation"}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            {lettre && (
                              <button
                                type="button"
                                disabled={previewLoading === lettre.id}
                                onClick={() => handlePreviewLettre(lettre.id)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
                              >
                                <IconEye className="size-3.5" />
                                {previewLoading === lettre.id
                                  ? "Chargement…"
                                  : "Aperçu"}
                              </button>
                            )}
                            {/* Téléchargement réservé à l'expert-comptable,
                                et seulement une fois le client signataire
                                (DocuSign) — l'aperçu ci-dessus reste ouvert
                                à tous pour suivre l'avancement du brouillon. */}
                            {lettre &&
                              (role === "EXPERT_COMPTABLE" ||
                                role === "ADMIN") &&
                              lettre.docusignStatut === "SIGNE" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDownloadLettre(lettre.id)
                                  }
                                  className="text-xs font-medium text-blue-600 hover:text-blue-800"
                                >
                                  Télécharger le PDF
                                </button>
                              )}
                            {lettre &&
                              can.validerLettreMission &&
                              !lettre.valideeParResponsable && (
                                <button
                                  type="button"
                                  disabled={signingLettre}
                                  onClick={() => handleValiderLettre(lettre.id)}
                                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                >
                                  Valider (responsable)
                                </button>
                              )}
                            {lettre &&
                              can.signerLettre &&
                              lettre.valideeParResponsable &&
                              !lettre.signeeParExpert && (
                                <button
                                  type="button"
                                  disabled={signingLettre}
                                  onClick={() => handleSignerLettre(lettre.id)}
                                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 disabled:opacity-50"
                                >
                                  Signer (expert-comptable)
                                </button>
                              )}
                            {!verrouillee && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openEditMission(m)}
                                  className="text-xs font-medium text-slate-500 hover:text-slate-800"
                                >
                                  Modifier
                                </button>
                                <button
                                  type="button"
                                  disabled={deletingMissionId === m.id}
                                  onClick={() => handleDeleteMission(m.id)}
                                  className="text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
                                >
                                  {deletingMissionId === m.id
                                    ? "Suppression…"
                                    : "Supprimer"}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Score de risque */}
            <ScoringPanel entityType="prospect" entityId={prospect.id} />

            {/* Step visuel */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/80">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Étapes Kanban
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Cliquez sur une étape pour y déplacer le prospect (avancer ou
                  revenir en arrière).
                </p>
              </div>
              <div className="px-4 py-4 space-y-1">
                {KANBAN_ACTIFS.map((step, i) => {
                  const isCurrent = prospect.statutKanban === step;
                  const isPast = currentIdx > i;
                  return (
                    <button
                      key={step}
                      type="button"
                      disabled={isCurrent || !peutTraiter}
                      onClick={() => handleStatutChange(step)}
                      className={`flex w-full items-center gap-3 rounded-lg px-1.5 py-1 -mx-1.5 text-left transition-colors ${
                        isCurrent || !peutTraiter
                          ? "cursor-default"
                          : "cursor-pointer hover:bg-slate-50"
                      }`}
                    >
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
                    </button>
                  );
                })}
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
                {peutTraiter ? (
                  <button
                    onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {showAssignDropdown ? "[Fermer]" : "[Changer]"}
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    Assigné à un autre collaborateur
                  </span>
                )}
              </div>

              {showAssignDropdown && peutTraiter && (
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

        {/* ── Pièces et bénéficiaires (transférés au client à la conversion) ── */}
        {!hasClient && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DocumentsPanel
              cible="prospect"
              cibleId={prospect.id}
              lectureSeule={!peutTraiter}
            />
            {prospect.typeEntite === "PERSONNE_MORALE" && (
              <BeneficiairesPanel
                cible="prospect"
                cibleId={prospect.id}
                lectureSeule={!peutTraiter}
                onChange={load}
              />
            )}
          </div>
        )}

        {refusOpen && (
          <form
            onSubmit={handleRefuse}
            className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"
          >
            <label
              htmlFor="motif-refus"
              className="block text-sm font-semibold text-amber-900"
            >
              Motif du refus *
            </label>
            <textarea
              id="motif-refus"
              value={motifRefus}
              onChange={(e) => setMotifRefus(e.target.value)}
              required
              rows={3}
              placeholder="Conservé dans le dossier (obligation LCB-FT)"
              className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRefusOpen(false)}
                className="rounded-xl"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={refusing || !motifRefus.trim()}
                className="rounded-xl bg-amber-600 text-white hover:bg-amber-700"
              >
                {refusing ? "Refus…" : "Confirmer le refus"}
              </Button>
            </div>
          </form>
        )}

        {/* ── Actions bas ── */}
        {!isArchived && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 flex-wrap gap-3">
            <div className="flex items-center gap-4">
              {peutSupprimer && (
                <button
                  onClick={handleDelete}
                  className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
                >
                  Supprimer
                </button>
              )}
              {peutSupprimer && peutRefuser && (
                <span className="text-slate-300">|</span>
              )}
              {peutRefuser && (
                <button
                  onClick={() => setRefusOpen(true)}
                  className="text-sm font-medium text-amber-600 hover:text-amber-800 transition-colors"
                >
                  Refuser le prospect
                </button>
              )}
              {!peutSupprimer && !peutRefuser && (
                <p className="text-xs text-slate-400 italic">
                  Aucune action disponible pour ce prospect.
                </p>
              )}
            </div>
            {can.convertirProspect && (
              <div className="flex flex-col items-end gap-1">
                <Button
                  onClick={handleConvert}
                  disabled={
                    converting ||
                    !conditionsConversion ||
                    conditionsConversion.length > 0
                  }
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {converting ? "Conversion…" : "Convertir en client →"}
                </Button>
                {conditionsConversion && conditionsConversion.length > 0 && (
                  <ul className="text-right text-xs text-slate-500">
                    {conditionsConversion.map((c) => (
                      <li key={c}>• {c}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {prospect.client && (
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

      {previewLettre &&
        (() => {
          const previewLettreObj = missions
            .flatMap((m) => m.lettresMission ?? [])
            .find((l) => l.id === previewLettre.id);
          const peutTelechargerPreview =
            (role === "EXPERT_COMPTABLE" || role === "ADMIN") &&
            previewLettreObj?.docusignStatut === "SIGNE";

          return (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-0 sm:p-4">
              <button
                type="button"
                aria-label="Fermer"
                onClick={closePreviewLettre}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              />

              <div className="relative flex h-full w-full flex-col overflow-hidden border border-white/20 bg-white shadow-2xl sm:h-[92vh] sm:max-w-4xl sm:rounded-3xl">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
                  <h2 className="font-semibold text-slate-900">
                    Aperçu de la lettre de mission
                  </h2>

                  <div className="flex items-center gap-2">
                    {peutTelechargerPreview && (
                      <button
                        type="button"
                        onClick={() => handleDownloadLettre(previewLettre.id)}
                        className="rounded-xl bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700"
                      >
                        Télécharger
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={closePreviewLettre}
                      className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
                    >
                      <IconX className="size-5" />
                    </button>
                  </div>
                </div>

                <iframe
                  src={previewLettre.url}
                  title="Aperçu de la lettre de mission"
                  className="flex-1 bg-slate-100"
                />
              </div>
            </div>
          );
        })()}
    </div>
  );
}
