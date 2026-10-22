"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { FACADES } from "@/components/city/facades";
import { InstancedParts } from "@/components/city/Instanced";
import type { Instance } from "@/components/city/facades";
import type { Cidade } from "@/data/brasil/tipos";
import { vagasBrasil } from "@/data/brasil/vagas";
import { ORDEM_CATEGORIAS, type Categoria } from "@/data/vagas";
import { celulaDoPonto, topoDaCelula } from "@/lib/brasil/geo";
import { previaDaCidade, type Previa } from "@/lib/brasil/previa";

/** Lote da cidade (±6,2) → ~0,55 unidade do mapa. */
const ESCALA = 0.045;
/** A prévia aparece com a câmera a menos disto da cidade (histerese evita piscar na borda). */
const DISTANCIA_PREVIA = 30;
const HISTERESE = 2;

export function usePrevia(cidade: Cidade | undefined): Previa | null {
  return useMemo(() => (cidade ? previaDaCidade(cidade, vagasBrasil) : null), [cidade]);
}

/** Câmera perto o bastante da cidade em foco para trocar o aglomerado pela prévia. */
export function usePreviaVisivel(cidade: Cidade | undefined) {
  const camera = useThree((s) => s.camera);
  const [visivel, setVisivel] = useState(false);
  const atual = useRef(false);
  useFrame(() => {
    let proximo = false;
    if (cidade) {
      const d = Math.hypot(camera.position.x - cidade.x, camera.position.y, camera.position.z - cidade.z);
      proximo = d < DISTANCIA_PREVIA + (atual.current ? HISTERESE : -HISTERESE);
    }
    if (proximo !== atual.current) {
      atual.current = proximo;
      setVisivel(proximo);
    }
  });
  return visivel;
}

/** Construções reais das vagas da cidade em foco: luz acesa = aberta, apagada = encerrada (US3). */
export function PreviaCidade({ cidade, previa }: { cidade: Cidade; previa: Previa }) {
  const porCategoria = useMemo(() => {
    const cel = celulaDoPonto(cidade.x, cidade.z);
    const base = cel ? topoDaCelula(cel.col, cel.lin) : 0;
    const grupos = new Map<Categoria, Instance[]>();
    for (const c of previa.construcoes) {
      const lista = grupos.get(c.categoria) ?? [];
      // Todas de frente para o sul: a câmera do mapa olha do sul para o norte.
      lista.push({ x: c.x, y: base, z: c.z, scale: ESCALA, lit: c.aberta, dim: !c.aberta });
      grupos.set(c.categoria, lista);
    }
    return ORDEM_CATEGORIAS.filter((cat) => grupos.has(cat)).map((cat) => [cat, grupos.get(cat)!] as const);
  }, [cidade, previa]);

  return (
    <>
      {porCategoria.map(([cat, instancias]) => (
        <InstancedParts key={`${cidade.id}-${cat}`} parts={FACADES[cat].parts} instances={instancias} shadows={false} />
      ))}
    </>
  );
}
