// Ordenação da lista (research R6). Só reordena: nenhuma vaga que passou no filtro some.
import type { Cidade } from "@/data/brasil/tipos";
import type { VagaNacional } from "@/data/brasil/vagas";
import { destaqueAtivo } from "@/lib/cidade/mundo";
import type { Ordem } from "./filtro";
import { distanciaDaVaga } from "./perto";

/** Patrocinadas nunca aparecem mais de 2 seguidas (US1-4). */
export const MAX_PATROCINADAS_SEGUIDAS = 2;

type Comparar = (a: VagaNacional, b: VagaNacional) => number;

const porId: Comparar = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const recentes: Comparar = (a, b) => (a.publicadaEm < b.publicadaEm ? 1 : a.publicadaEm > b.publicadaEm ? -1 : 0);
const salario: Comparar = (a, b) => (b.faixaSalarial?.max ?? -1) - (a.faixaSalarial?.max ?? -1);

/** Intercala patrocinadas: até 2, depois 1 não patrocinada, enquanto houver patrocinadas. */
function intercalar(lista: VagaNacional[], hoje?: string) {
  const patrocinadas = lista.filter((v) => destaqueAtivo(v, hoje));
  const demais = lista.filter((v) => !destaqueAtivo(v, hoje));
  const saida: VagaNacional[] = [];
  while (patrocinadas.length) {
    saida.push(...patrocinadas.splice(0, MAX_PATROCINADAS_SEGUIDAS));
    if (!demais.length) break;
    if (patrocinadas.length) saida.push(demais.shift()!);
  }
  return [...saida, ...patrocinadas, ...demais];
}

export function ordenarVagas(
  vagas: readonly VagaNacional[],
  ordem: Ordem,
  { ref, hoje }: { ref?: Cidade; hoje?: string } = {},
): VagaNacional[] {
  const distancia: Comparar = (a, b) => {
    const da = ref ? distanciaDaVaga(a, ref) : null;
    const db = ref ? distanciaDaVaga(b, ref) : null;
    return (da ?? Infinity) - (db ?? Infinity);
  };
  const criterio: Comparar = ordem === "salario" ? salario : ordem === "distancia" && ref ? distancia : recentes;
  const ordenar = (lista: VagaNacional[]) => lista.sort((a, b) => criterio(a, b) || recentes(a, b) || porId(a, b));

  const abertas = ordenar(vagas.filter((v) => v.status === "aberta"));
  const encerradas = ordenar(vagas.filter((v) => v.status !== "aberta"));
  return [...(ordem === "relevancia" ? intercalar(abertas, hoje) : abertas), ...encerradas];
}
