"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconPlus } from "@tabler/icons-react";
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor,
  useSensor, useSensors, closestCorners,
  type DragStartEvent, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { apiFetch } from "@/lib/apiFetch";
import { Button } from "@/components/ui/button";
import type { Prospect, StatutKanban } from "@/types";

const COLUMNS: { id: StatutKanban; label: string; dot: string; border: string; countBg: string }[] = [
  { id: "PRISE_CONTACT", label: "Prise de contact",  dot: "bg-slate-400",   border: "border-t-slate-400",   countBg: "bg-slate-100 text-slate-600" },
  { id: "DECOUVERTE",    label: "Découverte",         dot: "bg-blue-500",    border: "border-t-blue-500",    countBg: "bg-blue-100 text-blue-700" },
  { id: "OPPORTUNITE",   label: "Opportunité",        dot: "bg-indigo-500",  border: "border-t-indigo-500",  countBg: "bg-indigo-100 text-indigo-700" },
  { id: "LAB",           label: "LAB à effectuer",    dot: "bg-amber-500",   border: "border-t-amber-500",   countBg: "bg-amber-100 text-amber-700" },
  { id: "PREPARATION",   label: "Préparation client", dot: "bg-violet-500",  border: "border-t-violet-500",  countBg: "bg-violet-100 text-violet-700" },
];

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `il y a ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

function ProspectCard({ prospect, overlay = false }: { prospect: Prospect; overlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: prospect.id });

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };
  const initiales = prospect.nom.slice(0, 2).toUpperCase();

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : style}
      {...(overlay ? {} : { ...attributes, ...listeners })}
      className={`bg-white rounded-xl border border-slate-200 p-3 select-none
        ${overlay
          ? "shadow-2xl rotate-2 scale-105 cursor-grabbing"
          : "cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-200 transition-all"}`}
    >
      <div className="flex items-start gap-2 mb-2">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
        >
          {initiales}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800 leading-tight truncate">{prospect.nom}</p>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{prospect.ref}</p>
        </div>
      </div>
      {prospect.activite && (
        <p className="text-[11px] text-slate-500 truncate mb-2">{prospect.activite}</p>
      )}
      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
        <span className="text-[10px] text-slate-400">{timeAgo(prospect.createdAt)}</span>
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

function KanbanColumn({ column, prospects }: { column: typeof COLUMNS[number]; prospects: Prospect[] }) {
  return (
    <div className={`flex flex-col rounded-2xl border-t-4 ${column.border} bg-slate-50
      min-w-[220px] w-[220px] md:min-w-0 md:w-auto md:flex-1`}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className={`size-2 rounded-full ${column.dot}`} />
        <span className="text-sm font-semibold text-slate-700 truncate">{column.label}</span>
        <span className={`ml-auto flex size-5 items-center justify-center rounded-full text-xs font-bold ${column.countBg}`}>
          {prospects.length}
        </span>
      </div>
      <SortableContext items={prospects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
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
  const [showArchived, setShowArchived] = useState(false);

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
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveProspect(prospects.find((p) => p.id === event.active.id) ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveProspect(null);
    if (!over || active.id === over.id) return;
    const targetCol = COLUMNS.find((col) =>
      prospects.filter((p) => p.statutKanban === col.id).some((p) => p.id === over.id)
    )?.id;
    if (!targetCol) return;
    const prospect = prospects.find((p) => p.id === active.id);
    if (!prospect || prospect.statutKanban === targetCol) return;
    setProspects((prev) => prev.map((p) => p.id === active.id ? { ...p, statutKanban: targetCol } : p));
    try {
      await apiFetch(`/prospects/${active.id}`, {
        method: "PATCH",
        body: JSON.stringify({ statutKanban: targetCol }),
      });
    } catch {
      setProspects((prev) => prev.map((p) => p.id === active.id ? { ...p, statutKanban: prospect.statutKanban } : p));
    }
  }

  const activeProspects = prospects.filter((p) => p.statutKanban !== "CONVERTI" && p.statutKanban !== "REFUSE");
  const archived = prospects.filter((p) => p.statutKanban === "CONVERTI" || p.statutKanban === "REFUSE");

  return (
    <div className="min-h-full bg-slate-50 flex flex-col">

      {/* Hero header */}
      <div
        className="px-5 pt-6 pb-8 md:px-8"
        style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
      >
        <p className="text-indigo-200 text-xs font-medium uppercase tracking-widest mb-1">Pipeline</p>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">Prospects</h1>
            <p className="text-indigo-100 text-sm mt-0.5">
              {loading ? "—" : `${activeProspects.length} prospect${activeProspects.length !== 1 ? "s" : ""} actif${activeProspects.length !== 1 ? "s" : ""}`}
            </p>
          </div>
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

      {error && (
        <div className="mx-4 mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Board Kanban — scroll horizontal mobile, grille desktop */}
      <div className="-mt-4 px-4 pb-4 md:px-6 flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="size-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div
              className="flex gap-3 overflow-x-auto pb-4 md:pb-0 md:grid md:gap-3"
              style={{ gridTemplateColumns: `repeat(${COLUMNS.length}, minmax(0, 1fr))` }}
            >
              {COLUMNS.map((col) => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  prospects={activeProspects.filter((p) => p.statutKanban === col.id)}
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

        {/* Archivés */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            {showArchived ? "Masquer archivés" : `Voir archivés (${archived.length})`}
          </button>
        </div>

        {showArchived && archived.length > 0 && (
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              { id: "CONVERTI", label: "Converti ✓", cls: "border-emerald-200 bg-emerald-50" },
              { id: "REFUSE",   label: "Refusé ✗",   cls: "border-red-200 bg-red-50" },
            ].map((col) => {
              const items = archived.filter((p) => p.statutKanban === col.id);
              return (
                <div key={col.id} className={`rounded-2xl border p-4 ${col.cls}`}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-3 text-slate-500">
                    {col.label} ({items.length})
                  </p>
                  {items.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Aucun</p>
                  ) : (
                    <div className="space-y-2">
                      {items.map((p) => (
                        <Link key={p.id} href={`/dashboard/prospects/${p.id}`}
                          className="flex items-center justify-between py-1.5 hover:opacity-70 transition-opacity">
                          <span className="text-sm font-medium text-slate-700">{p.nom}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{p.ref}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
