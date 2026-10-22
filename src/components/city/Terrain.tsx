"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { CORES_BIOMA, estados } from "@/data/brasil/estados";
import type { Mundo } from "@/lib/cidade/mundo";
import { useMundo } from "./mundo";

/** Chão além dos limites do mundo (horizonte) e resolução da malha. */
const MARGEM = 110;
const PASSO = 2;
const ALTURA_COLINA_PADRAO = 3;

/** Bairro Remoto avulso (nacional, sem bioma). */
const GRAMA_PADRAO = "#a3c98a";
const SAND = new THREE.Color("#ddcd9f");

/** Vegetação da cidade = cor do bioma do estado no mapa do Brasil. */
export function corDaVegetacao(mundo: Mundo) {
  return mundo.uf ? CORES_BIOMA[estados[mundo.uf].bioma] : GRAMA_PADRAO;
}

/** Tons claros/escuros em volta da cor do bioma (manchas de grama e planalto). */
function paleta(mundo: Mundo) {
  const base = new THREE.Color(corDaVegetacao(mundo));
  return {
    grass: base,
    light: base.clone().offsetHSL(0, 0, 0.05),
    dark: base.clone().offsetHSL(0, 0, -0.04),
    highland: base.clone().offsetHSL(0, -0.05, -0.03),
  };
}

/** Cheap smooth noise in [-1, 1] for grass patches. */
const patches = (x: number, z: number) =>
  Math.sin(x * 0.09) * Math.cos(z * 0.075) * 0.6 + Math.sin(x * 0.23 + z * 0.19) * 0.4;

/** Área do chão: limites do mundo + margem, alinhada à malha. */
export function areaDoChao(mundo: Mundo) {
  const alinhar = (v: number) => Math.round(v / PASSO) * PASSO;
  const { limites } = mundo;
  return {
    minX: alinhar(limites.minX - MARGEM),
    maxX: alinhar(limites.maxX + MARGEM),
    minZ: alinhar(limites.minZ - MARGEM),
    maxZ: alinhar(limites.maxZ + MARGEM),
  };
}

function useGroundGeometry(mundo: Mundo) {
  return useMemo(() => {
    const area = areaDoChao(mundo);
    const width = area.maxX - area.minX;
    const depth = area.maxZ - area.minZ;
    const geometry = new THREE.PlaneGeometry(width, depth, width / PASSO, depth / PASSO);
    geometry.rotateX(-Math.PI / 2);
    geometry.translate((area.minX + area.maxX) / 2, 0, (area.minZ + area.maxZ) / 2);
    const alturaColina = mundo.colina?.altura ?? ALTURA_COLINA_PADRAO;
    const { grass: GRASS, light: GRASS_LIGHT, dark: GRASS_DARK, highland: HIGHLAND } = paleta(mundo);

    const position = geometry.attributes.position;
    const colors = new Float32Array(position.count * 3);
    const color = new THREE.Color();
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const z = position.getZ(i);
      const y = mundo.alturaDoChao(x);
      position.setY(i, y);
      const n = patches(x, z);
      color.copy(GRASS).lerp(n > 0 ? GRASS_LIGHT : GRASS_DARK, Math.abs(n) * 0.7);
      color.lerp(HIGHLAND, (Math.max(0, y) / alturaColina) * 0.6);
      // Sandy banks blend into the river bed.
      color.lerp(SAND, THREE.MathUtils.smoothstep(-y, -0.05, 0.4));
      color.toArray(colors, i * 3);
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    return geometry;
  }, [mundo]);
}

function Bridge() {
  const { ponte: BRIDGE } = useMundo();
  const BRIDGE_LENGTH = BRIDGE.x1 - BRIDGE.x0;
  const BRIDGE_CENTER = (BRIDGE.x0 + BRIDGE.x1) / 2;
  return (
    <group position={[BRIDGE_CENTER, 0, 0]}>
      <mesh position={[0, BRIDGE.topo - 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[BRIDGE_LENGTH, 0.5, BRIDGE.meiaLargura * 2 + 0.6]} />
        <meshStandardMaterial color="#cfcac0" />
      </mesh>
      <mesh position={[0, BRIDGE.topo + 0.01, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[BRIDGE_LENGTH, BRIDGE.meiaLargura * 2 - 0.6]} />
        <meshStandardMaterial color="#8e9196" polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[0, BRIDGE.topo + 0.45, side * (BRIDGE.meiaLargura + 0.15)]} castShadow>
          <boxGeometry args={[BRIDGE_LENGTH, 0.9, 0.3]} />
          <meshStandardMaterial color="#e2ddd2" />
        </mesh>
      ))}
      {[-6, 0, 6].map((dx) => (
        <mesh key={dx} position={[dx, -1.2, 0]} castShadow>
          <boxGeometry args={[1.2, 2.6, BRIDGE.meiaLargura * 2 - 1]} />
          <meshStandardMaterial color="#b9b4aa" />
        </mesh>
      ))}
    </group>
  );
}

export function Terrain() {
  const mundo = useMundo();
  const ground = useGroundGeometry(mundo);
  const area = areaDoChao(mundo);
  const { rio: RIVER } = mundo;
  return (
    <>
      <mesh geometry={ground} receiveShadow>
        <meshStandardMaterial vertexColors roughness={1} />
      </mesh>
      <mesh position={[RIVER.x, RIVER.aguaY, (area.minZ + area.maxZ) / 2]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[RIVER.meiaLargura * 2 + 6, area.maxZ - area.minZ]} />
        <meshStandardMaterial color="#86d0e6" roughness={0.15} metalness={0.05} transparent opacity={0.9} />
      </mesh>
      <Bridge />
    </>
  );
}
