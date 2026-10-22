"use client";

import { useSyncExternalStore } from "react";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
/** Narrow screens and touch-first devices (phones, also in landscape). */
const NARROW_QUERY = "(max-width: 768px), (pointer: coarse)";

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** "Reduzir movimento" do sistema: transições viram cortes. */
export function useReducedMotion() {
  return useMediaQuery(REDUCED_QUERY);
}

/** Celulares e telas estreitas: sem sombras e com dpr menor (desempenho). */
export function useIsNarrow() {
  return useMediaQuery(NARROW_QUERY);
}
