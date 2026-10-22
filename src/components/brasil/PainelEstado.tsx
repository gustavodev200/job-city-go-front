"use client";

import { useEffect, useState } from "react";
import { estados, type Uf } from "@/data/brasil/estados";
import { useAgregados } from "@/components/busca/usarBusca";
import { agregadoDaCidade, cidadesDoEstado } from "@/lib/brasil/agregados";
import { cidadePorId } from "@/lib/brasil/rotas";
import { ConteudoVagas, useMedia } from "@/components/busca/PainelVagas";
import { useMapaStore } from "@/stores/mapa";
import { usePainelStore } from "@/stores/painel";
import { CartaoCidade, fraseCidade } from "./CartaoCidade";
import { EstadosVizinhos } from "./EstadosVizinhos";
import { ListaCidades } from "./ListaCidades";
import { ResumoUf } from "./ResumoUf";
import { Trilha } from "./Trilha";

/** Nível Estado: trilha, resumo, cidade em foco, lista de cidades e estados vizinhos. */
export function PainelEstado({ uf }: { uf: Uf }) {
  const focar = useMapaStore((s) => s.focar);
  const cidadeEmFoco = useMapaStore((s) => s.cidadeEmFoco);
  const focarCidade = useMapaStore((s) => s.focarCidade);
  const [gavetaAberta, setGavetaAberta] = useState(false);
  const { porCidade } = useAgregados();
  // Celular: a gaveta do estado tem as abas Cidades | Vagas (spec 004, research R9).
  // No desktop o painel de vagas é a coluna da direita: a aba só existe no celular.
  const celular = !useMedia("(min-width: 768px)");
  const abaVagas = usePainelStore((s) => !!s.aberto) && celular;
  const definirVagas = usePainelStore((s) => s.definirAberto);
  const expandida = gavetaAberta || abaVagas;

  // O foco do nível Brasil não vale aqui; a cidade em foco vale só para esta UF.
  useEffect(() => focar(null), [focar, uf]);
  useEffect(() => () => focarCidade(null), [focarCidade, uf]);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && focarCidade(null);
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [focarCidade]);

  const emFoco = cidadeEmFoco && cidadePorId.get(cidadeEmFoco)?.uf === uf ? cidadeEmFoco : null;
  const total = cidadesDoEstado(uf).length;

  const conteudo = (
    <>
      {emFoco ? (
        <CartaoCidade cidadeId={emFoco} onFechar={() => focarCidade(null)} />
      ) : (
        <ResumoUf uf={uf} />
      )}
      <ListaCidades uf={uf} />
      <EstadosVizinhos uf={uf} />
    </>
  );

  return (
    <>
      {/* Anúncio para leitor de tela: o cartão muda sem mover o foco do teclado. */}
      <p aria-live="polite" className="sr-only">
        {emFoco ? fraseCidade(emFoco, agregadoDaCidade(porCidade, emFoco)) : ""}
      </p>

      {/* Desktop: painel lateral. */}
      <div className="pointer-events-none absolute top-4 left-4 z-20 hidden w-80 md:block">
        <div className="bloco-notas pointer-events-auto max-h-[calc(100dvh-6rem)] space-y-3 overflow-y-auto rounded-lg p-3">
          <Trilha uf={uf} />
          {conteudo}
        </div>
      </div>

      {/* Celular: trilha no topo e gaveta inferior. */}
      <div className="md:hidden">
        <div className="bloco-notas pointer-events-auto absolute top-3 left-3 z-20 max-w-[calc(100%-7.5rem)] rounded-lg px-3 py-1.5">
          <Trilha uf={uf} />
        </div>
        <section
          aria-label={`Cidades de ${estados[uf].nome}`}
          className="bloco-notas pointer-events-auto absolute inset-x-0 bottom-0 z-30 rounded-t-xl px-3 pt-1 pb-3"
        >
          <button
            type="button"
            aria-expanded={expandida}
            aria-controls="gaveta-estado"
            onClick={() => {
              setGavetaAberta(!expandida);
              if (expandida) definirVagas(false);
            }}
            className="flex w-full flex-col items-center gap-1 py-1 text-sm font-semibold"
          >
            <span className="h-1 w-10 rounded-full bg-black/25" aria-hidden />
            <span>
              {emFoco ? cidadePorId.get(emFoco)?.nome : `${total} ${total === 1 ? "cidade" : "cidades"} com vagas`}
              <span className="ml-1 opacity-60">{expandida ? "▾" : "▴"}</span>
            </span>
          </button>
          <div id="gaveta-estado" hidden={!expandida} className="max-h-[60dvh] space-y-3 overflow-y-auto pt-1">
            <div role="tablist" aria-label="Ver" className="flex gap-1 rounded-lg bg-black/5 p-1 text-sm font-semibold">
              {(["cidades", "vagas"] as const).map((aba) => {
                const ativa = (aba === "vagas") === abaVagas;
                return (
                  <button
                    key={aba}
                    type="button"
                    role="tab"
                    id={`aba-estado-${aba}`}
                    aria-selected={ativa}
                    aria-controls="painel-aba-estado"
                    onClick={() => {
                      setGavetaAberta(true);
                      definirVagas(aba === "vagas");
                    }}
                    className={`flex-1 rounded-md py-1 ${ativa ? "bg-white shadow-sm" : "opacity-70"}`}
                  >
                    {aba === "cidades" ? "Cidades" : "Vagas"}
                  </button>
                );
              })}
            </div>
            <div
              role="tabpanel"
              id="painel-aba-estado"
              aria-labelledby={`aba-estado-${abaVagas ? "vagas" : "cidades"}`}
              className="space-y-3"
            >
              {abaVagas ? (
                <ConteudoVagas aoFechar={() => definirVagas(false)} aoVerNoMapa={() => definirVagas(false)} />
              ) : (
                conteudo
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
