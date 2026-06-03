"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { IconPlus, IconPencil, IconX } from "@tabler/icons-react";
import { apiFetch } from "@/lib/apiFetch";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import type { User } from "@/types";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrateur",
  responsable: "Responsable",
  collaborateur: "Collaborateur",
  "expert-comptable": "Expert-comptable",
};

// ── User dialog ───────────────────────────────────────────────────────────────

function UserDialog({
  open,
  user,
  onClose,
  onSuccess,
}: {
  open: boolean;
  user?: User;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const data: Record<string, string> = {
      prenom: form.get("prenom") as string,
      nom: form.get("nom") as string,
      email: form.get("email") as string,
      role: form.get("role") as string,
    };
    const password = form.get("password") as string;
    if (password) data.password = password;

    try {
      if (user) {
        await apiFetch(`/users/${user.id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
      } else {
        await apiFetch("/users", {
          method: "POST",
          body: JSON.stringify({ ...data, password }),
        });
      }
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold">
              {user ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
            </Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground">
              <IconX className="size-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="prenom">Prénom *</FieldLabel>
                  <Input
                    id="prenom"
                    name="prenom"
                    defaultValue={user?.prenom}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="nom">Nom *</FieldLabel>
                  <Input
                    id="nom"
                    name="nom"
                    defaultValue={user?.nom}
                    required
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="email">Email *</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={user?.email}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="role">Rôle *</FieldLabel>
                <select
                  id="role"
                  name="role"
                  defaultValue={user?.role ?? "collaborateur"}
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  <option value="collaborateur">Collaborateur</option>
                  <option value="responsable">Responsable</option>
                  <option value="admin">Administrateur</option>
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="password">
                  {user ? "Mot de passe (vide = inchangé)" : "Mot de passe *"}
                </FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required={!user}
                />
              </Field>
            </FieldGroup>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Enregistrement…" : user ? "Mettre à jour" : "Créer"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { ready } = useAuth("admin");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const loadUsers = () => {
    apiFetch<User[]>("/users")
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (ready) loadUsers();
  }, [ready]);

  async function toggleActive(user: User) {
    try {
      await apiFetch(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  }

  if (!ready) return null;

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Administration</h1>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <IconPlus className="size-4" />
          Nouvel utilisateur
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
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
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="icon-sm"
                        variant="outline"
                        onClick={() => setEditUser(user)}
                      >
                        <IconPencil className="size-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant={user.isActive ? "destructive" : "secondary"}
                        onClick={() => toggleActive(user)}
                      >
                        {user.isActive ? "Désactiver" : "Activer"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <UserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          loadUsers();
        }}
      />
      {editUser && (
        <UserDialog
          open
          user={editUser}
          onClose={() => setEditUser(null)}
          onSuccess={() => {
            setEditUser(null);
            loadUsers();
          }}
        />
      )}
    </div>
  );
}
