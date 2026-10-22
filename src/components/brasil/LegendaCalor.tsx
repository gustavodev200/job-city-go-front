"use client";

import { CORES_CALOR, LIMITES_FAIXAS } from "@/lib/brasil/agregados";

/** Faixas do modo Calor: "a partir de N vagas abertas". */
export function LegendaCalor() {
  return (
    <div className="cartao-mapa rounded-lg px-3 py-2 text-[12px]">
      <p className="mb-1 font-semibold">Vagas abertas por estado</p>
      <ul className="flex gap-1.5">
        {CORES_CALOR.map((cor, i) => {
          const ate = LIMITES_FAIXAS[i + 1];
          const rotulo = ate === undefined ? `${LIMITES_FAIXAS[i]}+` : `${LIMITES_FAIXAS[i]}–${ate - 1}`;
          return (
            <li key={cor} className="flex flex-col items-center gap-0.5">
              <span className="h-3 w-8 rounded-sm border border-black/15" style={{ background: cor }} aria-hidden />
              <span className="tabular-nums">{rotulo}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
