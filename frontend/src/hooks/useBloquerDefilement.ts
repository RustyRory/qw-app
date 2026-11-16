"use client";

import { useEffect } from "react";

// Bloque le défilement de la page (zone <main> du tableau de bord et
// document) pendant qu'une fenêtre plein écran est ouverte : sans cela, la
// barre de défilement de la page reste visible à côté de celle de la
// fenêtre (deux barres).
export function useBloquerDefilement(actif: boolean) {
  useEffect(() => {
    if (!actif) return;
    const elements = [
      document.documentElement,
      document.body,
      document.querySelector("main"),
    ].filter((e): e is HTMLElement => !!e);
    const avant = elements.map((e) => e.style.overflow);
    elements.forEach((e) => (e.style.overflow = "hidden"));
    return () => {
      elements.forEach((e, i) => (e.style.overflow = avant[i]));
    };
  }, [actif]);
}
