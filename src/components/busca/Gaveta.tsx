"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";

export type AlturaGaveta = "meia" | "cheia";

const ALTURA_DVH: Record<AlturaGaveta, number> = { meia: 50, cheia: 88 };
/** Soltou abaixo disto (em % da tela): fecha. */
const FECHAR_ABAIXO = 28;

/**
 * Gaveta inferior do celular (research R9): arrasta pelo puxador entre meia e cheia,
 * ou fecha soltando lá embaixo. O botão do puxador faz o mesmo pelo teclado.
 */
export function Gaveta({
  id,
  rotulo,
  resumo,
  altura,
  aoMudarAltura,
  aoFechar,
  children,
}: {
  id: string;
  rotulo: string;
  resumo: string;
  altura: AlturaGaveta;
  aoMudarAltura: (a: AlturaGaveta) => void;
  aoFechar: () => void;
  children: ReactNode;
}) {
  const [arrasto, setArrasto] = useState<number | null>(null);
  const inicio = useRef<{ y: number; dvh: number; moveu: boolean } | null>(null);
  /** O clique que vem depois de um arrasto não alterna a altura. */
  const arrastou = useRef(false);

  const aoPressionar = (e: PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    inicio.current = { y: e.clientY, dvh: ALTURA_DVH[altura], moveu: false };
  };
  const aoMover = (e: PointerEvent<HTMLButtonElement>) => {
    const i = inicio.current;
    if (!i) return;
    const delta = ((i.y - e.clientY) / window.innerHeight) * 100;
    if (Math.abs(delta) > 2) i.moveu = true;
    if (i.moveu) setArrasto(Math.min(ALTURA_DVH.cheia, Math.max(10, i.dvh + delta)));
  };
  const aoSoltar = () => {
    const i = inicio.current;
    inicio.current = null;
    if (!i?.moveu || arrasto === null) return;
    arrastou.current = true;
    setArrasto(null);
    if (arrasto < FECHAR_ABAIXO) aoFechar();
    else aoMudarAltura(arrasto > (ALTURA_DVH.meia + ALTURA_DVH.cheia) / 2 ? "cheia" : "meia");
  };

  return (
    <section
      aria-label={rotulo}
      style={{ height: `${arrasto ?? ALTURA_DVH[altura]}dvh` }}
      className={`bloco-notas pointer-events-auto fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-xl shadow-2xl ${
        arrasto === null ? "transition-[height] duration-200 motion-reduce:transition-none" : ""
      }`}
    >
      <div className="flex items-center gap-2 px-3 pt-1">
        <button
          type="button"
          aria-expanded={altura === "cheia"}
          aria-controls={id}
          onClick={() => {
            // Clique sem arrasto alterna a altura; o arrasto já resolveu ao soltar.
            if (arrastou.current) arrastou.current = false;
            else aoMudarAltura(altura === "cheia" ? "meia" : "cheia");
          }}
          onPointerDown={aoPressionar}
          onPointerMove={aoMover}
          onPointerUp={aoSoltar}
          onPointerCancel={aoSoltar}
          className="flex flex-1 touch-none flex-col items-center gap-1 py-1 text-sm font-semibold"
        >
          <span className="h-1 w-10 rounded-full bg-black/25" aria-hidden />
          <span>
            {resumo}
            <span className="ml-1 opacity-60" aria-hidden>
              {altura === "cheia" ? "▾" : "▴"}
            </span>
            <span className="sr-only">{altura === "cheia" ? " (reduzir)" : " (expandir)"}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={aoFechar}
          aria-label={`Fechar ${rotulo.toLowerCase()}`}
          className="grid size-9 place-items-center rounded-full text-lg hover:bg-black/10"
        >
          ×
        </button>
      </div>
      <div id={id} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3">
        {children}
      </div>
    </section>
  );
}
