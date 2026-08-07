"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";
import { useAuth } from "@/hooks/useAuth";
import type { Notification } from "@/types";

const POLL_INTERVAL_MS = 45_000;

export function useNotifications() {
  const { ready } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const seenIds = useRef<Set<string> | null>(null);

  const refresh = useCallback(() => {
    apiFetch<Notification[]>("/notifications")
      .then((fetched) => {
        // Premier chargement : on mémorise l'existant sans toaster (évite un
        // déluge de toasts au login pour des notifications déjà anciennes).
        if (seenIds.current === null) {
          seenIds.current = new Set(fetched.map((n) => n.id));
        } else {
          for (const n of fetched) {
            if (!n.lu && !seenIds.current.has(n.id)) {
              toast(n.titre, { description: n.message ?? undefined });
            }
            seenIds.current.add(n.id);
          }
        }
        setItems(fetched);
      })
      .catch(() => {
        // Silencieux : une notification manquée n'est pas bloquante.
      });
  }, []);

  useEffect(() => {
    if (!ready) return;
    refresh();
    const intervalId = window.setInterval(refresh, POLL_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [ready, refresh]);

  const markRead = useCallback((id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, lu: true } : n)));
    apiFetch(`/notifications/${id}/lue`, { method: "PATCH" }).catch(() => {});
  }, []);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => ({ ...n, lu: true })));
    apiFetch("/notifications/lues", { method: "PATCH" }).catch(() => {});
  }, []);

  const unreadCount = items.filter((n) => !n.lu).length;

  return { items, unreadCount, refresh, markRead, markAllRead };
}
