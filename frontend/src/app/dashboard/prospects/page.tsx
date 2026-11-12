"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconPlus,
  IconLayoutKanban,
  IconTable,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
} from "@tabler/icons-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { apiFetch } from "@/lib/apiFetch";
import { Button } from "@/components/ui/button";
import type { Prospect, StatutKanban } from "@/types";

const COLUMNS: {
  id: StatutKanban;
  label: string;
  dot: string;
  border: string;
  countBg: string;
}[] = [
  {
    id: "PRISE_CONTACT",
    label: "Prise de contact",
    dot: "bg-slate-400",
    border: "border-t-slate-400",
    countBg: "bg-slate-100 text-slate-600",
  },
  {
    id: "PREPARATION_LAB",
    label: "Préparation LAB",
    dot: "bg-blue-500",
    border: "border-t-blue-500",
    countBg: "bg-blue-100 text-blue-700",
  },
  {
    id: "VALIDATION_LAB",
    label: "Validation LAB",
    dot: "bg-amber-500",
    border: "border-t-amber-500",
    countBg: "bg-amber-100 text-amber-700",
  },
  {
    id: "REFUSE",
    label: "Prospects refusés",
    dot: "bg-red-500",
    border: "border-t-red-500",
    countBg: "bg-red-100 text-red-700",
  },
  {
    id: "LM_A_FAIRE",
    label: "Prospects LM à faire",
    dot: "bg-violet-500",
    border: "border-t-violet-500",
    countBg: "bg-violet-100 text-violet-700",
  },
  {
    id: "LM_ENVOYEE",
    label: "Prospects LM envoyées",
    dot: "bg-indigo-500",
    border: "border-t-indigo-500",
    countBg: "bg-indigo-100 text-indigo-700",
  },
  // Pas de colonne CONVERTI : un prospect converti n'est plus renvoyé par
  // GET /prospects (voir ProspectsService.findAll) et devient uniquement
  // accessible depuis la fiche du client généré.
];

const STATUT_BADGES: Record<StatutKanban, { label: string; cls: string }> = {
  PRISE_CONTACT: {
    label: "Prise de contact",
    cls: "bg-slate-100 text-slate-600",
  },
  PREPARATION_LAB: {
    label: "Préparation LAB",
    cls: "bg-blue-100 text-blue-700",
  },
  VALIDATION_LAB: {
    label: "Validation LAB",
    cls: "bg-amber-100 text-amber-700",
  },
  LM_A_FAIRE: {
    label: "Prospects LM à faire",
    cls: "bg-violet-100 text-violet-700",
  },
  LM_ENVOYEE: {
    label: "Prospects LM envoyées",
    cls: "bg-indigo-100 text-indigo-700",
  },
  CONVERTI: {
    label: "Clients LM validées",
    cls: "bg-emerald-100 text-emerald-700",
  },
  REFUSE: { label: "Prospects refusés", cls: "bg-red-100 text-red-700" },
};

type SortKey =
  | "nom"
  | "statutKanban"
  | "ville"
  | "chiffreAffaires"
  | "createdAt";

