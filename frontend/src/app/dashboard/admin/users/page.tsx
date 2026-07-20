"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  IconEdit,
  IconPlus,
  IconSearch,
  IconShield,
  IconShieldCheck,
  IconUserOff,
  IconUsers,
} from "@tabler/icons-react";

import { apiFetch } from "@/lib/apiFetch";
import { useAuth } from "@/hooks/useAuth";

import type { Role, User } from "@/types";

const ROLE_LABELS: Record<Role, string> = {
  COLLABORATEUR: "Collaborateur",
  RESPONSABLE: "Responsable",
  EXPERT_COMPTABLE: "Expert-comptable",
  ADMIN: "Administrateur",
};

const ROLE_CLASSES: Record<Role, string> = {
  COLLABORATEUR:
    "bg-blue-50 text-blue-700 ring-blue-200",
  RESPONSABLE:
    "bg-amber-50 text-amber-700 ring-amber-200",
  EXPERT_COMPTABLE:
    "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ADMIN:
    "bg-violet-50 text-violet-700 ring-violet-200",
};

const AVATAR_CLASSES: Record<Role, string> = {
  COLLABORATEUR:
    "from-blue-500 to-cyan-500",
  RESPONSABLE:
    "from-amber-500 to-orange-500",
  EXPERT_COMPTABLE:
    "from-emerald-500 to-teal-500",
  ADMIN:
    "from-violet-600 to-fuchsia-500",
};

