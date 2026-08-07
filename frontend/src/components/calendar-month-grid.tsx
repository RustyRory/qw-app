"use client";

import type { EcheanceCalendrier, SourceEcheance } from "@/types";

const WEEKDAY_LABELS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

export const SOURCE_DOT_CLASSES: Record<SourceEcheance, string> = {
  OBLIGATION: "bg-amber-500",
  PLANNING: "bg-teal-500",
  MISSION: "bg-violet-500",
};

export const SOURCE_LABELS: Record<SourceEcheance, string> = {
  OBLIGATION: "Obligation",
  PLANNING: "Planning",
  MISSION: "Mission",
};

function toDayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Lundi = 0 ... Dimanche = 6
function mondayIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

export function monthKeyOf(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function dayKeyFromIso(iso: string) {
  return iso.slice(0, 10);
}

// Une échéance est toujours rattachée à un client OU un prospect (jamais les
// deux, jamais aucun) — ces deux helpers évitent de répéter la même
// ternaire dans chaque page qui affiche une EcheanceCalendrier.
export function echeanceHref(item: EcheanceCalendrier, tab: string): string {
  if (item.client) return `/dashboard/clients/${item.client.id}?tab=${tab}`;
  if (item.prospect) return `/dashboard/prospects/${item.prospect.id}`;
  return "#";
}

export function echeanceEntiteLabel(item: EcheanceCalendrier): string {
  return item.client?.raisonSociale ?? item.prospect?.nom ?? "—";
}

export function CalendarMonthGrid({
  month,
  itemsByDay,
  selectedDay,
  onSelectDay,
  todayKey,
}: {
  month: Date;
  itemsByDay: Map<string, EcheanceCalendrier[]>;
  selectedDay: string | null;
  onSelectDay: (day: string) => void;
  todayKey: string;
}) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const first = new Date(year, monthIndex, 1);
  const nbJours = new Date(year, monthIndex + 1, 0).getDate();
  const decalage = mondayIndex(first);

  const cells: { day: number | null; key: string | null }[] = [];
  for (let i = 0; i < decalage; i += 1) cells.push({ day: null, key: null });
  for (let day = 1; day <= nbJours; day += 1) {
    cells.push({ day, key: toDayKey(new Date(year, monthIndex, day)) });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, key: null });

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="px-2 py-2 text-center text-xs font-semibold uppercase text-slate-400"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((cell, index) => {
          if (cell.day === null || cell.key === null) {
            return (
              <div
                key={`empty-${index}`}
                className="h-24 border-b border-r border-slate-100 bg-slate-50/50 sm:h-28"
              />
            );
          }

          const items = itemsByDay.get(cell.key) ?? [];
          const isToday = cell.key === todayKey;
          const isSelected = cell.key === selectedDay;

          return (
            <button
              type="button"
              key={cell.key}
              onClick={() => onSelectDay(cell.key!)}
              className={`flex h-24 flex-col items-stretch gap-1 border-b border-r border-slate-100 p-1.5 text-left transition sm:h-28 sm:p-2 ${
                isSelected ? "bg-violet-50" : "hover:bg-slate-50"
              }`}
            >
              <span
                className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                  isToday ? "bg-violet-600 text-white" : "text-slate-500"
                }`}
              >
                {cell.day}
              </span>

              <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                {items.slice(0, 3).map((item) => (
                  <span
                    key={item.id}
                    className="flex items-center gap-1 truncate rounded bg-slate-100 px-1 py-0.5 text-[10px] text-slate-600"
                  >
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${SOURCE_DOT_CLASSES[item.source]}`}
                    />
                    <span className="truncate">{item.titre}</span>
                  </span>
                ))}
                {items.length > 3 && (
                  <span className="text-[10px] font-semibold text-slate-400">
                    +{items.length - 3} autre{items.length - 3 > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
