"use client";

import { useEffect } from "react";
import { TOTAL_ABERTAS_BRASIL } from "@/lib/brasil/agregados";
import { useConfirmarUf } from "@/lib/brasil/navegacao";
import { useMapaStore } from "@/stores/mapa";
import { ListaEstados } from "./ListaEstados";
import { ResumoUf } from "./ResumoUf";

/** Interface do nível Brasil: placa, lista de estados e resumo da UF em foco. */
export function HudBrasil() {
  const ufEmFoco = useMapaStore((s) => s.ufEmFoco);
  const focar = useMapaStore((s) => s.focar);
  const confirmar = useConfirmarUf();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && focar(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focar]);

  return (
    <>
      <div className="pointer-events-none absolute top-3 left-3 z-20 flex flex-col items-start gap-2 md:top-4 md:left-4">
        <div className="placa-madeira rounded-xl px-3 py-2 md:px-4 md:py-3">
          <h1 className="fonte-serifa text-sm leading-tight font-bold md:text-lg">Job City Go · Brasil</h1>
          <p className="text-[11px] text-[#ffe9c7] md:text-xs">
            <strong className="text-white tabular-nums">{TOTAL_ABERTAS_BRASIL}</strong> vagas abertas no país
          </p>
        </div>
        <ListaEstados />
      </div>

      {/* Resumo: canto no desktop, gaveta inferior no celular. Anunciado ao leitor de tela. */}
      <div
        aria-live="polite"
        className="pointer-events-none absolute inset-x-3 bottom-20 z-20 md:inset-x-auto md:right-4 md:bottom-4 md:w-72"
      >
        {ufEmFoco && (
          <div className="bloco-notas pointer-events-auto rounded-lg p-3">
            <ResumoUf
              uf={ufEmFoco}
              acao={
                <button
                  type="button"
                  onClick={() => confirmar(ufEmFoco)}
                  className="w-full rounded-md bg-amber-300 px-3 py-1.5 text-sm font-semibold text-stone-900 hover:bg-amber-200"
                >
                  Ver vagas deste estado
                </button>
              }
            />
          </div>
        )}
      </div>
    </>
  );
}
