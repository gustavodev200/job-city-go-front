"use client";

import { useEffect, useRef, useState } from "react";
import type { Cidade } from "@/data/brasil/tipos";
import { vagasBrasil, type VagaNacional } from "@/data/brasil/vagas";
import { sugerirAfrouxar } from "@/lib/busca/afrouxar";
import { contarAtivos, semGrupo, type FiltroBusca } from "@/lib/busca/filtro";
import type { Recorte } from "@/lib/busca/recorte";
import { useFiltrosStore } from "@/stores/filtros";
import { ItemVaga } from "./ItemVaga";

/** Itens por "página" da renderização progressiva (research R10). */
export const LOTE_LISTA = 30;

function Vazio({ filtro, recorte }: { filtro: FiltroBusca; recorte: Recorte }) {
  const definir = useFiltrosStore((s) => s.definir);
  const limpar = useFiltrosStore((s) => s.limpar);
  const sugestao = sugerirAfrouxar(vagasBrasil, filtro, recorte);
  return (
    <div className="space-y-2 rounded-lg bg-white/55 p-3 text-sm">
      <p className="font-semibold">Nenhuma vaga com esses filtros.</p>
      {sugestao && (
        <p>
          Tirar &ldquo;{sugestao.rotulo}&rdquo; mostra {sugestao.total} {sugestao.total === 1 ? "vaga" : "vagas"}.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {sugestao && (
          <button
            type="button"
            onClick={() => definir(semGrupo(filtro, sugestao.grupo))}
            className="rounded-md bg-amber-300 px-2.5 py-1 font-semibold text-stone-900 hover:bg-amber-200"
          >
            Tirar &ldquo;{sugestao.rotulo}&rdquo;
          </button>
        )}
        {contarAtivos(filtro) > 0 && (
          <button
            type="button"
            onClick={limpar}
            className="rounded-md border border-black/20 px-2.5 py-1 hover:bg-black/5"
          >
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Lista progressiva: 30 itens e mais 30 quando o fim aparece na tela ou pelo botão
 * (teclado/leitor). O pai troca a `key` quando filtro ou recorte mudam: volta a 30.
 */
export function ListaVagas({
  vagas,
  filtro,
  recorte,
  referencia,
  aoAbrir,
  aoVerNoMapa,
}: {
  vagas: VagaNacional[];
  filtro: FiltroBusca;
  recorte: Recorte;
  referencia?: Cidade;
  aoAbrir: (id: string) => void;
  aoVerNoMapa?: () => void;
}) {
  const [limite, setLimite] = useState(LOTE_LISTA);
  const sentinela = useRef<HTMLDivElement>(null);
  const restantes = vagas.length - limite;

  useEffect(() => {
    const alvo = sentinela.current;
    if (!alvo || restantes <= 0 || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver((e) => e[0]?.isIntersecting && setLimite((l) => l + LOTE_LISTA));
    obs.observe(alvo);
    return () => obs.disconnect();
  }, [restantes]);

  if (vagas.length === 0) return <Vazio filtro={filtro} recorte={recorte} />;

  return (
    <>
      <ul aria-label="Resultados" className="space-y-2">
        {vagas.slice(0, limite).map((v) => (
          <li key={v.id}>
            <ItemVaga
              vaga={v}
              filtro={filtro}
              referencia={referencia}
              aoAbrir={() => aoAbrir(v.id)}
              aoVerNoMapa={aoVerNoMapa}
            />
          </li>
        ))}
      </ul>
      {restantes > 0 && (
        <div ref={sentinela} className="pt-2">
          <button
            type="button"
            onClick={() => setLimite((l) => l + LOTE_LISTA)}
            className="w-full rounded-md border border-black/20 bg-white/60 py-1.5 text-sm font-semibold hover:bg-white/80"
          >
            Mostrar mais {Math.min(LOTE_LISTA, restantes)}
          </button>
        </div>
      )}
    </>
  );
}
