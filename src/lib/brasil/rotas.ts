// Entrada externa vinda da URL — validada com Zod (contracts/rotas-e-estado.md da 001
// e contracts/rotas-e-navegacao.md da 002).
import { z } from "zod";
import { cidades } from "@/data/brasil/cidades";
import { estados, UFS, type Uf } from "@/data/brasil/estados";

/** `/estado/[uf]`: sigla minúscula na URL, `Uf` maiúscula no código. */
export const UfParamSchema = z
  .string()
  .regex(/^[a-z]{2}$/)
  .transform((s) => s.toUpperCase())
  .pipe(z.enum(UFS));

/** `/?aviso=`: valor desconhecido é ignorado. */
export const AvisoSchema = z.enum(["estado", "cidade"]).optional().catch(undefined);

export type Aviso = z.infer<typeof AvisoSchema>;

export const cidadePorId = new Map(cidades.map((c) => [c.id, c]));

const IdCidadeSchema = z.string().regex(/^[a-z0-9-]{3,60}$/);

/** `/cidade/[slug]`: id de uma cidade existente. */
export const CidadeParamSchema = IdCidadeSchema.refine((id) => cidadePorId.has(id));

/** `/estado/[uf]?cidade=`: cidade da própria UF; qualquer outra coisa é ignorada. */
export const cidadeFocoSchema = (uf: Uf) =>
  IdCidadeSchema.refine((id) => cidadePorId.get(id)?.uf === uf)
    .optional()
    .catch(undefined);

export function hrefEstado(uf: Uf, cidadeId?: string) {
  const base = `/estado/${uf.toLowerCase()}`;
  return cidadeId ? `${base}?cidade=${encodeURIComponent(cidadeId)}` : base;
}

export function hrefCidade(cidadeId: string, { chegada }: { chegada?: Chegada } = {}) {
  return `/cidade/${cidadeId}${chegada ? `?chegada=${chegada}` : ""}`;
}

export const hrefRemoto = (deCidadeId?: string) => (deCidadeId ? `/remoto?de=${encodeURIComponent(deCidadeId)}` : "/remoto");

/** `/cidade/[slug]?chegada=ponte`: personagem nasce na cabeceira da ponte. */
export const ChegadaSchema = z.enum(["ponte"]).optional().catch(undefined);
export type Chegada = NonNullable<z.infer<typeof ChegadaSchema>>;

/** `/remoto?de=<cidade>`: para onde o portal de volta leva. */
export const DeSchema = CidadeParamSchema.optional().catch(undefined);

/** `?vaga=<id>`: só vale para vaga do mundo aberto. */
export const vagaSchema = (ids: ReadonlySet<string>) =>
  z
    .string()
    .regex(/^[a-z0-9-]{1,80}$/)
    .refine((id) => ids.has(id))
    .optional()
    .catch(undefined);

export type ItemTrilha = { rotulo: string; href: string | null };

/** Trilha Brasil › Estado › Cidade. O último item é a página atual (`href: null`). */
export function itensDaTrilha({ uf, cidadeId, remoto }: { uf?: Uf; cidadeId?: string; remoto?: boolean }): ItemTrilha[] {
  const cidade = cidadeId ? cidadePorId.get(cidadeId) : undefined;
  if (cidade) {
    return [
      { rotulo: "Brasil", href: "/" },
      { rotulo: estados[cidade.uf].nome, href: hrefEstado(cidade.uf, cidade.id) },
      { rotulo: cidade.nome, href: null },
    ];
  }
  if (uf) return [{ rotulo: "Brasil", href: "/" }, { rotulo: estados[uf].nome, href: null }];
  if (remoto) return [{ rotulo: "Brasil", href: "/" }, { rotulo: "Bairro Remoto", href: null }];
  return [{ rotulo: "Brasil", href: null }];
}
