"use client";

import { create } from "zustand";
import { ORDEM_CATEGORIAS, ORDEM_CONTRATOS, ORDEM_MODELOS, ORDEM_TURNOS } from "@/data/vagas";
import { FILTRO_VAZIO, type FiltroBusca } from "@/lib/busca/filtro";

type ListaFiltro = "categorias" | "modelos" | "turnos" | "contratos";

// Mesma ordem que a URL usa: o mesmo filtro sempre vira o mesmo link.
const ORDEM: Record<ListaFiltro, readonly string[]> = {
  categorias: ORDEM_CATEGORIAS,
  modelos: ORDEM_MODELOS,
  turnos: ORDEM_TURNOS,
  contratos: ORDEM_CONTRATOS,
};

type FiltrosState = FiltroBusca & {
  /** A URL já foi lida nesta sessão (research R1): daqui em diante o store manda na URL. */
  iniciado: boolean;
  definir: (parcial: Partial<FiltroBusca>) => void;
  alternar: <K extends ListaFiltro>(grupo: K, valor: FiltroBusca[K][number]) => void;
  limpar: () => void;
  iniciarDaUrl: (f: FiltroBusca) => void;
};

// Sem `persist`: a URL é a persistência (compartilhar o link e recarregar, FR-008).
export const useFiltrosStore = create<FiltrosState>()((set) => ({
  ...FILTRO_VAZIO,
  iniciado: false,
  definir: (parcial) => set(parcial),
  alternar: (grupo, valor) =>
    set((s) => {
      const atual = s[grupo] as string[];
      const marcado = (v: string) => (v === valor ? !atual.includes(v) : atual.includes(v));
      return { [grupo]: ORDEM[grupo].filter(marcado) };
    }),
  limpar: () => set(FILTRO_VAZIO),
  iniciarDaUrl: (f) => set({ ...f, iniciado: true }),
}));

/** Só os campos do filtro (sem ações nem `iniciado`). */
export function filtroDoEstado(s: FiltroBusca): FiltroBusca {
  return {
    texto: s.texto,
    categorias: s.categorias,
    modelos: s.modelos,
    salario: s.salario,
    somenteComSalario: s.somenteComSalario,
    turnos: s.turnos,
    contratos: s.contratos,
    interior: s.interior,
    perto: s.perto,
    incluirRemotas: s.incluirRemotas,
    ordem: s.ordem,
  };
}
