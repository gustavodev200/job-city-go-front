"use client";

import { createContext, useContext } from "react";
import type { Mundo } from "@/lib/cidade/mundo";

// O R3F repassa contexto React para dentro do Canvas: um provider serve cena e HUD.
const MundoContext = createContext<Mundo | null>(null);

export const MundoProvider = MundoContext.Provider;

/** Mundo (cidade ou Bairro Remoto) aberto na página. */
export function useMundo(): Mundo {
  const mundo = useContext(MundoContext);
  if (!mundo) throw new Error("useMundo() fora de <MundoProvider>");
  return mundo;
}
