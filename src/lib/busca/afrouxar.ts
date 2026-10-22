// "Nenhuma vaga com esses filtros": qual filtro tirar para voltar a ter resultado.
import type { VagaNacional } from "@/data/brasil/vagas";
import { CATEGORIA_LABEL, CONTRATO_LABEL, MODELO_LABEL, TURNO_LABEL } from "@/data/vagas";
import { filtrarVagas, gruposAtivos, semGrupo, type FiltroBusca, type GrupoFiltro } from "./filtro";
import { noRecorte, type Recorte } from "./recorte";

const NOME_GRUPO: Record<GrupoFiltro, string> = {
  texto: "Busca",
  categorias: "Categoria",
  modelos: "Modalidade",
  salario: "Faixa salarial",
  somenteComSalario: "Somente com salário informado",
  turnos: "Turno",
  contratos: "Tipo de contrato",
  interior: "Posso morar no interior",
  perto: "Perto de mim",
};

/** Grupo com um valor só mostra o valor ("Noite"); com vários, o nome do grupo ("Turno"). */
export function rotuloGrupo(f: FiltroBusca, g: GrupoFiltro): string {
  if (g === "texto") return `Busca "${f.texto.trim()}"`;
  const um = <T extends string>(lista: T[], rotulos: Record<T, string>) =>
    lista.length === 1 ? rotulos[lista[0]] : NOME_GRUPO[g];
  if (g === "categorias") return um(f.categorias, CATEGORIA_LABEL);
  if (g === "modelos") return um(f.modelos, MODELO_LABEL);
  if (g === "turnos") return um(f.turnos, TURNO_LABEL);
  if (g === "contratos") return um(f.contratos, CONTRATO_LABEL);
  return NOME_GRUPO[g];
}

export type Sugestao = { grupo: GrupoFiltro; rotulo: string; total: number };

/** Grupo ativo cuja remoção traz mais vagas ao recorte; null se nenhum ajuda. */
export function sugerirAfrouxar(vagas: readonly VagaNacional[], f: FiltroBusca, r: Recorte): Sugestao | null {
  const doRecorte = vagas.filter((v) => noRecorte(v, r));
  let melhor: Sugestao | null = null;
  for (const grupo of gruposAtivos(f)) {
    const total = filtrarVagas(doRecorte, semGrupo(f, grupo)).length;
    if (total > 0 && (!melhor || total > melhor.total)) melhor = { grupo, rotulo: rotuloGrupo(f, grupo), total };
  }
  return melhor;
}
