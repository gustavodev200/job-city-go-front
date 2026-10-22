"use client";

import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Uf } from "@/data/brasil/estados";
import { armazenamentoSeguro } from "./armazenamento";

export type ModoMapa = "luzes" | "calor";

const PersistidoSchema = z.object({ modo: z.enum(["luzes", "calor"]) });

type MapaState = {
  /** UF sob o ponteiro, 1º toque ou foco de teclado. O nível vem da URL, não daqui. */
  ufEmFoco: Uf | null;
  modo: ModoMapa;
  focar: (uf: Uf | null) => void;
  alternarModo: () => void;
};

export const useMapaStore = create<MapaState>()(
  persist(
    (set) => ({
      ufEmFoco: null,
      modo: "luzes",
      focar: (ufEmFoco) => set({ ufEmFoco }),
      alternarModo: () => set((s) => ({ modo: s.modo === "luzes" ? "calor" : "luzes" })),
    }),
    {
      name: "jcg:mapa",
      version: 1,
      storage: createJSONStorage(() => armazenamentoSeguro()),
      partialize: (s) => ({ modo: s.modo }),
      // Valor salvo é entrada externa: inválido volta ao padrão.
      merge: (salvo, atual) => {
        const r = PersistidoSchema.safeParse(salvo);
        return r.success ? { ...atual, ...r.data } : atual;
      },
      // Reidratado no cliente (ver useReidratarPreferencias) para não divergir do HTML do servidor.
      skipHydration: true,
    },
  ),
);
