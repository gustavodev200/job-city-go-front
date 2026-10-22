"use client";

import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { cidades } from "@/data/brasil/cidades";
import { armazenamentoSeguro } from "./armazenamento";

const IDS_CIDADES = new Set(cidades.map((c) => c.id));

// Mínimo da spec 001; a spec 005 estende este mesmo store (mesma chave, nova versão).
const PersistidoSchema = z.object({
  cidadeId: z
    .string()
    .nullable()
    .transform((id) => (id && IDS_CIDADES.has(id) ? id : null)),
});

type PerfilState = {
  cidadeId: string | null;
  definirCidade: (id: string | null) => void;
};

export const usePerfilStore = create<PerfilState>()(
  persist(
    (set) => ({
      cidadeId: null,
      definirCidade: (id) => set({ cidadeId: id && IDS_CIDADES.has(id) ? id : null }),
    }),
    {
      name: "jcg:perfil",
      version: 1,
      storage: createJSONStorage(() => armazenamentoSeguro()),
      partialize: (s) => ({ cidadeId: s.cidadeId }),
      merge: (salvo, atual) => {
        const r = PersistidoSchema.safeParse(salvo);
        return r.success ? { ...atual, ...r.data } : atual;
      },
      skipHydration: true,
    },
  ),
);
