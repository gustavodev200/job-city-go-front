"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import * as THREE from "three";
import { cicloRuntime } from "@/components/city/ciclo";
import { cidades } from "@/data/brasil/cidades";
import { useAgregados } from "@/components/busca/usarBusca";
import { useFiltrosStore } from "@/stores/filtros";
import { ALTURA_DEGRAU } from "@/lib/brasil/geo";
import { hrefRemoto } from "@/lib/brasil/rotas";

const LARGURA = 6;
const PROFUNDIDADE = 4;
const ALTURA = ALTURA_DEGRAU * 2;

/** Ilha no Atlântico, a leste de João Pessoa (fora de qualquer UF). */
export const POSICAO_ILHA = (() => {
  const jp = cidades.find((c) => c.id === "joao-pessoa-pb");
  return { x: (jp?.x ?? 90) + 9, z: jp?.z ?? -25 };
})();

const TORRES: [number, number, number][] = [
  [-1.5, -0.6, 1.6],
  [0.6, 0.4, 2.4],
  [1.9, -0.8, 1.2],
];

const LUZ = new THREE.MeshStandardMaterial({ color: "#e9f3ff", emissive: "#7cc4ff", emissiveIntensity: 0.3, flatShading: true });

export function IlhaRemota() {
  const { remoto } = useAgregados();
  const interior = useFiltrosStore((s) => s.interior);
  const router = useRouter();
  const [hover, setHover] = useState(false);
  useFrame(() => {
    LUZ.emissiveIntensity = THREE.MathUtils.lerp(0.3, 2.4, cicloRuntime.luzes);
  });
  const ir = () => router.push(hrefRemoto());
  // Uma chamada de desenho para as três torres.
  const torres = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = torres.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    TORRES.forEach(([x, z, h], i) => mesh.setMatrixAt(i, m.makeScale(1, h, 1).setPosition(x, ALTURA + h / 2, z)));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, []);

  return (
    <group position={[POSICAO_ILHA.x, 0, POSICAO_ILHA.z]}>
      <mesh
        position-y={ALTURA / 2 - 0.15}
        onClick={(e) => {
          if (e.delta > 6) return;
          e.stopPropagation();
          ir();
        }}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <boxGeometry args={[LARGURA, ALTURA + 0.3, PROFUNDIDADE]} />
        <meshStandardMaterial color={hover || interior ? "#c7e7a0" : "#a9d38a"} emissive={interior ? "#f2c230" : "#000000"} emissiveIntensity={interior ? 0.35 : 0} flatShading />
      </mesh>
      <instancedMesh ref={torres} args={[undefined, LUZ, TORRES.length]}>
        <boxGeometry args={[0.8, 1, 0.8]} />
      </instancedMesh>
      <Html position={[0, ALTURA + 3.6, 0]} center zIndexRange={[10, 0]}>
        <button
          type="button"
          onClick={ir}
          className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[13px] font-semibold shadow-sm focus-visible:outline-2 focus-visible:outline-sky-300 ${
            interior ? "bg-amber-300 text-stone-900 ring-2 ring-amber-500" : "bg-sky-900/80 text-sky-50 hover:bg-sky-800"
          }`}
        >
          Bairro Remoto · {remoto.abertas}
        </button>
      </Html>
    </group>
  );
}