function formatCurrency(value?: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

// « Converti » n'est pas proposé : seul le bouton « Convertir en client »
// de la fiche le pose. Choisir « Refusé » demande un motif.
const STATUT_OPTIONS = COLUMNS;

function ProspectsTable({
  prospects,
  onStatutChange,
}: {
  prospects: Prospect[];
  onStatutChange: (id: string, statut: StatutKanban) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = [...prospects].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "chiffreAffaires":
        cmp = (a.chiffreAffaires ?? -1) - (b.chiffreAffaires ?? -1);
        break;
      case "createdAt":
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case "ville":
        cmp = (a.ville ?? "").localeCompare(b.ville ?? "");
        break;
      case "statutKanban":
        cmp = STATUT_BADGES[a.statutKanban].label.localeCompare(
          STATUT_BADGES[b.statutKanban].label,
        );
        break;
      default:
        cmp = a.nom.localeCompare(b.nom);
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const columns: { key: SortKey; label: string; align?: "right" }[] = [
    { key: "nom", label: "Nom" },
    { key: "statutKanban", label: "Statut" },
    { key: "ville", label: "Ville" },
    { key: "chiffreAffaires", label: "Chiffre d'affaires", align: "right" },
    { key: "createdAt", label: "Créé le" },
  ];

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            {columns.map((col) => {
              const active = sortKey === col.key;
              return (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 ${
                    col.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className={`inline-flex items-center gap-1 hover:text-slate-900 ${
                      col.align === "right" ? "flex-row-reverse" : ""
                    } ${active ? "text-indigo-700" : ""}`}
                  >
                    {col.label}
                    {active ? (
                      sortDir === "asc" ? (
                        <IconChevronUp className="size-3.5" />
                      ) : (
                        <IconChevronDown className="size-3.5" />
                      )
                    ) : (
                      <IconSelector className="size-3.5 text-slate-300" />
                    )}
                  </button>
                </th>
              );
            })}
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-10 text-center text-sm text-slate-400 italic"
              >
                Aucun prospect
              </td>
            </tr>
          ) : (
            sorted.map((p) => {
              const badge = STATUT_BADGES[p.statutKanban];
              return (
                <tr
                  key={p.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{p.nom}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {p.ref}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={p.statutKanban}
                      onChange={(e) =>
                        onStatutChange(p.id, e.target.value as StatutKanban)
                      }
                      onClick={(e) => e.stopPropagation()}
                      className={`rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold outline-none focus:ring-2 focus:ring-indigo-200 ${badge.cls}`}
                    >
                      {STATUT_OPTIONS.map((col) => (
                        <option key={col.id} value={col.id}>
                          {STATUT_BADGES[col.id].label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.ville || "—"}</td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    {formatCurrency(p.chiffreAffaires)}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDate(p.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/prospects/${p.id}`}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 rounded-full px-2 py-0.5"
                    >
                      + info
                    </Link>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `il y a ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

function ProspectCard({
  prospect,
  overlay = false,
}: {
  prospect: Prospect;
  overlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: prospect.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };
  const initiales = prospect.nom.slice(0, 2).toUpperCase();

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : style}
      {...(overlay ? {} : { ...attributes, ...listeners })}
      className={`bg-white rounded-xl border border-slate-200 p-3 select-none
        ${
          overlay
            ? "shadow-2xl rotate-2 scale-105 cursor-grabbing"
            : "cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-200 transition-all"
        }`}
    >
      <div className="flex items-start gap-2 mb-2">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
        >
          {initiales}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800 leading-tight truncate">
            {prospect.nom}
          </p>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
            {prospect.ref}
          </p>
        </div>
      </div>
      {prospect.activite && (
        <p className="text-[11px] text-slate-500 truncate mb-2">
          {prospect.activite}
        </p>
      )}
      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
        <span className="text-[10px] text-slate-400">
          {timeAgo(prospect.createdAt)}
        </span>
        <Link
          href={`/dashboard/prospects/${prospect.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 rounded-full px-2 py-0.5"
        >
          + info
        </Link>
      </div>
    </div>
  );
}

function KanbanColumn({
  column,
  prospects,
}: {
  column: (typeof COLUMNS)[number];
  prospects: Prospect[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-2xl border-t-4 ${column.border} bg-slate-50
        min-w-[220px] w-[220px] md:min-w-0 md:w-auto md:flex-1
        ${isOver ? "ring-2 ring-indigo-300" : ""}`}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className={`size-2 rounded-full ${column.dot}`} />
        <span
          title={column.label}
          className="text-sm font-semibold text-slate-700 truncate"
        >
          {column.label}
        </span>
        <span
          className={`ml-auto flex size-5 items-center justify-center rounded-full text-xs font-bold ${column.countBg}`}
        >
          {prospects.length}
        </span>
      </div>
      <SortableContext
        items={prospects.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2 p-2 flex-1 min-h-[120px]">
          {prospects.length === 0 ? (
            <div className="flex-1 flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200">
              <p className="text-xs text-slate-300 italic">Vide</p>
            </div>
          ) : (
            prospects.map((p) => <ProspectCard key={p.id} prospect={p} />)
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function ProspectsPage() {
  const router = useRouter();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeProspect, setActiveProspect] = useState<Prospect | null>(null);
  const [view, setView] = useState<"kanban" | "tableau">("kanban");

  const load = useCallback(() => {
    setLoading(true);
    apiFetch<Prospect[]>("/prospects")
      .then(setProspects)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      load();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [load]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveProspect(prospects.find((p) => p.id === event.active.id) ?? null);
  }

  async function changeStatut(prospectId: string, targetCol: StatutKanban) {
    const prospect = prospects.find((p) => p.id === prospectId);
    if (!prospect || prospect.statutKanban === targetCol) return;
    const prevStatut = prospect.statutKanban;

    // Refus : décision motivée (motif obligatoire, conservé LCB-FT).
    let motif: string | null = null;
    if (targetCol === "REFUSE") {
      motif = window.prompt(`Motif du refus de « ${prospect.nom} » :`);
      if (!motif?.trim()) return;
    }
    setProspects((prev) =>
      prev.map((p) =>
        p.id === prospectId ? { ...p, statutKanban: targetCol } : p,
      ),
    );
    try {
      if (motif) {
        await apiFetch(`/prospects/${prospectId}/refuser`, {
          method: "PATCH",
          body: JSON.stringify({ motif: motif.trim() }),
        });
      } else {
        await apiFetch(`/prospects/${prospectId}`, {
          method: "PATCH",
          body: JSON.stringify({ statutKanban: targetCol }),
        });
      }
    } catch (err) {
      setProspects((prev) =>
        prev.map((p) =>
          p.id === prospectId ? { ...p, statutKanban: prevStatut } : p,
        ),
      );
      window.alert(
        err instanceof Error ? err.message : "Changement de statut impossible.",
      );
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveProspect(null);
    if (!over || active.id === over.id) return;
    const targetCol = COLUMNS.some((col) => col.id === over.id)
      ? (over.id as StatutKanban)
      : prospects.find((p) => p.id === over.id)?.statutKanban;
    if (!targetCol) return;
    changeStatut(active.id as string, targetCol);
  }

  const activeProspects = prospects.filter(
    (p) => !p.client && p.statutKanban !== "REFUSE",
  );

  return (
    <div className="min-h-full bg-slate-50 flex flex-col">
      {/* Hero header */}
      <div
        className="px-5 pt-6 pb-8 md:px-8"
        style={{
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
        }}
      >
        <p className="text-indigo-200 text-xs font-medium uppercase tracking-widest mb-1">
          Pipeline
        </p>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">Prospects</h1>
            <p className="text-indigo-100 text-sm mt-0.5">
              {loading
                ? "—"
                : `${activeProspects.length} prospect${activeProspects.length !== 1 ? "s" : ""} actif${activeProspects.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => router.push("/dashboard/prospects/archives")}
              className="bg-white/15 text-white hover:bg-white/25 font-semibold border-0 rounded-xl"
              size="sm"
            >
              Archivés
            </Button>
            <Button
              onClick={() => router.push("/dashboard/prospects/new")}
              className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold shadow-sm border-0 rounded-xl"
              size="sm"
            >
              <IconPlus className="size-4" />
              <span className="hidden sm:inline">Nouveau prospect</span>
              <span className="sm:hidden">Nouveau</span>
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Onglets d'affichage */}
      <div className="-mt-4 px-4 md:px-6">
        <div className="inline-flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setView("kanban")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              view === "kanban"
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <IconLayoutKanban className="size-4" />
            Kanban
          </button>
          <button
            type="button"
            onClick={() => setView("tableau")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              view === "tableau"
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <IconTable className="size-4" />
            Tableau
          </button>
        </div>
      </div>

      {/* Board Kanban — scroll horizontal mobile, grille desktop */}
      <div className="mt-4 px-4 pb-4 md:px-6 flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="size-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : view === "tableau" ? (
          <ProspectsTable prospects={prospects} onStatutChange={changeStatut} />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div
              className="flex gap-3 overflow-x-auto pb-4 md:pb-0 md:grid md:gap-3"
              style={{
                gridTemplateColumns: `repeat(${COLUMNS.length}, minmax(0, 1fr))`,
              }}
            >
              {COLUMNS.map((col) => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  prospects={prospects.filter((p) => p.statutKanban === col.id)}
                />
              ))}
            </div>
            <DragOverlay>
              {activeProspect && (
                <div className="w-56">
                  <ProspectCard prospect={activeProspect} overlay />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
}
