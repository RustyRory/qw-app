"use client";

import Link from "next/link";
import { IconUsers } from "@tabler/icons-react";
import { useAuth } from "@/hooks/useAuth";

export default function AdminPage() {
  const { ready } = useAuth(["ADMIN"]);

  if (!ready) return null;

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-semibold">Administration</h1>
      <Link
        href="/dashboard/admin/users"
        className="flex max-w-sm items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
      >
        <IconUsers className="size-5 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Utilisateurs</p>
          <p className="text-xs text-muted-foreground">
            Gérer les comptes du cabinet
          </p>
        </div>
      </Link>
    </div>
  );
}
