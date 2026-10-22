// Contagens derivadas das vagas mock (FR-015: só vagas abertas; nunca números fixos).
import { CATEGORIA_LABEL, type Categoria, type Modelo } from "@/data/vagas";
import { UFS, type Uf } from "@/data/brasil/estados";
import { cidades } from "@/data/brasil/cidades";
import type { Cidade } from "@/data/brasil/tipos";
import { vagasBrasil, type VagaNacional } from "@/data/brasil/vagas";

export type AgregadoUf = {
  uf: Uf;
  /** Presenciais + híbridas abertas nas cidades da UF (remotas ficam no Bairro Remoto). */
  abertas: number;
  /** `remoto` = vagas remotas de empresas desta UF. */
  porModelo: Record<Modelo, number>;
  topCategorias: { categoria: Categoria; total: number }[];
};

export type AgregadoCidade = {
  cidadeId: string;
  uf: Uf;
  abertas: number;
  encerradas: number;
  /** Só abertas; categoria ausente = 0. */
  porCategoria: Partial<Record<Categoria, number>>;
  /** Só abertas; remotas não têm cidade. */
  porModelo: { presencial: number; hibrido: number };
};

export type FaixaCalor = 0 | 1 | 2 | 3 | 4;

export function calcularPorUf(vagas: readonly VagaNacional[]): Record<Uf, AgregadoUf> {
  const resultado = {} as Record<Uf, AgregadoUf>;
  const categorias = {} as Record<Uf, Partial<Record<Categoria, number>>>;
  for (const uf of UFS) {
    resultado[uf] = { uf, abertas: 0, porModelo: { presencial: 0, hibrido: 0, remoto: 0 }, topCategorias: [] };
    categorias[uf] = {};
  }
  for (const v of vagas) {
    if (v.status !== "aberta") continue;
    const ag = resultado[v.uf];
    ag.porModelo[v.modelo]++;
    if (v.modelo === "remoto") continue;
    ag.abertas++;
    categorias[v.uf][v.categoria] = (categorias[v.uf][v.categoria] ?? 0) + 1;
  }
  for (const uf of UFS) {
    resultado[uf].topCategorias = (Object.entries(categorias[uf]) as [Categoria, number][])
      .map(([categoria, total]) => ({ categoria, total }))
      .sort(
        (a, b) =>
          b.total - a.total || CATEGORIA_LABEL[a.categoria].localeCompare(CATEGORIA_LABEL[b.categoria], "pt-BR"),
      )
      .slice(0, 3);
  }
  return resultado;
}

/** Cidades com ao menos uma vaga presencial/híbrida (aberta ou encerrada). */
export function calcularPorCidade(vagas: readonly VagaNacional[]) {
  const mapa = new Map<string, AgregadoCidade>();
  for (const v of vagas) {
    if (v.modelo === "remoto" || !v.cidadeId) continue;
    let ag = mapa.get(v.cidadeId);
    if (!ag) {
      ag = { cidadeId: v.cidadeId, uf: v.uf, abertas: 0, encerradas: 0, porCategoria: {}, porModelo: { presencial: 0, hibrido: 0 } };
      mapa.set(v.cidadeId, ag);
    }
    if (v.status !== "aberta") {
      ag.encerradas++;
      continue;
    }
    ag.abertas++;
    ag.porModelo[v.modelo]++;
    ag.porCategoria[v.categoria] = (ag.porCategoria[v.categoria] ?? 0) + 1;
  }
  return mapa;
}

export function calcularRemoto(vagas: readonly VagaNacional[]) {
  return { abertas: vagas.filter((v) => v.modelo === "remoto" && v.status === "aberta").length };
}

/** Limites inferiores das 5 faixas (quintis dos totais por UF). */
export function calcularLimitesFaixas(porUf: Record<Uf, AgregadoUf>): number[] {
  const totais = UFS.map((uf) => porUf[uf].abertas).sort((a, b) => a - b);
  const limites = [0, 1, 2, 3, 4].map((i) => totais[Math.floor((i * totais.length) / 5)]);
  // Quintis podem empatar; as faixas da legenda precisam ser crescentes.
  for (let i = 1; i < limites.length; i++) limites[i] = Math.max(limites[i], limites[i - 1] + 1);
  return limites;
}

export function faixaDe(total: number, limites: readonly number[]): FaixaCalor {
  let faixa = 0;
  for (let i = 1; i < limites.length; i++) if (total >= limites[i]) faixa = i;
  return faixa as FaixaCalor;
}

// Memorizados em nível de módulo: as vagas mock não mudam durante a sessão nesta feature.
export const AGREGADO_UF = calcularPorUf(vagasBrasil);
export const AGREGADO_CIDADE = calcularPorCidade(vagasBrasil);
export const AGREGADO_REMOTO = calcularRemoto(vagasBrasil);
export const LIMITES_FAIXAS = calcularLimitesFaixas(AGREGADO_UF);
export const TOTAL_ABERTAS_BRASIL =
  UFS.reduce((s, uf) => s + AGREGADO_UF[uf].abertas, 0) + AGREGADO_REMOTO.abertas;

/** Cidades da UF com ao menos uma vaga: mais vagas abertas primeiro, depois nome. */
export function cidadesDoEstado(uf: Uf): Cidade[] {
  return cidades
    .filter((c) => c.uf === uf && AGREGADO_CIDADE.has(c.id))
    .sort(
      (a, b) =>
        AGREGADO_CIDADE.get(b.id)!.abertas - AGREGADO_CIDADE.get(a.id)!.abertas || a.nome.localeCompare(b.nome, "pt-BR"),
    );
}

export const faixaCalor = (uf: Uf) => faixaDe(AGREGADO_UF[uf].abertas, LIMITES_FAIXAS);

/**
 * Escala do modo Calor: um matiz (laranja; azul confundiria com o mar), claro → escuro.
 * Validada com o validador da skill dataviz (--ordinal): ΔL entre faixas ≥ 0,06 e
 * pontas ≥ 2:1 contra o mar de dia (#5eaecb) e de noite (#132b44).
 */
export const CORES_CALOR = ["#fff0dd", "#f8c287", "#ec9646", "#d06f22", "#a8501a"] as const;
