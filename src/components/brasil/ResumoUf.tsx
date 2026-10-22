"use client";

import { CATEGORIA_COLORS, MODELO_COLORS, MODELO_LABEL } from "@/components/city/cores";
import { CategoriaIcon } from "@/components/city/icons";
import { estados, type Uf } from "@/data/brasil/estados";
import { CATEGORIA_LABEL, type Modelo } from "@/data/vagas";
import { useAgregados } from "@/components/busca/usarBusca";

const MODELOS: Modelo[] = ["presencial", "hibrido", "remoto"];

/** Resumo de vagas abertas de uma UF (cartão do mapa e painel do estado). */
export function ResumoUf({ uf, acao }: { uf: Uf; acao?: React.ReactNode }) {
  const ag = useAgregados().porUf[uf];
  return (
    <div className="space-y-2.5">
      <div>
        <h2 className="fonte-serifa text-lg leading-tight font-bold">
          {estados[uf].nome} <span className="text-sm font-semibold opacity-70">({uf})</span>
        </h2>
        <p className="text-sm">
          <strong className="text-base tabular-nums">{ag.abertas}</strong> vagas abertas nas cidades
        </p>
      </div>
      <ul className="space-y-1 text-[13px]" aria-label="Por modalidade">
        {MODELOS.map((m) => (
          <li key={m} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: MODELO_COLORS[m] }} aria-hidden />
            <span className="flex-1">{m === "remoto" ? "Remotas desta UF (no Bairro Remoto)" : MODELO_LABEL[m]}</span>
            <span className="font-bold tabular-nums">{ag.porModelo[m]}</span>
          </li>
        ))}
      </ul>
      {ag.topCategorias.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold tracking-wide uppercase opacity-70">Mais vagas em</p>
          <ul className="mt-1 space-y-1 text-[13px]">
            {ag.topCategorias.map(({ categoria, total }) => (
              <li key={categoria} className="flex items-center gap-2">
                <span
                  className="grid size-5 place-items-center rounded-full text-white"
                  style={{ background: CATEGORIA_COLORS[categoria] }}
                  aria-hidden
                >
                  <CategoriaIcon categoria={categoria} size={12} />
                </span>
                <span className="flex-1">{CATEGORIA_LABEL[categoria]}</span>
                <span className="font-bold tabular-nums">{total}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {acao}
    </div>
  );
}
