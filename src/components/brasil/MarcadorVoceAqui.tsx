"use client";

import { Html } from "@react-three/drei";
import { cidades } from "@/data/brasil/cidades";
import { celulaDoPonto, topoDaCelula } from "@/lib/brasil/geo";
import { usePerfilStore } from "@/stores/perfil";

/** Pino na cidade do perfil. */
export function MarcadorVoceAqui() {
  const cidadeId = usePerfilStore((s) => s.cidadeId);
  const cidade = cidades.find((c) => c.id === cidadeId);
  if (!cidade) return null;
  const cel = celulaDoPonto(cidade.x, cidade.z);
  const base = cel ? topoDaCelula(cel.col, cel.lin) : 0;
  return (
    <group position={[cidade.x, base, cidade.z]}>
      <mesh position-y={1.6}>
        <coneGeometry args={[0.7, 1.8, 12]} />
        <meshStandardMaterial color="#e2483d" emissive="#e2483d" emissiveIntensity={0.4} />
      </mesh>
      <mesh position-y={2.8}>
        <sphereGeometry args={[0.75, 16, 12]} />
        <meshStandardMaterial color="#e2483d" emissive="#e2483d" emissiveIntensity={0.4} />
      </mesh>
      <Html position={[0, 4.4, 0]} center zIndexRange={[11, 0]} style={{ pointerEvents: "none" }}>
        <span className="block whitespace-nowrap rounded-full bg-red-600 px-2 py-0.5 text-[12px] font-semibold text-white shadow">
          Você está aqui · {cidade.nome}
        </span>
      </Html>
    </group>
  );
}
