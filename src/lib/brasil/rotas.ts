// Entrada externa vinda da URL — validada com Zod (contracts/rotas-e-estado.md).
import { z } from "zod";
import { UFS, type Uf } from "@/data/brasil/estados";

/** `/estado/[uf]`: sigla minúscula na URL, `Uf` maiúscula no código. */
export const UfParamSchema = z
  .string()
  .regex(/^[a-z]{2}$/)
  .transform((s) => s.toUpperCase())
  .pipe(z.enum(UFS));

/** `/?aviso=`: valor desconhecido é ignorado. */
export const AvisoSchema = z.enum(["estado", "cidade"]).optional().catch(undefined);

export type Aviso = z.infer<typeof AvisoSchema>;

export function hrefEstado(uf: Uf) {
  return `/estado/${uf.toLowerCase()}`;
}
