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

export type Agregados = {
  porUf: Record<Uf, AgregadoUf>;
  porCidade: Map<string, AgregadoCidade>;
  remoto: { abertas: number };
  limites: number[];
  totalBrasil: number;
};

/** Todas as contagens do mapa sobre uma lista (filtrada ou não — spec 004, FR-005). */
export function calcularAgregados(vagas: readonly VagaNacional[]): Agregados {
  const porUf = calcularPorUf(vagas);
  const remoto = calcularRemoto(vagas);
  return {
    porUf,
    porCidade: calcularPorCidade(vagas),
    remoto,
    limites: calcularLimitesFaixas(porUf),
    totalBrasil: UFS.reduce((s, uf) => s + porUf[uf].abertas, 0) + remoto.abertas,
  };
}

export const faixaCalorDe = (ag: Agregados, uf: Uf) => faixaDe(ag.porUf[uf].abertas, ag.limites);

// O conjunto de cidades do mapa não muda com filtro (layout estável, research R2).
const CIDADES_COM_VAGA = calcularPorCidade(vagasBrasil);

const UF_DA_CIDADE = new Map(cidades.map((c) => [c.id, c.uf]));

/** Agregado da cidade; cidade sem vaga no filtro vem zerada (nunca undefined). */
export function agregadoDaCidade(porCidade: ReadonlyMap<string, AgregadoCidade>, cidadeId: string): AgregadoCidade {
  return (
    porCidade.get(cidadeId) ?? {
      cidadeId,
      uf: UF_DA_CIDADE.get(cidadeId) ?? "GO",
      abertas: 0,
      encerradas: 0,
      porCategoria: {},
      porModelo: { presencial: 0, hibrido: 0 },
    }
  );
}

/** Vagas da cidade (abertas + encerradas) sem filtro: tamanho estável do aglomerado no mapa. */
export const totalDaCidade = (cidadeId: string) => {
  const ag = CIDADES_COM_VAGA.get(cidadeId);
  return ag ? ag.abertas + ag.encerradas : 0;
};

/** Cidades da UF com ao menos uma vaga (sem filtro): mais vagas abertas primeiro, depois nome. */
export function cidadesDoEstado(uf: Uf): Cidade[] {
  return cidades
    .filter((c) => c.uf === uf && CIDADES_COM_VAGA.has(c.id))
    .sort(
      (a, b) =>
        CIDADES_COM_VAGA.get(b.id)!.abertas - CIDADES_COM_VAGA.get(a.id)!.abertas || a.nome.localeCompare(b.nome, "pt-BR"),
    );
}

/**
 * Escala do modo Calor: um matiz (laranja; azul confundiria com o mar), claro → escuro.
 * Validada com o validador da skill dataviz (--ordinal): ΔL entre faixas ≥ 0,06 e
 * pontas ≥ 2:1 contra o mar de dia (#5eaecb) e de noite (#132b44).
 */
export const CORES_CALOR = ["#fff0dd", "#f8c287", "#ec9646", "#d06f22", "#a8501a"] as const;
