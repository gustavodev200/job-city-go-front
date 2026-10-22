"use client";

import { create } from "zustand";

type PainelState = {
  /** null = ainda não decidido (abre sozinho só em tela larga, no 1º render do cliente). */
  aberto: boolean | null;
  /** Vaga aberta na vista "detalhe" do painel. */
  detalheId: string | null;
  definirAberto: (aberto: boolean) => void;
  alternar: () => void;
  verDetalhe: (id: string | null) => void;
};

// Estado de UI do painel "Vagas" (spec 004): não vai para a URL nem para o armazenamento.
export const usePainelStore = create<PainelState>()((set) => ({
  aberto: null,
  detalheId: null,
  definirAberto: (aberto) => set({ aberto }),
  alternar: () => set((s) => ({ aberto: !s.aberto })),
  verDetalhe: (detalheId) => set({ detalheId }),
}));