export default function UsersPage() {
  const { ready } = useAuth(["ADMIN"]);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<
    "TOUS" | Role
  >("TOUS");

  const [statusFilter, setStatusFilter] = useState<
    "TOUS" | "ACTIF" | "INACTIF"
  >("TOUS");

  useEffect(() => {
    if (!ready) return;

    setLoading(true);
    setError(null);

    apiFetch<User[]>("/users")
      .then(setUsers)
      .catch((err: Error) => {
        setError(err.message);
        setUsers([]);
      })
      .finally(() => setLoading(false));
  }, [ready]);

  const filteredUsers = useMemo(() => {
    const value = search.trim().toLowerCase();

    return users
      .filter((user) => {
        if (roleFilter === "TOUS") return true;

        return user.role === roleFilter;
      })
      .filter((user) => {
        if (statusFilter === "TOUS") return true;

        if (statusFilter === "ACTIF") {
          return user.isActive;
        }

        return !user.isActive;
      })
      .filter((user) => {
        if (!value) return true;

        const fullName =
          `${user.prenom} ${user.nom}`.toLowerCase();

        return (
          fullName.includes(value) ||
          user.email.toLowerCase().includes(value) ||
          ROLE_LABELS[user.role]
            .toLowerCase()
            .includes(value)
        );
      })
      .sort((a, b) =>
        `${a.nom} ${a.prenom}`.localeCompare(
          `${b.nom} ${b.prenom}`,
          "fr",
        ),
      );
  }, [
    users,
    search,
    roleFilter,
    statusFilter,
  ]);

  const activeCount = users.filter(
    (user) => user.isActive,
  ).length;

  const inactiveCount =
    users.length - activeCount;

  const adminCount = users.filter(
    (user) => user.role === "ADMIN",
  ).length;

  const responsibleCount = users.filter(
    (user) => user.role === "RESPONSABLE",
  ).length;

  if (!ready) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-50">
        <div className="size-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 pb-24 sm:p-6 md:p-8 md:pb-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-800 via-indigo-700 to-fuchsia-600 px-5 py-6 text-white shadow-xl sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-pink-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-blue-300/20 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-inner backdrop-blur-sm">
                  <IconUsers className="size-6" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-200">
                    Administration
                  </p>

                  <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                    Utilisateurs
                  </h1>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-violet-100">
                    Gérez les comptes, les rôles et les accès
                    des membres du cabinet.
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/admin/users/new"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-violet-800 shadow-lg transition hover:-translate-y-0.5 hover:bg-violet-50 sm:w-auto"
              >
                <IconPlus className="size-5" />
                Nouvel utilisateur
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/15 pt-5 lg:grid-cols-4">
              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-violet-100 sm:text-xs">
                  Total
                </p>

                <p className="mt-1 text-2xl font-bold sm:text-3xl">
                  {loading ? "—" : users.length}
                </p>
              </div>

              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-violet-100 sm:text-xs">
                  Actifs
                </p>

                <p className="mt-1 text-2xl font-bold sm:text-3xl">
                  {loading ? "—" : activeCount}
                </p>
              </div>

              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-violet-100 sm:text-xs">
                  Responsables
                </p>

                <p className="mt-1 text-2xl font-bold sm:text-3xl">
                  {loading ? "—" : responsibleCount}
                </p>
              </div>

              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-violet-100 sm:text-xs">
                  Administrateurs
                </p>

                <p className="mt-1 text-2xl font-bold sm:text-3xl">
                  {loading ? "—" : adminCount}
                </p>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Statistiques */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Comptes actifs
                </p>

                <p className="mt-2 text-3xl font-bold text-emerald-800">
                  {loading ? "—" : activeCount}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Accès autorisé à l’application
                </p>
              </div>

              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-100">
                <IconShieldCheck className="size-6 text-emerald-700" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                  Comptes inactifs
                </p>

                <p className="mt-2 text-3xl font-bold text-red-800">
                  {loading ? "—" : inactiveCount}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Accès actuellement suspendu
                </p>
              </div>

              <div className="flex size-11 items-center justify-center rounded-xl bg-red-100">
                <IconUserOff className="size-6 text-red-700" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
                  Administrateurs
                </p>

                <p className="mt-2 text-3xl font-bold text-violet-800">
                  {loading ? "—" : adminCount}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Accès complet à la plateforme
                </p>
              </div>

              <div className="flex size-11 items-center justify-center rounded-xl bg-violet-100">
                <IconShield className="size-6 text-violet-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Recherche et filtres */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_200px]">
            <div className="relative">
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Rechercher par nom, e-mail ou rôle..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(
                  event.target.value as
                    | "TOUS"
                    | Role,
                )
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
            >
              <option value="TOUS">
                Tous les rôles
              </option>

              <option value="COLLABORATEUR">
                Collaborateurs
              </option>

              <option value="RESPONSABLE">
                Responsables
              </option>

              <option value="EXPERT_COMPTABLE">
                Experts-comptables
              </option>

              <option value="ADMIN">
                Administrateurs
              </option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | "TOUS"
                    | "ACTIF"
                    | "INACTIF",
                )
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
            >
              <option value="TOUS">
                Tous les statuts
              </option>

              <option value="ACTIF">
                Comptes actifs
              </option>

              <option value="INACTIF">
                Comptes inactifs
              </option>
            </select>
          </div>
        </div>

        {/* Liste */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center gap-3 border-b border-slate-200 bg-gradient-to-r from-violet-50 via-indigo-50 to-blue-50 px-5 py-5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-violet-100">
              <IconUsers className="size-5 text-violet-700" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Comptes du cabinet
              </h2>

              <p className="text-xs text-slate-500">
                {loading
                  ? "Chargement..."
                  : `${filteredUsers.length} utilisateur${
                      filteredUsers.length > 1
                        ? "s"
                        : ""
                    } affiché${
                      filteredUsers.length > 1
                        ? "s"
                        : ""
                    }`}
              </p>
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-4 text-left font-semibold text-slate-500">
                    Utilisateur
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-slate-500">
                    E-mail
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-slate-500">
                    Rôle
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-slate-500">
                    Statut
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-slate-500">
                    Création
                  </th>

                  <th className="w-20 px-5 py-4" />
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-slate-400"
                    >
                      Chargement des utilisateurs…
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-slate-400"
                    >
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="transition hover:bg-violet-50/30"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-bold uppercase text-white shadow-sm ${AVATAR_CLASSES[user.role]}`}
                          >
                            {user.prenom?.[0]}
                            {user.nom?.[0]}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {user.prenom} {user.nom}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              Membre du cabinet
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {user.email}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${ROLE_CLASSES[user.role]}`}
                        >
                          {ROLE_LABELS[user.role]}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                            user.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              user.isActive
                                ? "bg-emerald-500"
                                : "bg-red-500"
                            }`}
                          />

                          {user.isActive
                            ? "Actif"
                            : "Inactif"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {new Date(
                          user.createdAt,
                        ).toLocaleDateString("fr-FR")}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/dashboard/admin/users/${user.id}`}
                          title="Modifier l’utilisateur"
                          className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                        >
                          <IconEdit className="size-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="grid gap-4 bg-slate-50 p-4 md:hidden">
            {loading ? (
              <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-400">
                Chargement des utilisateurs…
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-400">
                Aucun utilisateur trouvé
              </div>
            ) : (
              filteredUsers.map((user) => (
                <article
                  key={user.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="h-1.5 bg-gradient-to-r from-violet-600 via-indigo-500 to-fuchsia-500" />

                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold uppercase text-white shadow-sm ${AVATAR_CLASSES[user.role]}`}
                      >
                        {user.prenom?.[0]}
                        {user.nom?.[0]}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {user.prenom} {user.nom}
                            </p>

                            <p className="mt-1 break-all text-sm text-slate-500">
                              {user.email}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                              user.isActive
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {user.isActive
                              ? "Actif"
                              : "Inactif"}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${ROLE_CLASSES[user.role]}`}
                          >
                            {ROLE_LABELS[user.role]}
                          </span>
                        </div>

                        <div className="mt-4 border-t border-slate-100 pt-3">
  <p className="text-xs text-slate-400">
    Créé le{" "}
    {new Date(user.createdAt).toLocaleDateString("fr-FR")}
  </p>

  <Link
    href={`/dashboard/admin/users/${user.id}`}
    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-50 px-3 py-2.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
  >
    <IconEdit className="size-4 shrink-0" />
    Modifier
  </Link>
</div>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}