"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { Uf } from "@/data/brasil/estados";
import { AGREGADO_CIDADE, cidadesDoEstado } from "@/lib/brasil/agregados";
import { distanciaKm } from "@/lib/brasil/distancia";
import { cidadePorId } from "@/lib/brasil/rotas";
import { useMapaStore } from "@/stores/mapa";
import { usePerfilStore } from "@/stores/perfil";

type Ordem = "vagas" | "nome" | "distancia";

/** Lista acessível das cidades do estado, com os mesmos dados do mapa (FR-007, FR-012). */
export function ListaCidades({ uf }: { uf: Uf }) {
  const cidadeEmFoco = useMapaStore((s) => s.cidadeEmFoco);
  const focarCidade = useMapaStore((s) => s.focarCidade);
  const perfil = usePerfilStore((s) => (s.cidadeId ? cidadePorId.get(s.cidadeId) : undefined));
  const [escolhida, setOrdem] = useState<Ordem>("vagas");
  // Sem cidade no perfil não há distância para ordenar.
  const ordem = escolhida === "distancia" && !perfil ? "vagas" : escolhida;
  const itens = useRef<(HTMLButtonElement | null)[]>([]);
  // O painel do desktop e a gaveta do celular montam a lista: ids únicos por instância.
  const titulo = useId();

  const lista = useMemo(() => {
    const base = cidadesDoEstado(uf).map((c) => ({
      cidade: c,
      ag: AGREGADO_CIDADE.get(c.id)!,
      km: perfil ? distanciaKm(perfil, c) : null,
    }));
    if (ordem === "nome") return base.sort((a, b) => a.cidade.nome.localeCompare(b.cidade.nome, "pt-BR"));
    if (ordem === "distancia") return base.sort((a, b) => (a.km ?? 0) - (b.km ?? 0));
    return base; // já vem por vagas abertas
  }, [uf, ordem, perfil]);

  const mover = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const passo = { ArrowDown: 1, ArrowUp: -1 }[e.key];
    if (passo) {
      e.preventDefault();
      itens.current[(i + passo + lista.length) % lista.length]?.focus();
    } else if (e.key === "Escape") {
      focarCidade(null);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <h3 id={titulo} className="text-[11px] font-semibold tracking-wide uppercase opacity-70">
          Cidades deste estado
        </h3>
        <label className="flex items-center gap-1 text-[12px]">
          <span className="opacity-70">Ordenar por</span>
          <select
            value={ordem}
            onChange={(e) => setOrdem(e.target.value as Ordem)}
            className="rounded border border-black/20 bg-white/70 px-1 py-0.5"
          >
            <option value="vagas">Vagas</option>
            <option value="nome">Nome</option>
            {perfil && <option value="distancia">Distância</option>}
          </select>
        </label>
      </div>
      <ul aria-labelledby={titulo} className="space-y-0.5">
        {lista.map(({ cidade, ag, km }, i) => {
          const foco = cidade.id === cidadeEmFoco;
          return (
            <li key={cidade.id}>
              <button
                ref={(el) => {
                  itens.current[i] = el;
                }}
                type="button"
                aria-pressed={foco}
                onClick={() => focarCidade(foco ? null : cidade.id)}
                onKeyDown={(e) => mover(e, i)}
                className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[13px] hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-amber-500 ${
                  foco ? "bg-amber-200 font-semibold" : ""
                } ${ag.abertas === 0 ? "opacity-60" : ""}`}
              >
                <span className="flex-1 truncate">
                  {cidade.nome}
                  {cidade.id === perfil?.id && <span className="ml-1 text-[11px] text-red-700">(você)</span>}
                </span>
                {km !== null && <span className="text-[11px] tabular-nums opacity-70">≈ {km} km</span>}
                <span className="font-bold tabular-nums">{ag.abertas}</span>
                <span className="sr-only">
                  {ag.abertas === 1 ? " vaga aberta" : " vagas abertas"}
                  {ag.encerradas > 0 && `, ${ag.encerradas} encerradas`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
