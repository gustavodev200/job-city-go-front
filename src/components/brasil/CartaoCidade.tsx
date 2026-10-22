"use client";

import Link from "next/link";
import { CATEGORIA_COLORS, MODELO_COLORS, MODELO_LABEL } from "@/components/city/cores";
import { CategoriaIcon, ModeloIcon } from "@/components/city/icons";
import { CATEGORIA_LABEL, ORDEM_CATEGORIAS } from "@/data/vagas";
import { useAgregados } from "@/components/busca/usarBusca";
import { agregadoDaCidade, type AgregadoCidade } from "@/lib/brasil/agregados";
import { cidadePorId, hrefCidade } from "@/lib/brasil/rotas";

const MODELOS = ["presencial", "hibrido"] as const;

/** Frase lida pelo leitor de tela ao focar a cidade. */
export function fraseCidade(cidadeId: string, ag: AgregadoCidade) {
  const cidade = cidadePorId.get(cidadeId);
  if (!cidade) return "";
  const categorias = ORDEM_CATEGORIAS.filter((c) => ag.porCategoria[c])
    .map((c) => `${CATEGORIA_LABEL[c]} ${ag.porCategoria[c]}`)
    .join(", ");
  return `${cidade.nome}: ${ag.abertas} vagas abertas.${categorias ? ` ${categorias}.` : ""}`;
}

/** Resumo da cidade em foco: total, barras por categoria e modalidade (US2). */
export function CartaoCidade({
  cidadeId,
  onFechar,
  entrar = true,
}: {
  cidadeId: string;
  onFechar?: () => void;
  /** Mostra "Entrar na cidade" (não faz sentido na própria página da cidade). */
  entrar?: boolean;
}) {
  const cidade = cidadePorId.get(cidadeId);
  const ag = agregadoDaCidade(useAgregados().porCidade, cidadeId);
  if (!cidade) return null;
  const categorias = ORDEM_CATEGORIAS.filter((c) => ag.porCategoria[c]);
  const maximo = Math.max(1, ...categorias.map((c) => ag.porCategoria[c] ?? 0));

  return (
    <section aria-label={`Vagas em ${cidade.nome}`} className="space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="fonte-serifa text-lg leading-tight font-bold">{cidade.nome}</h2>
          <p className="text-sm">
            <strong className="text-base tabular-nums">{ag.abertas}</strong>{" "}
            {ag.abertas === 1 ? "vaga aberta" : "vagas abertas"}
            {ag.encerradas > 0 && (
              <span className="opacity-70">
                {" "}
                · {ag.encerradas} {ag.encerradas === 1 ? "encerrada" : "encerradas"}
              </span>
            )}
          </p>
        </div>
        {onFechar && (
          <button
            type="button"
            onClick={onFechar}
            aria-label={`Fechar ${cidade.nome}`}
            className="rounded px-1.5 text-lg leading-none hover:bg-black/10"
          >
            ×
          </button>
        )}
      </div>

      {categorias.length > 0 && (
        <ul className="space-y-1 text-[13px]" aria-label="Por categoria">
          {categorias.map((c) => {
            const total = ag.porCategoria[c] ?? 0;
            return (
              <li key={c} className="flex items-center gap-2">
                <span
                  className="grid size-5 shrink-0 place-items-center rounded-full text-white"
                  style={{ background: CATEGORIA_COLORS[c] }}
                  aria-hidden
                >
                  <CategoriaIcon categoria={c} size={12} />
                </span>
                <span className="w-32 shrink-0 truncate">{CATEGORIA_LABEL[c]}</span>
                <span className="h-2 flex-1 rounded-full bg-black/10" aria-hidden>
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${(total / maximo) * 100}%`, background: CATEGORIA_COLORS[c] }}
                  />
                </span>
                <span className="w-5 text-right font-bold tabular-nums">{total}</span>
              </li>
            );
          })}
        </ul>
      )}

      <ul className="flex gap-3 text-[13px]" aria-label="Por modalidade">
        {MODELOS.map((m) => (
          <li key={m} className="flex items-center gap-1.5">
            <ModeloIcon modelo={m} size={14} style={{ color: MODELO_COLORS[m] }} />
            <span>{MODELO_LABEL[m]}</span>
            <span className="font-bold tabular-nums">{ag.porModelo[m]}</span>
          </li>
        ))}
      </ul>

      {entrar && (
        <Link
          href={hrefCidade(cidadeId)}
          className="cartao-mapa block rounded-lg px-3 py-2 text-center text-sm font-semibold"
        >
          Entrar na cidade
        </Link>
      )}
    </section>
  );
}
