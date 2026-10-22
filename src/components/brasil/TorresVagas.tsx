"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { cicloRuntime } from "@/components/city/ciclo";
import { cidades } from "@/data/brasil/cidades";
import { AGREGADO_CIDADE } from "@/lib/brasil/agregados";
import { celulaDoPonto, topoDaCelula } from "@/lib/brasil/geo";
import { useUfDaRota } from "@/lib/brasil/navegacao";

const RAIO = 0.6;
const EMISSIVO_DIA = 0.55;
const EMISSIVO_NOITE = 2.4;

/** Altura da torre: cresce com a raiz do nº de vagas (cidades grandes não engolem as pequenas). */
export const alturaTorre = (abertas: number) => 1 + 1.3 * Math.sqrt(abertas);

export const torres = cidades
  .map((c) => {
    const abertas = AGREGADO_CIDADE.get(c.id)?.abertas ?? 0;
    const cel = celulaDoPonto(c.x, c.z);
    return { cidade: c, abertas, base: cel ? topoDaCelula(cel.col, cel.lin) : 0 };
  })
  .filter((t) => t.abertas > 0);

function texturaHalo() {
  const tamanho = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = tamanho;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(tamanho / 2, tamanho / 2, 0, tamanho / 2, tamanho / 2, tamanho / 2);
    g.addColorStop(0, "rgba(255,226,150,1)");
    g.addColorStop(0.35, "rgba(255,190,90,0.45)");
    g.addColorStop(1, "rgba(255,170,60,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, tamanho, tamanho);
  }
  return new THREE.CanvasTexture(canvas);
}

const MATERIAL = new THREE.MeshStandardMaterial({
  color: "#fff1cf",
  emissive: "#ffb347",
  emissiveIntensity: EMISSIVO_DIA,
  roughness: 0.5,
  flatShading: true,
});
const HALO_MATERIAL = new THREE.PointsMaterial({
  size: 4.5,
  sizeAttenuation: true,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  opacity: 0,
});
const HALO_GEOMETRIA = new THREE.BufferGeometry().setAttribute(
  "position",
  new THREE.Float32BufferAttribute(torres.length * 3, 3),
);
/** Fora da vista: torres e halos da UF aberta no nível Estado (lá ficam os aglomerados). */
const ESCONDIDO_Y = -1000;

export function TorresVagas() {
  const instancias = useRef<THREE.InstancedMesh>(null);
  const ufDaRota = useUfDaRota();

  useLayoutEffect(() => {
    // A textura usa canvas do DOM: criada só no cliente, uma vez.
    if (!HALO_MATERIAL.map) {
      HALO_MATERIAL.map = texturaHalo();
      HALO_MATERIAL.needsUpdate = true;
    }
    const mesh = instancias.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const halos = HALO_GEOMETRIA.getAttribute("position") as THREE.BufferAttribute;
    torres.forEach((t, i) => {
      const h = alturaTorre(t.abertas);
      const escondida = t.cidade.uf === ufDaRota;
      m.makeScale(escondida ? 0 : 1, h, escondida ? 0 : 1).setPosition(t.cidade.x, t.base + h / 2, t.cidade.z);
      mesh.setMatrixAt(i, m);
      halos.setXYZ(i, t.cidade.x, escondida ? ESCONDIDO_Y : t.base + h + 0.2, t.cidade.z);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    halos.needsUpdate = true;
    HALO_GEOMETRIA.computeBoundingSphere();
  }, [ufDaRota]);

  useFrame(() => {
    MATERIAL.emissiveIntensity = THREE.MathUtils.lerp(EMISSIVO_DIA, EMISSIVO_NOITE, cicloRuntime.luzes);
    HALO_MATERIAL.opacity = cicloRuntime.luzes * 0.9;
    HALO_MATERIAL.visible = HALO_MATERIAL.opacity > 0.01;
  });

  return (
    <>
      <instancedMesh ref={instancias} args={[undefined, MATERIAL, torres.length]}>
        <cylinderGeometry args={[RAIO, RAIO, 1, 6]} />
      </instancedMesh>
      <points geometry={HALO_GEOMETRIA} material={HALO_MATERIAL} renderOrder={2} />
    </>
  );
}
