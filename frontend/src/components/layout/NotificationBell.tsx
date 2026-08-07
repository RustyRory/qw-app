"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { IconBell, IconCheck } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

export function NotificationBell({
  items,
  unreadCount,
  markRead,
  markAllRead,
  dark = true,
}: {
  items: Notification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dark?: boolean;
}) {
  const [open, setOpen] = useState(false);
  // Position calculée dynamiquement : le panneau est rendu via un portail
  // (cf. plus bas) pour échapper à l'overflow-hidden de la sidebar, donc il
  // ne peut plus se positionner avec un simple `absolute` relatif au bouton.
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const panelWidth = 320; // w-80
      const margin = 8;
      // Aligné à droite du bouton par défaut (comportement historique) ;
      // mais si la sidebar est à gauche de l'écran (bouton proche du bord
      // gauche), il n'y a pas la place — on ouvre alors vers la droite.
      // Dans tous les cas, on clampe dans les limites du viewport.
      let left = rect.right - panelWidth;
      if (left < margin) left = rect.left;
      left = Math.min(left, window.innerWidth - panelWidth - margin);
      left = Math.max(left, margin);
      setPosition({ top: rect.bottom + 8, left });
    }
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !buttonRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function handleClickItem(n: Notification) {
    if (!n.lu) markRead(n.id);
    setOpen(false);
    if (n.lien) router.push(n.lien);
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Notifications"
        className={cn(
          "relative flex size-9 shrink-0 items-center justify-center rounded-xl transition",
          dark
            ? "text-slate-400 hover:bg-white/10 hover:text-white"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
        )}
      >
        <IconBell className="size-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-slate-950">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open &&
        position &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            style={{ top: position.top, left: position.left }}
            className="fixed z-[100] w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Notifications
              </p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-800"
                >
                  <IconCheck className="size-3.5" />
                  Tout marquer comme lu
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-400">
                  Aucune notification
                </p>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleClickItem(n)}
                    className={cn(
                      "flex w-full items-start gap-2 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50",
                      !n.lu && "bg-violet-50/40",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        n.lu ? "bg-transparent" : "bg-violet-500",
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-800">
                        {n.titre}
                      </span>
                      {n.message && (
                        <span className="block truncate text-xs text-slate-500">
                          {n.message}
                        </span>
                      )}
                      <span className="block text-[11px] text-slate-400">
                        {timeAgo(n.createdAt)}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
