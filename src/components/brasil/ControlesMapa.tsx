"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { cidades } from "@/data/brasil/cidades";
import { AGREGADO_REMOTO } from "@/lib/brasil/agregados";
import { useUfDaRota } from "@/lib/brasil/navegacao";
import { hrefCidade, hrefRemoto } from "@/lib/brasil/rotas";
import { useReidratar } from "@/stores/armazenamento";
import { useMapaStore } from "@/stores/mapa";
import { usePerfilStore } from "@/stores/perfil";
import { EscolherCidade } from "./EscolherCidade";
import { LegendaCalor } from "./LegendaCalor";
import { mapaRuntime } from "./runtime";

// Lê o relógio do dispositivo: só no cliente.
const ControleHora = dynamic(() => import("@/components/city/ControleHora"), { ssr: false });

/** Controles comuns aos níveis Brasil e Estado (ficam no layout). */
export function ControlesMapa() {
  useReidratar(useMapaStore, usePerfilStore);
  const modo = useMapaStore((s) => s.modo);
  const alternarModo = useMapaStore((s) => s.alternarModo);
  const cidadeId = usePerfilStore((s) => s.cidadeId);
  const [escolhendo, setEscolhendo] = useState(false);
  const cidade = cidades.find((c) => c.id === cidadeId);
  const hrefMinhaCidade = cidade && hrefCidade(cidade.id);
  // No celular, no nível Estado, a gaveta de cidades ocupa a base da tela.
  const naGaveta = useUfDaRota() !== null;

  return (
    <>
      <ControleHora />
      <div className="pointer-events-auto absolute top-32 right-3 z-20 flex flex-col items-end gap-2 md:top-4 md:right-4">
        <div role="group" aria-label="Visual do mapa" className="cartao-mapa flex rounded-lg p-0.5 text-sm font-semibold">
          {(["luzes", "calor"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={modo === m}
              onClick={() => modo !== m && alternarModo()}
              className={`rounded-md px-3 py-1.5 ${modo === m ? "bg-amber-300 text-stone-900" : ""}`}
            >
              {m === "luzes" ? "Luzes" : "Calor"}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => mapaRuntime.centralizar()} className="cartao-mapa rounded-lg px-3 py-1.5 text-sm font-semibold">
          Centralizar
        </button>
        {modo === "calor" && <LegendaCalor />}
      </div>

      <div className={`pointer-events-auto absolute left-3 z-20 flex max-w-[calc(100%-1.5rem)] flex-col items-start gap-2 md:bottom-4 md:left-4 ${naGaveta ? "bottom-20" : "bottom-3"}`}>
        {escolhendo && (
          <div className="bloco-notas w-64 rounded-lg p-3">
            <EscolherCidade aoEscolher={() => setEscolhendo(false)} />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Link href={hrefRemoto()} className="cartao-mapa rounded-lg px-3 py-2 text-sm font-semibold">
            Bairro Remoto <span className="tabular-nums">({AGREGADO_REMOTO.abertas} vagas)</span>
          </Link>
          {cidade && hrefMinhaCidade ? (
            <>
              <Link href={hrefMinhaCidade} className="cartao-mapa rounded-lg px-3 py-2 text-sm font-semibold">
                Ir para minha cidade
              </Link>
              <button type="button" onClick={() => setEscolhendo((e) => !e)} className="cartao-mapa rounded-lg px-3 py-2 text-sm">
                Trocar cidade
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setEscolhendo((e) => !e)} className="cartao-mapa rounded-lg px-3 py-2 text-sm">
              Informe sua cidade para ver vagas perto de você
            </button>
          )}
        </div>
      </div>
    </>
  );
}
