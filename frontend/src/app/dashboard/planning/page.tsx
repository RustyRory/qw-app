"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  IconCalendarEvent,
  IconChevronLeft,
  IconChevronRight,
  IconSearch,
} from "@tabler/icons-react";

import { apiFetch } from "@/lib/apiFetch";
import { StatusBadge } from "@/lib/status";
import {
  CalendarMonthGrid,
  SOURCE_DOT_CLASSES,
  SOURCE_LABELS,
  dayKeyFromIso,
  echeanceEntiteLabel,
  echeanceHref,
  monthKeyOf,
} from "@/components/calendar-month-grid";

import type { EcheanceCalendrier, SourceEcheance } from "@/types";

const TAB_BY_SOURCE: Record<SourceEcheance, string> = {
  OBLIGATION: "obligations",
  PLANNING: "planning",
  MISSION: "missions",
};

function formatDate(date?: string | null) {
  if (!date) return "—";

  return new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString("fr-FR");
}

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getMonthLabel(month: Date) {
  return month
    .toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    .toUpperCase();
}

export default function PlanningGlobalPage() {
  const [items, setItems] = useState<EcheanceCalendrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(todayKey());

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setLoading(true);
      setError(null);

      apiFetch<EcheanceCalendrier[]>("/planning/calendrier")
        .then(setItems)
        .catch((err: Error) => {
          setError(err.message);
          setItems([]);
        })
        .finally(() => setLoading(false));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const filteredItems = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return items;

    return items.filter((item) => {
      const ref = item.client?.ref ?? item.prospect?.ref ?? "";
      return (
        item.titre.toLowerCase().includes(value) ||
        echeanceEntiteLabel(item).toLowerCase().includes(value) ||
        ref.toLowerCase().includes(value) ||
        SOURCE_LABELS[item.source].toLowerCase().includes(value)
      );
    });
  }, [items, search]);

  const itemsByDay = useMemo(() => {
    const map = new Map<string, EcheanceCalendrier[]>();
    for (const item of filteredItems) {
      if (!item.dateEcheance) continue;
      const key = dayKeyFromIso(item.dateEcheance);
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.titre.localeCompare(b.titre));
    }
    return map;
  }, [filteredItems]);

  const itemsSansDate = useMemo(
    () => filteredItems.filter((item) => !item.dateEcheance),
    [filteredItems],
  );

  const monthEntries = useMemo(() => {
    const groups = new Map<string, EcheanceCalendrier[]>();
    for (const item of filteredItems) {
      if (!item.dateEcheance) continue;
      const key = monthKeyOf(
        new Date(`${item.dateEcheance.slice(0, 10)}T00:00:00`),
      );
      const list = groups.get(key) ?? [];
      list.push(item);
      groups.set(key, list);
    }
    for (const list of groups.values()) {
      list.sort(
        (a, b) =>
          new Date(a.dateEcheance!).getTime() -
          new Date(b.dateEcheance!).getTime(),
      );
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filteredItems]);

  const selectedDayItems = selectedDay
    ? (itemsByDay.get(selectedDay) ?? [])
    : [];

  const obligationsCount = items.filter(
    (item) => item.source === "OBLIGATION",
  ).length;
  const missionsCount = items.filter(
    (item) => item.source === "MISSION",
  ).length;
  const planningCount = items.filter(
    (item) => item.source === "PLANNING",
  ).length;

  return (
    <div className="min-h-full bg-slate-50 p-4 pb-20 sm:p-6 md:p-8 md:pb-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-700 to-cyan-600 px-5 py-6 shadow-lg sm:px-7 sm:py-8">
          <div className="pointer-events-none absolute -right-14 -top-16 size-56 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 size-56 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white">
                <IconCalendarEvent className="size-6" />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-100">
                  Organisation
                </p>

                <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                  Calendrier du cabinet
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50">
                  Toutes les échéances du cabinet en un seul endroit :
                  obligations réglementaires, étapes de planning et fins de
                  mission.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-4 gap-2 border-t border-white/15 pt-5 sm:gap-4">
              <div className="rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm sm:p-4">
                <p className="text-[10px] font-bold uppercase text-emerald-100 sm:text-xs">
                  Total actif
                </p>
                <p className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                  {loading ? "—" : items.length}
                </p>
              </div>

              <div className="rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm sm:p-4">
                <p className="text-[10px] font-bold uppercase text-emerald-100 sm:text-xs">
                  Obligations
                </p>
                <p className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                  {loading ? "—" : obligationsCount}
                </p>
              </div>

              <div className="rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm sm:p-4">
                <p className="text-[10px] font-bold uppercase text-emerald-100 sm:text-xs">
                  Missions
                </p>
                <p className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                  {loading ? "—" : missionsCount}
                </p>
              </div>

              <div className="rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm sm:p-4">
                <p className="text-[10px] font-bold uppercase text-emerald-100 sm:text-xs">
                  Planning
                </p>
                <p className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                  {loading ? "—" : planningCount}
                </p>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Recherche */}
        <div className="relative rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <IconSearch className="pointer-events-none absolute left-7 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher une échéance, un client…"
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          />
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400 shadow-sm">
            Chargement du calendrier…
          </div>
        ) : (
          <>
            {/* Vue calendrier (desktop) */}
            <div className="hidden gap-4 md:grid md:grid-cols-3">
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <button
                    type="button"
                    onClick={() =>
                      setMonth(
                        (m) => new Date(m.getFullYear(), m.getMonth() - 1, 1),
                      )
                    }
                    className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                  >
                    <IconChevronLeft className="size-4" />
                  </button>

                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                      {getMonthLabel(month)}
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        setMonth(
                          new Date(now.getFullYear(), now.getMonth(), 1),
                        );
                        setSelectedDay(todayKey());
                      }}
                      className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      Aujourd’hui
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setMonth(
                        (m) => new Date(m.getFullYear(), m.getMonth() + 1, 1),
                      )
                    }
                    className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                  >
                    <IconChevronRight className="size-4" />
                  </button>
                </div>

                <CalendarMonthGrid
                  month={month}
                  itemsByDay={itemsByDay}
                  selectedDay={selectedDay}
                  onSelectDay={setSelectedDay}
                  todayKey={todayKey()}
                />

                <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 shadow-sm">
                  {(Object.keys(SOURCE_LABELS) as SourceEcheance[]).map(
                    (source) => (
                      <span key={source} className="flex items-center gap-1.5">
                        <span
                          className={`size-2.5 rounded-full ${SOURCE_DOT_CLASSES[source]}`}
                        />
                        {SOURCE_LABELS[source]}
                      </span>
                    ),
                  )}
                </div>
              </div>

              {/* Panneau du jour sélectionné */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">
                  {selectedDay
                    ? new Date(`${selectedDay}T00:00:00`).toLocaleDateString(
                        "fr-FR",
                        { weekday: "long", day: "numeric", month: "long" },
                      )
                    : "Sélectionnez un jour"}
                </h3>

                {selectedDay && selectedDayItems.length === 0 && (
                  <p className="mt-4 text-sm text-slate-400">
                    Aucune échéance ce jour-là.
                  </p>
                )}

                <div className="mt-4 space-y-3">
                  {selectedDayItems.map((item) => (
                    <Link
                      key={item.id}
                      href={echeanceHref(item, TAB_BY_SOURCE[item.source])}
                      className="block rounded-xl border border-slate-100 p-3 transition hover:border-emerald-200 hover:bg-emerald-50/30"
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`size-2 rounded-full ${SOURCE_DOT_CLASSES[item.source]}`}
                        />
                        <span className="text-[10px] font-semibold uppercase text-slate-400">
                          {SOURCE_LABELS[item.source]}
                        </span>
                      </div>
                      <p className="mt-1 font-semibold text-slate-900">
                        {item.titre}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {echeanceEntiteLabel(item)}
                      </p>
                      <div className="mt-2">
                        <StatusBadge status={item.statut} />
                      </div>
                    </Link>
                  ))}
                </div>

                {itemsSansDate.length > 0 && (
                  <div className="mt-6 border-t border-slate-100 pt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Sans date d’échéance ({itemsSansDate.length})
                    </h4>
                    <div className="mt-3 space-y-2">
                      {itemsSansDate.slice(0, 5).map((item) => (
                        <Link
                          key={item.id}
                          href={echeanceHref(item, TAB_BY_SOURCE[item.source])}
                          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                        >
                          <span
                            className={`size-1.5 shrink-0 rounded-full ${SOURCE_DOT_CLASSES[item.source]}`}
                          />
                          <span className="truncate">{item.titre}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Vue liste (mobile) */}
            <div className="space-y-3 md:hidden">
              {monthEntries.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400 shadow-sm">
                  Aucune échéance planifiée
                </div>
              ) : (
                monthEntries.map(([monthKey, monthItems]) => (
                  <section key={monthKey} className="space-y-2">
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-100 px-4 py-3">
                      <IconCalendarEvent className="size-5 text-emerald-600" />
                      <h2 className="text-xs font-bold uppercase tracking-wide text-slate-600">
                        {new Date(`${monthKey}-01T00:00:00`).toLocaleDateString(
                          "fr-FR",
                          { month: "long", year: "numeric" },
                        )}
                      </h2>
                      <span className="ml-auto rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">
                        {monthItems.length}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      {monthItems.map((item) => (
                        <Link
                          key={item.id}
                          href={echeanceHref(item, TAB_BY_SOURCE[item.source])}
                          className="block p-4 transition hover:bg-emerald-50/30"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`size-2 rounded-full ${SOURCE_DOT_CLASSES[item.source]}`}
                                />
                                <span className="text-[10px] font-semibold uppercase text-slate-400">
                                  {SOURCE_LABELS[item.source]}
                                </span>
                              </div>
                              <p className="mt-1 font-semibold text-slate-900">
                                {item.titre}
                              </p>
                              <p className="mt-1 truncate text-sm text-emerald-700">
                                {echeanceEntiteLabel(item)}
                              </p>
                            </div>
                            <IconChevronRight className="size-5 shrink-0 text-slate-300" />
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <StatusBadge status={item.statut} />
                            <span className="text-xs text-slate-400">
                              Échéance : {formatDate(item.dateEcheance)}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
