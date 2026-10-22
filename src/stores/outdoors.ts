"use client";

import { create } from "zustand";
import type { Anunciante } from "@/data/anunciantes";

/** Outdoor clicado: a marca, ou "vazio" para o espaço sem anunciante. */
export type OutdoorSelecionado = Anunciante | "vazio";

type OutdoorState = {
  /** Cartão aberto (null = fechado). */
  selecionado: OutdoorSelecionado | null;
  /** Modo de depuração: caixas vermelhas e números dos outdoors. */
  debug: boolean;
  selecionar: (selecionado: OutdoorSelecionado | null) => void;
  alternarDebug: () => void;
};

export const useOutdoorStore = create<OutdoorState>()((set) => ({
  selecionado: null,
  debug: false,
  selecionar: (selecionado) => set({ selecionado }),
  alternarDebug: () => set((state) => ({ debug: !state.debug })),
}));
