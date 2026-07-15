"use client";

import Link from "next/link";
import {
  IconArrowRight,
  IconSettings,
  IconShieldCheck,
  IconUsers,
} from "@tabler/icons-react";
import { useAuth } from "@/hooks/useAuth";

export default function AdminPage() {
  const { ready } = useAuth(["ADMIN"]);

  if (!ready) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-50">
        <div className="size-7 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 pb-20 sm:p-6 md:p-8 md:pb-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* En-tête */}
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-violet-700 to-indigo-600 px-6 py-7 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <IconSettings className="size-6 text-white" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-200">
                Espace administrateur
              </p>

              <h1 className="mt-1 text-2xl font-bold text-white">
                Administration
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-violet-100">
                Gérez les utilisateurs, leurs rôles et l’accès aux différentes
                fonctionnalités du cabinet.
              </p>
            </div>
          </div>
        </div>

        {/* Petit encart sécurité */}
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <IconShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />

          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Accès sécurisé
            </p>

            <p className="mt-1 text-sm text-emerald-700">
              Cette section est uniquement accessible aux administrateurs.
            </p>
          </div>
        </div>

        {/* Carte utilisateurs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/dashboard/admin/users"
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-violet-200 hover:shadow-md"
          >
            <div className="absolute right-0 top-0 size-24 rounded-bl-full bg-violet-50 transition-transform group-hover:scale-110" />

            <div className="relative">
              <div className="flex size-11 items-center justify-center rounded-xl bg-violet-100">
                <IconUsers className="size-6 text-violet-700" />
              </div>

              <h2 className="mt-5 text-lg font-semibold text-slate-900">
                Utilisateurs
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Créer, modifier ou désactiver les comptes des membres du
                cabinet.
              </p>

              <div className="mt-5 flex items-center gap-2 text-sm font-medium text-violet-700">
                Gérer les utilisateurs
                <IconArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}