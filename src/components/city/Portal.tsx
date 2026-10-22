"use client";

import { Html } from "@react-three/drei";
import { useMundo } from "./mundo";

const ALTURA = 5.2;
const VAO = 7;

/** Arco na margem oeste do Bairro Remoto avulso (`/remoto`): atravessar leva de volta. */
export function Portal({ rotulo }: { rotulo: string }) {
  const { ponte, alturaDoPasso } = useMundo();
  const x = ponte.x0 - 4;
  const y = alturaDoPasso(x, 0);
  const cor = "#e57a3c";
  return (
    <group position={[x, y, 0]} rotation-y={Math.PI / 2}>
      {[-1, 1].map((lado) => (
        <mesh key={lado} position={[(lado * VAO) / 2, ALTURA / 2, 0]} castShadow>
          <boxGeometry args={[0.6, ALTURA, 0.6]} />
          <meshStandardMaterial color="#e9dcc2" />
        </mesh>
      ))}
      <mesh position={[0, ALTURA, 0]} castShadow>
        <boxGeometry args={[VAO + 1.2, 0.8, 0.8]} />
        <meshStandardMaterial color={cor} emissive={cor} emissiveIntensity={0.35} />
      </mesh>
      <Html position={[0, ALTURA + 1.1, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
        <span
          aria-hidden
          className="block rounded-lg px-2.5 py-1 text-sm font-bold whitespace-nowrap text-white shadow"
          style={{ background: cor }}
        >
          {rotulo}
        </span>
      </Html>
    </group>
  );
}
