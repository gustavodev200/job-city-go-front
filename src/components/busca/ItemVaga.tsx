"use client";

import Link from "next/link";
import type { Cidade } from "@/data/brasil/tipos";
import type { VagaNacional } from "@/data/brasil/vagas";
import { CATEGORIA_LABEL, CONTRATO_LABEL, MODELO_LABEL, TURNO_LABEL } from "@/data/vagas";
import { cidadePorId, hrefCidade, hrefRemoto } from "@/lib/brasil/rotas";
import type { FiltroBusca } from "@/lib/busca/filtro";
import { textoPresenca, textoSalario } from "@/lib/busca/formato";
import { distanciaDaVaga } from "@/lib/busca/perto";
import { mesclarQuery } from "@/lib/busca/url";
import { rotuloAbrangencia } from "@/lib/cidade/abrangencia";
import { destaqueAtivo } from "@/lib/cidade/mundo";

/** "Ver no mapa": personagem diante do prédio, pergaminho aberto (003), com os filtros atuais. */
export function hrefVerNoMapa(v: VagaNacional, filtro: FiltroBusca) {
  const base = v.modelo === "remoto" || !v.cidadeId ? hrefRemoto() : hrefCidade(v.cidadeId);
  return `${base}${mesclarQuery(`?vaga=${encodeURIComponent(v.id)}`, filtro)}`;
}

export const idTituloItem = (id: string) => `vaga-${id}-titulo`;

/** Selos com dado no mock (research R13). */
export function SelosVaga({ vaga }: { vaga: VagaNacional }) {
  const selos: { texto: string; classe: string }[] = [];
  if (destaqueAtivo(vaga)) selos.push({ texto: "Patrocinado", classe: "bg-[#f2c230] text-[#3b2a1a]" });
  if (vaga.modelo === "hibrido") {
    selos.push({
      texto: `Híbrida ${textoPresenca(vaga.diasPorSemana)}`,
      classe: "bg-sky-200 text-sky-950",
    });
  }
  if (vaga.status === "encerrada") selos.push({ texto: "Encerrada", classe: "bg-stone-300 text-stone-800" });
  if (selos.length === 0) return null;
  return (
    <ul aria-label="Selos" className="flex flex-wrap gap-1">
      {selos.map((s) => (
        <li key={s.texto} className={`rounded-full px-2 py-px text-[11px] font-bold ${s.classe}`}>
          {s.texto}
        </li>
      ))}
    </ul>
  );
}

export function ItemVaga({
  vaga,
  filtro,
  referencia,
  aoAbrir,
  aoVerNoMapa,
}: {
  vaga: VagaNacional;
  filtro: FiltroBusca;
  /** Cidade de referência: mostra a distância. */
  referencia?: Cidade;
  aoAbrir: () => void;
  aoVerNoMapa?: () => void;
}) {
  const local =
    vaga.modelo === "remoto"
      ? `Remota: ${rotuloAbrangencia(vaga.abrangencia)}`
      : `${vaga.cidade} – ${cidadePorId.get(vaga.cidadeId ?? "")?.uf ?? vaga.uf}`;
  const km = referencia ? distanciaDaVaga(vaga, referencia) : null;
  const modalidade =
    vaga.modelo === "hibrido" ? `Híbrida ${textoPresenca(vaga.diasPorSemana)}` : MODELO_LABEL[vaga.modelo];
  const tituloId = idTituloItem(vaga.id);

  return (
    <article
      aria-labelledby={tituloId}
      className={`space-y-1 rounded-lg border border-black/10 bg-white/55 p-2.5 ${vaga.status === "encerrada" ? "opacity-70" : ""}`}
    >
      <SelosVaga vaga={vaga} />
      <h3 className="text-[15px] leading-snug font-bold">
        <button
          id={tituloId}
          type="button"
          onClick={aoAbrir}
          className="text-left underline-offset-2 hover:underline focus-visible:rounded focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
        >
          {vaga.titulo}
        </button>
      </h3>
      <p className="text-[13px]">
        {vaga.empresa} · {local}
      </p>
      <p className="text-[12px] opacity-80">
        {[
          vaga.modelo === "remoto" ? null : CATEGORIA_LABEL[vaga.categoria],
          modalidade,
          CONTRATO_LABEL[vaga.contrato],
          TURNO_LABEL[vaga.turno],
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
      <div className="flex items-center justify-between gap-2 text-[13px]">
        <span>
          <strong className="tabular-nums">{textoSalario(vaga)}</strong>
          {km !== null && <span className="ml-2 tabular-nums opacity-80">{km} km</span>}
        </span>
        <Link
          href={hrefVerNoMapa(vaga, filtro)}
          onClick={aoVerNoMapa}
          className="shrink-0 rounded-md bg-amber-300 px-2 py-1 text-[12px] font-semibold text-stone-900 hover:bg-amber-200"
        >
          Ver no mapa
          <span className="sr-only">: {vaga.titulo}</span>
        </Link>
      </div>
    </article>
  );
}
