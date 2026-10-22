// Filtros na query string (contracts/filtros-url.md). Entrada externa: cada parâmetro
// tem seu próprio `.catch`, então um valor ruim nunca derruba os outros.
import { z } from "zod";
import { ORDEM_CATEGORIAS, ORDEM_CONTRATOS, ORDEM_MODELOS, ORDEM_TURNOS } from "@/data/vagas";
import { cidadePorId } from "@/lib/brasil/rotas";
import { FILTRO_VAZIO, MAX_TEXTO, ORDENS, RAIO_PADRAO, RAIOS, type FiltroBusca, type RaioKm } from "./filtro";

/** Parâmetros que pertencem ao filtro, na ordem em que são escritos. */
export const CHAVES_FILTRO = [
  "q",
  "cat",
  "mod",
  "sal",
  "comsal",
  "turno",
  "contrato",
  "interior",
  "perto",
  "raio",
  "remotas",
  "ordem",
] as const;

const SALARIO_MAXIMO = 100_000;
const MAX_ITENS = 10;

/** "a,b,c" → valores conhecidos, sem repetição, na ordem canônica. */
const listaSchema = <T extends string>(ordem: readonly T[]) =>
  z
    .string()
    .max(120)
    .transform((s) => s.split(",").slice(0, MAX_ITENS))
    .transform((xs) => ordem.filter((o) => xs.includes(o)))
    .catch([]);

const salarioSchema = z
  .string()
  .regex(/^\d{0,6}-\d{0,6}$/)
  .transform((s) => {
    const [min, max] = s.split("-").map((p) => (p === "" ? undefined : Number(p)));
    return { min, max };
  })
  .refine(({ min, max }) => [min, max].every((n) => n === undefined || n <= SALARIO_MAXIMO))
  .refine(({ min, max }) => min === undefined || max === undefined || min <= max)
  .catch({ min: undefined, max: undefined });

const bandeira = z
  .string()
  .transform((s) => s === "1")
  .catch(false);

const pertoSchema = z
  .string()
  .regex(/^[a-z0-9-]{3,60}$/)
  .refine((id) => cidadePorId.has(id))
  .optional()
  .catch(undefined);

const raioSchema = z.coerce
  .number()
  .refine((n): n is RaioKm => (RAIOS as readonly number[]).includes(n))
  .transform((n) => n as RaioKm)
  .catch(RAIO_PADRAO);

/** Parâmetro ausente → undefined; presente e inválido → o `.catch` do próprio schema. */
const opcional = <T extends z.ZodType>(schema: T) => schema.optional();

export const FiltrosUrlSchema = z
  .object({
    q: z.string().max(MAX_TEXTO).optional().catch(undefined),
    cat: opcional(listaSchema(ORDEM_CATEGORIAS)),
    mod: opcional(listaSchema(ORDEM_MODELOS)),
    sal: opcional(salarioSchema),
    comsal: opcional(bandeira),
    turno: opcional(listaSchema(ORDEM_TURNOS)),
    contrato: opcional(listaSchema(ORDEM_CONTRATOS)),
    interior: opcional(bandeira),
    perto: pertoSchema,
    raio: opcional(raioSchema),
    remotas: z
      .string()
      .transform((s) => s !== "0")
      .optional()
      .catch(true),
    ordem: z.enum(ORDENS).optional().catch(undefined),
  })
  .transform((p): FiltroBusca => ({
    texto: p.q ?? "",
    categorias: p.cat ?? [],
    modelos: p.mod ?? [],
    salario: Object.fromEntries(Object.entries(p.sal ?? {}).filter(([, n]) => n !== undefined)),
    somenteComSalario: p.comsal ?? false,
    turnos: p.turno ?? [],
    contratos: p.contrato ?? [],
    interior: p.interior ?? false,
    perto: p.perto ? { cidadeId: p.perto, raioKm: p.raio ?? RAIO_PADRAO } : null,
    incluirRemotas: p.remotas ?? true,
    ordem: p.ordem ?? null,
  }));

/** Lê os parâmetros de filtro (os demais são ignorados). */
export function filtroDeParams(params: Pick<URLSearchParams, "get">): FiltroBusca {
  const bruto = Object.fromEntries(CHAVES_FILTRO.map((k) => [k, params.get(k) ?? undefined]));
  const r = FiltrosUrlSchema.safeParse(bruto);
  return r.success ? r.data : FILTRO_VAZIO;
}

/** Só o que difere do filtro vazio, na ordem de `CHAVES_FILTRO`. */
export function filtroParaParams(f: FiltroBusca): [string, string][] {
  const p: [string, string][] = [];
  if (f.texto.trim()) p.push(["q", f.texto.trim()]);
  if (f.categorias.length) p.push(["cat", f.categorias.join(",")]);
  if (f.modelos.length) p.push(["mod", f.modelos.join(",")]);
  if (f.salario.min !== undefined || f.salario.max !== undefined) {
    p.push(["sal", `${f.salario.min ?? ""}-${f.salario.max ?? ""}`]);
  }
  if (f.somenteComSalario) p.push(["comsal", "1"]);
  if (f.turnos.length) p.push(["turno", f.turnos.join(",")]);
  if (f.contratos.length) p.push(["contrato", f.contratos.join(",")]);
  if (f.interior) p.push(["interior", "1"]);
  if (f.perto) {
    p.push(["perto", f.perto.cidadeId], ["raio", String(f.perto.raioKm)]);
    if (!f.incluirRemotas) p.push(["remotas", "0"]);
  }
  if (f.ordem) p.push(["ordem", f.ordem]);
  return p;
}

/** Query da URL atual com os parâmetros de filtro trocados pelos de `f` (os demais ficam). */
export function mesclarQuery(atual: string, f: FiltroBusca): string {
  const params = new URLSearchParams(atual);
  for (const k of CHAVES_FILTRO) params.delete(k);
  for (const [k, v] of filtroParaParams(f)) params.append(k, v);
  const s = params.toString();
  return s ? `?${s}` : "";
}
