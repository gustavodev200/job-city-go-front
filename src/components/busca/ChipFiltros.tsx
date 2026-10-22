"use client";

import { contarAtivos } from "@/lib/busca/filtro";
import { useFiltrosStore } from "@/stores/filtros";
import { useFiltro } from "./usarBusca";

/** "Filtros ativos (N) · Limpar" sobre o mapa: o mapa está mostrando só parte das vagas (US2-1). */
export function ChipFiltros() {
  const ativos = contarAtivos(useFiltro());
  const limpar = useFiltrosStore((s) => s.limpar);
  if (ativos === 0) return null;
  return (
    <div className="pointer-events-auto absolute top-16 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-amber-300 py-1 pr-1 pl-3 text-[13px] font-semibold text-stone-900 shadow-lg md:top-[4.5rem]">
      Filtros ativos ({ativos})
      <button type="button" onClick={limpar} className="rounded-full bg-white/80 px-2.5 py-0.5 hover:bg-white">
        Limpar
      </button>
    </div>
  );
}
