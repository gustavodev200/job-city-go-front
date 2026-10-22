// Filtro de busca da spec 004 (research R5): grupos combinam por E, valores de um grupo por OU.
import type { Cidade } from "@/data/brasil/tipos";
import type { VagaNacional } from "@/data/brasil/vagas";
import type { Categoria, Contrato, Modelo, Turno } from "@/data/vagas";
import { distanciaKm } from "@/lib/brasil/distancia";
import { cidadePorId } from "@/lib/brasil/rotas";
import { atendeAbrangencia } from "@/lib/cidade/abrangencia";
import { normalizar } from "@/lib/texto";

export const RAIOS = [10, 25, 50, 100, 200] as const;
export type RaioKm = (typeof RAIOS)[number];
export const RAIO_PADRAO: RaioKm = 50;

export const ORDENS = ["relevancia", "recentes", "salario", "distancia"] as const;
export type Ordem = (typeof ORDENS)[number];

/** "Presença mínima" de "Posso morar no interior": até 1 dia por semana. */
export const DIAS_MAXIMOS_INTERIOR = 1;
export const MAX_TEXTO = 60;

export type FiltroBusca = {
  texto: string;
  categorias: Categoria[];
  modelos: Modelo[];
  salario: { min?: number; max?: number };
  somenteComSalario: boolean;
  turnos: Turno[];
  contratos: Contrato[];
  interior: boolean;
  perto: { cidadeId: string; raioKm: RaioKm } | null;
  /** Só tem efeito com `perto`. */
  incluirRemotas: boolean;
  /** null = padrão (relevância; distância com `perto`). */
  ordem: Ordem | null;
};

export const FILTRO_VAZIO: FiltroBusca = {
  texto: "",
  categorias: [],
  modelos: [],
  salario: {},
  somenteComSalario: false,
  turnos: [],
  contratos: [],
  interior: false,
  perto: null,
  incluirRemotas: true,
  ordem: null,
};

export type GrupoFiltro =
  "texto" | "categorias" | "modelos" | "salario" | "somenteComSalario" | "turnos" | "contratos" | "interior" | "perto";

/** Grupos ativos, na ordem em que aparecem no painel. */
export function gruposAtivos(f: FiltroBusca): GrupoFiltro[] {
  const ativos: GrupoFiltro[] = [];
  if (normalizar(f.texto)) ativos.push("texto");
  if (f.interior) ativos.push("interior");
  if (f.perto) ativos.push("perto");
  if (f.categorias.length) ativos.push("categorias");
  if (f.modelos.length) ativos.push("modelos");
  if (f.salario.min !== undefined || f.salario.max !== undefined) ativos.push("salario");
  if (f.somenteComSalario) ativos.push("somenteComSalario");
  if (f.turnos.length) ativos.push("turnos");
  if (f.contratos.length) ativos.push("contratos");
  return ativos;
}

export const contarAtivos = (f: FiltroBusca) => gruposAtivos(f).length;

/** Filtro sem o grupo (usado por "Limpar" de um grupo e por `sugerirAfrouxar`). */
export function semGrupo(f: FiltroBusca, g: GrupoFiltro): FiltroBusca {
  const vazio: Partial<FiltroBusca> = g === "perto" ? { perto: null } : { [g]: FILTRO_VAZIO[g] };
  return { ...f, ...vazio };
}

export function cidadeDeReferencia(f: FiltroBusca): Cidade | undefined {
  return f.perto ? cidadePorId.get(f.perto.cidadeId) : undefined;
}

const sobrepoe = (v: { min: number; max: number }, f: FiltroBusca["salario"]) =>
  (f.min === undefined || v.max >= f.min) && (f.max === undefined || v.min <= f.max);

export function passaNoFiltro(v: VagaNacional, f: FiltroBusca, ref = cidadeDeReferencia(f)): boolean {
  const termo = normalizar(f.texto);
  if (termo && !normalizar(v.titulo).includes(termo) && !normalizar(v.empresa).includes(termo)) return false;
  if (f.categorias.length && (v.modelo === "remoto" || !f.categorias.includes(v.categoria))) return false;
  if (f.modelos.length && !f.modelos.includes(v.modelo)) return false;
  if (v.faixaSalarial ? !sobrepoe(v.faixaSalarial, f.salario) : f.somenteComSalario) return false;
  if (f.turnos.length && !f.turnos.includes(v.turno)) return false;
  if (f.contratos.length && !f.contratos.includes(v.contrato)) return false;
  if (f.interior && v.modelo !== "remoto" && !(v.modelo === "hibrido" && v.diasPorSemana <= DIAS_MAXIMOS_INTERIOR)) {
    return false;
  }
  if (f.perto && ref) {
    if (v.modelo === "remoto") return f.incluirRemotas && atendeAbrangencia(ref.uf, v.abrangencia);
    const cidade = v.cidadeId ? cidadePorId.get(v.cidadeId) : undefined;
    if (!cidade || distanciaKm(ref, cidade) > f.perto.raioKm) return false;
  }
  return true;
}

export function filtrarVagas(vagas: readonly VagaNacional[], f: FiltroBusca): VagaNacional[] {
  const ref = cidadeDeReferencia(f);
  return vagas.filter((v) => passaNoFiltro(v, f, ref));
}
