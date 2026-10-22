"use client";

import type { ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { UFS, type Uf } from "@/data/brasil/estados";
import { CORES_CALOR, faixaCalor } from "@/lib/brasil/agregados";
import { celulaEm, construirMalhaRelevo } from "@/lib/brasil/geo";
import { useConfirmarUf, useUfDaRota } from "@/lib/brasil/navegacao";
import { useMapaStore } from "@/stores/mapa";

const DESTAQUE = 1.22;
/** No nível Estado as outras UFs ficam esmaecidas. */
const ATENUAR = 0.55;
/** Arrasto maior que isto (px) é câmera, não clique. */
const ARRASTO_MAXIMO = 6;

const _cor = new THREE.Color();

export function Relevo() {
  const malha = useMemo(() => construirMalhaRelevo(), []);
  const geometria = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(malha.posicoes, 3));
    g.setAttribute("normal", new THREE.BufferAttribute(malha.normais, 3));
    g.setAttribute("color", new THREE.BufferAttribute(malha.cores.slice(), 3));
    g.setIndex(new THREE.BufferAttribute(malha.indices, 1));
    g.computeBoundingSphere();
    return g;
  }, [malha]);
  useEffect(() => () => geometria.dispose(), [geometria]);

  const modo = useMapaStore((s) => s.modo);
  const ufEmFoco = useMapaStore((s) => s.ufEmFoco);
  const focar = useMapaStore((s) => s.focar);
  const ufDaRota = useUfDaRota();
  const confirmar = useConfirmarUf();

  // Recolore só quando modo, foco ou nível mudam (≈ 70 mil vértices, poucos ms).
  useEffect(() => {
    const cor = geometria.getAttribute("color") as THREE.BufferAttribute;
    const saida = cor.array as Float32Array;
    for (const uf of UFS) {
      const [inicio, fim] = malha.faixasPorUf[uf];
      let fator = 1;
      if (uf === ufEmFoco) fator *= DESTAQUE;
      if (ufDaRota && uf !== ufDaRota) fator *= ATENUAR;
      const calor = modo === "calor" ? _cor.set(CORES_CALOR[faixaCalor(uf)]) : null;
      for (let v = inicio; v < fim; v++) {
        const f = fator * malha.sombra[v];
        const i = v * 3;
        saida[i] = (calor ? calor.r : malha.cores[i]) * f;
        saida[i + 1] = (calor ? calor.g : malha.cores[i + 1]) * f;
        saida[i + 2] = (calor ? calor.b : malha.cores[i + 2]) * f;
      }
    }
    cor.needsUpdate = true;
  }, [geometria, malha, modo, ufEmFoco, ufDaRota]);

  const ufNoPonto = (e: ThreeEvent<PointerEvent | MouseEvent>): Uf | null => celulaEm(e.point.x, e.point.z);

  return (
    <mesh
      geometry={geometria}
      onPointerMove={(e) => {
        if (e.pointerType === "touch") return;
        e.stopPropagation();
        const uf = ufNoPonto(e);
        if (uf !== useMapaStore.getState().ufEmFoco) focar(uf);
      }}
      onPointerOut={(e) => {
        if (e.pointerType !== "touch") focar(null);
      }}
      onClick={(e) => {
        if (e.delta > ARRASTO_MAXIMO) return;
        e.stopPropagation();
        const uf = ufNoPonto(e);
        if (!uf) return;
        // Toque: 1º toque mostra o resumo, 2º na mesma UF entra.
        const toque = (e.nativeEvent as PointerEvent).pointerType === "touch";
        if (toque && useMapaStore.getState().ufEmFoco !== uf) focar(uf);
        else confirmar(uf);
      }}
    >
      <meshStandardMaterial vertexColors flatShading roughness={0.9} />
    </mesh>
  );
}
