"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { estados, UFS_POR_NOME } from "@/data/brasil/estados";
import { useAgregados } from "@/components/busca/usarBusca";
import { useConfirmarUf } from "@/lib/brasil/navegacao";
import { useMapaStore } from "@/stores/mapa";

/** Lista textual dos 27 estados: acesso por teclado/leitor de tela e para UFs pequenas no toque. */
export function ListaEstados() {
  const { porUf } = useAgregados();
  const [aberta, setAberta] = useState(false);
  const focar = useMapaStore((s) => s.focar);
  const confirmar = useConfirmarUf();
  const itens = useRef<(HTMLButtonElement | null)[]>([]);

  const mover = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const passo = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (passo) {
      e.preventDefault();
      itens.current[(i + passo + UFS_POR_NOME.length) % UFS_POR_NOME.length]?.focus();
    } else if (e.key === "Escape") {
      setAberta(false);
      focar(null);
    }
  };

  return (
    <div className="pointer-events-auto">
      <button
        type="button"
        aria-expanded={aberta}
        aria-controls="lista-estados"
        onClick={() => setAberta((a) => !a)}
        className="cartao-mapa rounded-lg px-3 py-2 text-sm font-semibold"
      >
        Estados
      </button>
      {aberta && (
        <ul
          id="lista-estados"
          aria-label="Estados com vagas abertas"
          className="bloco-notas mt-2 max-h-[55dvh] w-64 overflow-y-auto rounded-lg p-2"
        >
          {UFS_POR_NOME.map((uf, i) => (
            <li key={uf}>
              <button
                ref={(el) => {
                  itens.current[i] = el;
                }}
                type="button"
                // Resumo só com teclado ou mouse: no toque ele cobriria os itens de baixo.
                onFocus={(e) => e.currentTarget.matches(":focus-visible") && focar(uf)}
                onPointerEnter={(e) => e.pointerType === "mouse" && focar(uf)}
                onKeyDown={(e) => mover(e, i)}
                onClick={() => confirmar(uf)}
                className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-[13px] hover:bg-black/10 focus-visible:bg-amber-200 focus-visible:outline-none"
              >
                <span>{estados[uf].nome}</span>
                <span className="font-bold tabular-nums">
                  {porUf[uf].abertas}
                  <span className="sr-only"> vagas abertas</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
