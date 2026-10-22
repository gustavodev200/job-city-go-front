"use client";

import { useMemo } from "react";
import { BrilhoPatrocinado } from "@/components/city/BrilhoPatrocinado";
import { FACADES, TORRE_PATROCINADA } from "@/components/city/facades";
import { InstancedParts } from "@/components/city/Instanced";
import type { Instance } from "@/components/city/facades";
import type { Uf } from "@/data/brasil/estados";
import type { Cidade } from "@/data/brasil/tipos";
import { vagasBrasil } from "@/data/brasil/vagas";
import { ORDEM_CATEGORIAS, type Categoria } from "@/data/vagas";
import { celulaDoPonto, topoDaCelula } from "@/lib/brasil/geo";
import { previaDaCidade, type Previa } from "@/lib/brasil/previa";
import { useMapaStore } from "@/stores/mapa";

/** Lote da cidade (±6,2) → ~0,55 unidade do mapa. */
const ESCALA = 0.045;
export function usePrevia(cidade: Cidade | undefined): Previa | null {
  return useMemo(() => (cidade ? previaDaCidade(cidade, vagasBrasil) : null), [cidade]);
}

/** Halo do patrocinado na escala do mapa. */
const HALO_RAIO = 0.9;
const FEIXE_ALTURA = 7;
/** Arrasto maior que isto (px) é câmera, não clique. */
const ARRASTO_MAXIMO = 6;

/**
 * Construções reais das vagas de cada cidade, já organizadas em volta do centro: luz acesa =
 * aberta, apagada = encerrada (US3); patrocinada = torre dourada com halo. Clicar numa cidade
 * da UF aberta foca a cidade; fora dela o clique segue para o relevo (entra na UF).
 */
export function PreviasDasCidades({ cidades, uf }: { cidades: readonly Cidade[]; uf: Uf | null }) {
  const focarCidade = useMapaStore((s) => s.focarCidade);
  const { porCategoria, torres } = useMemo(() => {
    const grupos = new Map<Categoria, Instance[]>();
    const torres: Instance[] = [];
    for (const cidade of cidades) {
      const cel = celulaDoPonto(cidade.x, cidade.z);
      const base = cel ? topoDaCelula(cel.col, cel.lin) : 0;
      for (const c of previaDaCidade(cidade, vagasBrasil).construcoes) {
        // Todas de frente para o sul: a câmera do mapa olha do sul para o norte.
        const inst = { x: c.x, y: base, z: c.z, scale: ESCALA, lit: c.aberta, dim: !c.aberta };
        if (c.destaque) {
          torres.push(inst);
          continue;
        }
        const lista = grupos.get(c.categoria) ?? [];
        lista.push(inst);
        grupos.set(c.categoria, lista);
      }
    }
    return {
      porCategoria: ORDEM_CATEGORIAS.filter((cat) => grupos.has(cat)).map((cat) => [cat, grupos.get(cat)!] as const),
      torres,
    };
  }, [cidades]);

  const maisPerto = (x: number, z: number) =>
    cidades.reduce((m, c) => (Math.hypot(c.x - x, c.z - z) < Math.hypot(m.x - x, m.z - z) ? c : m));

  return (
    <group
      onClick={(e) => {
        if (e.delta > ARRASTO_MAXIMO || !uf) return;
        const cidade = maisPerto(e.point.x, e.point.z);
        if (cidade.uf !== uf) return;
        e.stopPropagation();
        focarCidade(cidade.id);
      }}
    >
      {porCategoria.map(([cat, instancias]) => (
        <InstancedParts key={cat} parts={FACADES[cat].parts} instances={instancias} shadows={false} />
      ))}
      <InstancedParts parts={TORRE_PATROCINADA.parts} instances={torres} shadows={false} />
      <BrilhoPatrocinado pontos={torres} raio={HALO_RAIO} altura={FEIXE_ALTURA} />
    </group>
  );
}
