"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { UFS } from "@/data/brasil/estados";
import { ALTURA_DEGRAU, celulaDoPonto, topoDaCelula, UF_GEO } from "@/lib/brasil/geo";

/** Altura da linha: logo acima do relevo naquele ponto (ou da praia, no mar). */
function alturaEm(x: number, z: number) {
  const c = celulaDoPonto(x, z);
  const topo = c ? topoDaCelula(c.col, c.lin) : 0;
  return Math.max(topo, ALTURA_DEGRAU) + 0.04;
}

export function Bordas() {
  const geometria = useMemo(() => {
    const pontos: number[] = [];
    for (const uf of UFS) {
      for (const anel of UF_GEO[uf].contorno) {
        for (let i = 0; i < anel.length - 1; i++) {
          const [x0, z0] = anel[i];
          const [x1, z1] = anel[i + 1];
          pontos.push(x0, alturaEm(x0, z0), z0, x1, alturaEm(x1, z1), z1);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pontos, 3));
    return g;
  }, []);
  useEffect(() => () => geometria.dispose(), [geometria]);

  return (
    <lineSegments geometry={geometria} renderOrder={1}>
      <lineBasicMaterial color="#fff8e6" transparent opacity={0.55} depthWrite={false} />
    </lineSegments>
  );
}
