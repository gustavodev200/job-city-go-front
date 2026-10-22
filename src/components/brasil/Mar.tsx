"use client";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cicloRuntime } from "@/components/city/ciclo";
import { CAIXA_BRASIL } from "@/lib/brasil/geo";

const DIA = new THREE.Color("#5eaecb");
const NOITE = new THREE.Color("#132b44");

const MATERIAL = new THREE.MeshStandardMaterial({ color: DIA.clone(), roughness: 0.35, metalness: 0.05 });

export function Mar() {
  useFrame(() => {
    MATERIAL.color.lerpColors(DIA, NOITE, cicloRuntime.noite);
  });
  const largura = (CAIXA_BRASIL.maxX - CAIXA_BRASIL.minX) * 4;
  const profundidade = (CAIXA_BRASIL.maxZ - CAIXA_BRASIL.minZ) * 4;
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={-0.05} material={MATERIAL}>
      <planeGeometry args={[largura, profundidade]} />
    </mesh>
  );
}
