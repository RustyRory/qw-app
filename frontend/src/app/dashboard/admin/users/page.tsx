"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconPlus } from "@tabler/icons-react";
import { apiFetch } from "@/lib/apiFetch";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import type { User } from "@/types";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrateur",
  RESPONSABLE: "Responsable",
  COLLABORATEUR: "Collaborateur",
  EXPERT_COMPTABLE: "Expert-comptable",
};

export default function UsersPage() {
  const { ready } = useAuth(["ADMIN"]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready) {
      apiFetch<User[]>("/users")
        .then(setUsers)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [ready]);

  if (!ready) return null;

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Utilisateurs</h1>
        <Button asChild size="sm">
          <Link href="/dashboard/admin/users/new">
            <IconPlus className="size-4" />
            Nouvel utilisateur
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Nom
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Email
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Rôle
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Statut
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Chargement…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Aucun utilisateur
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium">
                    {user.prenom} {user.nom}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    {ROLE_LABEL[user.role] ?? user.role}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${user.isActive ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`}
                    >
                      {user.isActive ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/admin/users/${user.id}`}
                      className="text-xs text-primary hover:underline"
                    >
                      Modifier →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
