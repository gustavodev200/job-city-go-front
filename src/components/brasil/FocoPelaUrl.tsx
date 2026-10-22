"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import type { Uf } from "@/data/brasil/estados";
import { cidadesDoEstado } from "@/lib/brasil/agregados";
import { cidadeFocoSchema } from "@/lib/brasil/rotas";
import { useMapaStore } from "@/stores/mapa";

/**
 * Abre o nível Estado com uma cidade em foco: `?cidade=<id>` (trilha do nível Cidade)
 * ou a única cidade com vagas da UF. Parâmetro inválido é ignorado.
 */
export function FocoPelaUrl({ uf }: { uf: Uf }) {
  const valor = useSearchParams().get("cidade") ?? undefined;
  const focarCidade = useMapaStore((s) => s.focarCidade);

  useEffect(() => {
    const daUrl = cidadeFocoSchema(uf).parse(valor);
    const unica = cidadesDoEstado(uf);
    const alvo = daUrl ?? (unica.length === 1 ? unica[0].id : undefined);
    if (alvo) focarCidade(alvo);
  }, [uf, valor, focarCidade]);

  return null;
}
