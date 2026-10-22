// Construções da prévia na cidade em foco (research R5): uma por vaga, até `max`.
import { ORDEM_CATEGORIAS, type Categoria } from "@/data/vagas";
import type { Cidade } from "@/data/brasil/tipos";
import type { VagaNacional } from "@/data/brasil/vagas";
import { destaqueAtivo } from "@/lib/cidade/mundo";

export type ConstrucaoPrevia = {
  vagaId: string;
  categoria: Categoria;
  aberta: boolean;
  /** Patrocinada: vira a torre dourada, no centro da cidade. */
  destaque: boolean;
  x: number;
  z: number;
}

export type Previa = { construcoes: ConstrucaoPrevia[]; excedente: number; raio: number };

export const MAX_CONSTRUCOES = 40;
/** Espaçamento da espiral (unidades da cena): ~ largura de uma fachada na escala da prévia. */
const PASSO = 0.32;
const ANGULO_OURO = Math.PI * (3 - Math.sqrt(5));

export function previaDaCidade(cidade: Cidade, vagas: readonly VagaNacional[], max = MAX_CONSTRUCOES): Previa {
  const daCidade = vagas
    .filter((v): v is Extract<VagaNacional, { categoria: Categoria }> => v.cidadeId === cidade.id && v.modelo !== "remoto")
    .sort(
      (a, b) =>
        Number(b.status === "aberta") - Number(a.status === "aberta") ||
        Number(destaqueAtivo(b)) - Number(destaqueAtivo(a)) ||
        ORDEM_CATEGORIAS.indexOf(a.categoria) - ORDEM_CATEGORIAS.indexOf(b.categoria) ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    );
  const escolhidas = daCidade.slice(0, max);
  // Espiral de Vogel: distribuição uniforme num disco, sem sobreposição.
  const construcoes = escolhidas.map((v, i) => {
    const r = PASSO * Math.sqrt(i + 0.5);
    const a = i * ANGULO_OURO;
    return {
      vagaId: v.id,
      categoria: v.categoria,
      aberta: v.status === "aberta",
      destaque: destaqueAtivo(v),
      x: cidade.x + r * Math.cos(a),
      z: cidade.z + r * Math.sin(a),
    };
  });
  return {
    construcoes,
    excedente: daCidade.length - escolhidas.length,
    raio: PASSO * Math.sqrt(Math.max(1, escolhidas.length)),
  };
}
