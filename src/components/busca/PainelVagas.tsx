"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { vagasBrasil, type VagaNacional } from "@/data/brasil/vagas";
import type { Cidade } from "@/data/brasil/tipos";
import type { FiltroBusca } from "@/lib/busca/filtro";
import { filtroParaParams } from "@/lib/busca/url";
import { ordenarVagas } from "@/lib/busca/ordenar";
import { noRecorte, rotuloRecorte } from "@/lib/busca/recorte";
import { usePainelStore } from "@/stores/painel";
import { ChipsVaga, DetalhesVaga } from "./DetalhesVaga";
import { FiltrosBusca } from "./FiltrosBusca";
import { Gaveta, type AlturaGaveta } from "./Gaveta";
import { hrefVerNoMapa, idTituloItem } from "./ItemVaga";
import { ListaVagas } from "./ListaVagas";
import { useCidadeReferencia, useFiltro, useRecorte, useVagasFiltradas } from "./usarBusca";

export const ID_BOTAO_VAGAS = "botao-vagas";
/** Painel abre sozinho em tela larga (contracts/painel-vagas.md). */
const ABRE_SOZINHO = "(min-width: 1024px)";
const COLUNA = "(min-width: 768px)";
const ESPERA_ANUNCIO_MS = 400;

export function useMedia(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

const plural = (n: number) => (n === 0 ? "Nenhuma vaga com esses filtros" : n === 1 ? "1 vaga" : `${n} vagas`);

/** Vagas do recorte atual que passam no filtro, sem ordem (research R7). */
export function useVagasDoRecorte() {
  const recorte = useRecorte();
  const filtradas = useVagasFiltradas();
  return useMemo(() => filtradas.filter((v) => noRecorte(v, recorte)), [filtradas, recorte]);
}

/**
 * Vagas do painel, ordenadas (research R6). A relevância consulta a data de hoje
 * (destaque patrocinado): só roda no cliente, com o painel aberto.
 */
function useVagasDoPainel() {
  const recorte = useRecorte();
  const filtro = useFiltro();
  const doRecorte = useVagasDoRecorte();
  const referencia = useCidadeReferencia();
  const vagas = useMemo(() => {
    const padrao = filtro.perto ? "distancia" : "relevancia";
    const ordem = filtro.ordem === "distancia" && !referencia ? "relevancia" : (filtro.ordem ?? padrao);
    return ordenarVagas(doRecorte, ordem, { ref: referencia });
  }, [doRecorte, filtro.ordem, filtro.perto, referencia]);
  return { recorte, filtro, vagas, referencia };
}

function Detalhe({
  vaga,
  filtro,
  aoVoltar,
  aoVerNoMapa,
}: {
  vaga: VagaNacional;
  filtro: FiltroBusca;
  aoVoltar: () => void;
  aoVerNoMapa?: () => void;
}) {
  const titulo = useRef<HTMLHeadingElement>(null);
  useEffect(() => titulo.current?.focus({ preventScroll: true }), [vaga.id]);
  return (
    <article aria-labelledby="painel-detalhe-titulo" className="space-y-2">
      <button
        type="button"
        onClick={aoVoltar}
        className="rounded-md border border-black/20 bg-white/60 px-2.5 py-1 text-sm font-semibold hover:bg-white/80"
      >
        ← Voltar à lista
      </button>
      <ChipsVaga vaga={vaga} />
      <h2
        id="painel-detalhe-titulo"
        ref={titulo}
        tabIndex={-1}
        className="fonte-serifa text-xl leading-tight font-bold outline-none"
      >
        {vaga.titulo}
      </h2>
      <p className="fonte-serifa text-[#5c4630] italic">{vaga.empresa}</p>
      {vaga.status === "encerrada" && <p className="text-sm font-semibold text-[#8a1c14]">Vaga encerrada</p>}
      <div className="text-[14px] leading-relaxed">
        <DetalhesVaga vaga={vaga} />
      </div>
      <Link
        href={hrefVerNoMapa(vaga, filtro)}
        onClick={aoVerNoMapa}
        className="block rounded-md bg-amber-300 px-3 py-2 text-center text-sm font-semibold text-stone-900 hover:bg-amber-200"
      >
        Ver no mapa
      </Link>
    </article>
  );
}

/** Conteúdo do painel: cabeçalho, filtros, contagem anunciada e lista/detalhe. */
export function ConteudoVagas({ aoFechar, aoVerNoMapa }: { aoFechar?: () => void; aoVerNoMapa?: () => void }) {
  const { recorte, filtro, vagas, referencia } = useVagasDoPainel();
  const detalheId = usePainelStore((s) => s.detalheId);
  const verDetalhe = usePainelStore((s) => s.verDetalhe);
  const detalhe = detalheId
    ? (vagas.find((v) => v.id === detalheId) ?? vagasBrasil.find((v) => v.id === detalheId))
    : null;

  // Anuncia a contagem só depois que a pessoa para de mexer nos filtros (FR-011).
  const [anuncio, setAnuncio] = useState("");
  useEffect(() => {
    const t = window.setTimeout(() => setAnuncio(plural(vagas.length)), ESPERA_ANUNCIO_MS);
    return () => window.clearTimeout(t);
  }, [vagas.length]);

  const voltar = () => {
    const id = detalheId;
    verDetalhe(null);
    if (id) requestAnimationFrame(() => document.getElementById(idTituloItem(id))?.focus({ preventScroll: false }));
  };

  const aoTeclar = (e: KeyboardEvent<HTMLDivElement>) => {
    // Atalhos do jogo (WASD, E, Esc) não chegam ao personagem enquanto se usa o painel.
    e.stopPropagation();
    if (e.key !== "Escape") return;
    e.preventDefault();
    if (detalhe) voltar();
    else aoFechar?.();
  };

  return (
    <div onKeyDown={aoTeclar} className="space-y-3">
      <p role="status" aria-live="polite" className="sr-only">
        {anuncio}
      </p>
      {detalhe ? (
        <Detalhe vaga={detalhe} filtro={filtro} aoVoltar={voltar} aoVerNoMapa={aoVerNoMapa} />
      ) : (
        <>
          <h2 className="fonte-serifa text-lg leading-tight font-bold">Vagas {rotuloRecorte(recorte)}</h2>
          <FiltrosBusca />
          <p className="text-[13px] font-semibold" aria-hidden>
            {plural(vagas.length)}
          </p>
          <ListaVagas
            key={`${JSON.stringify(recorte)}|${new URLSearchParams(filtroParaParams(filtro))}`}
            vagas={vagas}
            filtro={filtro}
            recorte={recorte}
            referencia={referencia as Cidade | undefined}
            aoAbrir={verDetalhe}
            aoVerNoMapa={aoVerNoMapa}
          />
        </>
      )}
    </div>
  );
}

/**
 * Painel "Vagas" (US1): coluna à direita no desktop (o mapa fica ao lado, sem ser
 * coberto), gaveta inferior no celular. No Estado (celular) o conteúdo vai para a
 * aba "Vagas" da gaveta de cidades (PainelEstado). Atalho `V` abre e fecha.
 */
export function PainelVagas() {
  const aberto = usePainelStore((s) => s.aberto);
  const definirAberto = usePainelStore((s) => s.definirAberto);
  const alternar = usePainelStore((s) => s.alternar);
  const coluna = useMedia(COLUNA);
  const recorte = useRecorte();
  const vagas = useVagasDoRecorte();
  const [altura, setAltura] = useState<AlturaGaveta>("meia");

  useEffect(() => {
    if (usePainelStore.getState().aberto === null) definirAberto(window.matchMedia(ABRE_SOZINHO).matches);
  }, [definirAberto]);

  useEffect(() => {
    const aoTeclar = (e: globalThis.KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      const digitando = alvo?.closest("input, textarea, select, [contenteditable='true']");
      if (e.code !== "KeyV" || e.ctrlKey || e.metaKey || e.altKey || digitando) return;
      alternar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [alternar]);

  const fechar = () => {
    definirAberto(false);
    requestAnimationFrame(() => document.getElementById(ID_BOTAO_VAGAS)?.focus());
  };
  // No celular, "Ver no mapa" fecha a gaveta para o mapa aparecer.
  const aoVerNoMapa = coluna ? undefined : () => definirAberto(false);
  const naGavetaDoEstado = !coluna && recorte.tipo === "uf";

  return (
    <>
      {(!aberto || naGavetaDoEstado) && (
        <button
          id={ID_BOTAO_VAGAS}
          type="button"
          aria-expanded={!!aberto}
          onClick={() => definirAberto(true)}
          className="placa-madeira fixed top-1/2 right-0 z-30 -translate-y-1/2 rounded-l-xl px-2.5 py-2 text-sm font-bold shadow-lg"
        >
          Vagas <span className="tabular-nums">({vagas.length})</span>
          <span className="sr-only"> — atalho V</span>
        </button>
      )}

      {aberto && coluna && (
        <aside
          aria-label="Vagas"
          className="bloco-notas relative z-20 flex h-full w-80 shrink-0 flex-col border-l border-black/15 lg:w-[22rem]"
        >
          <div className="flex justify-end px-2 pt-2">
            <button
              type="button"
              onClick={fechar}
              aria-label="Fechar vagas"
              className="grid size-8 place-items-center rounded-full text-lg hover:bg-black/10"
            >
              ×
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3">
            <ConteudoVagas aoFechar={fechar} />
          </div>
        </aside>
      )}

      {aberto && !coluna && !naGavetaDoEstado && (
        <Gaveta
          id="gaveta-vagas"
          rotulo="Vagas"
          resumo={plural(vagas.length)}
          altura={altura}
          aoMudarAltura={setAltura}
          aoFechar={fechar}
        >
          <ConteudoVagas aoFechar={fechar} aoVerNoMapa={aoVerNoMapa} />
        </Gaveta>
      )}
    </>
  );
}
