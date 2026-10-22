"use client";

import { Html } from "@react-three/drei";
import { useMemo } from "react";
import type { Saida } from "@/lib/cidade/mundo";
import type { Instance, Part } from "./facades";
import { InstancedParts } from "./Instanced";
import { useMundo } from "./mundo";

const ASFALTO_Y = 0.045;
const ASFALTO = "#6f7479";
const VERDE_PLACA = "#1f7a4a";
/** Distância da borda da cidade até a placa de destino. */
const PLACA_A = 6;
const ALTURA_PORTICO = 6;

// Traço central ao longo de x (rotY gira para as estradas norte/sul).
const TRACO_BRANCO: Part[] = [{ shape: "box", size: [2.4, 0.02, 0.22], pos: [0, ASFALTO_Y + 0.01, 0], color: "#f4f1e8" }];
const TRACO_AMARELO: Part[] = [{ shape: "box", size: [2.4, 0.02, 0.24], pos: [0, ASFALTO_Y + 0.01, 0], color: "#f2c230" }];

/** Ponto a `d` unidades da borda urbana ao longo da estrada, mais deslocamento lateral `l`. */
function aoLongo(s: Saida, d: number, l = 0) {
  const len = Math.hypot(s.x1 - s.x0, s.z1 - s.z0);
  const ux = (s.x1 - s.x0) / len;
  const uz = (s.z1 - s.z0) / len;
  return { x: s.x0 + ux * d - uz * l, z: s.z0 + uz * d + ux * l };
}

const comprimento = (s: Saida) => Math.hypot(s.x1 - s.x0, s.z1 - s.z0);
const aoLongoDeX = (s: Saida) => s.lado === "oeste";

function Estrada({ saida }: { saida: Saida }) {
  const len = comprimento(saida);
  const cx = (saida.x0 + saida.x1) / 2;
  const cz = (saida.z0 + saida.z1) / 2;
  const [w, d] = aoLongoDeX(saida) ? [len + 0.5, saida.largura] : [saida.largura, len + 0.5];
  // Placa voltada para quem sai da cidade; pórtico no fim, de frente para a cidade.
  const placa = aoLongo(saida, PLACA_A, saida.largura / 2 + 1.4);
  const fim = aoLongo(saida, len - 3);
  const rotY = aoLongoDeX(saida) ? Math.PI / 2 : 0;

  return (
    <group>
      <mesh position={[cx, ASFALTO_Y, cz]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={ASFALTO} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      {/* Faixas brancas das bordas. */}
      {[-1, 1].map((lado) => {
        const p = aoLongo(saida, len / 2, lado * (saida.largura / 2 - 0.35));
        return (
          <mesh key={lado} position={[p.x, ASFALTO_Y + 0.01, p.z]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={aoLongoDeX(saida) ? [len, 0.18] : [0.18, len]} />
            <meshBasicMaterial color="#f4f1e8" polygonOffset polygonOffsetFactor={-2} />
          </mesh>
        );
      })}

      <group position={[placa.x, 0, placa.z]}>
        {[-0.9, 0.9].map((dx) => (
          <mesh key={dx} position={[dx, 1.4, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.09, 2.8, 8]} />
            <meshStandardMaterial color="#8d949b" />
          </mesh>
        ))}
        <mesh position={[0, 3.2, 0]} castShadow>
          <boxGeometry args={[2.6, 1.1, 0.12]} />
          <meshStandardMaterial color={VERDE_PLACA} />
        </mesh>
        <Html position={[0, 3.2, 0]} center zIndexRange={[4, 0]} style={{ pointerEvents: "none" }}>
          <span
            aria-hidden
            className="block rounded-md border-2 border-white px-2 py-0.5 text-xs font-bold whitespace-nowrap text-white shadow"
            style={{ background: VERDE_PLACA }}
          >
            {saida.destino} – {saida.uf} · {saida.km} km
          </span>
        </Html>
      </group>

      <group position={[fim.x, 0, fim.z]} rotation-y={rotY}>
        {[-1, 1].map((lado) => (
          <mesh key={lado} position={[(lado * (saida.largura + 1)) / 2, ALTURA_PORTICO / 2, 0]} castShadow>
            <boxGeometry args={[0.5, ALTURA_PORTICO, 0.5]} />
            <meshStandardMaterial color="#8d949b" />
          </mesh>
        ))}
        <mesh position={[0, ALTURA_PORTICO, 0]} castShadow>
          <boxGeometry args={[saida.largura + 1.6, 1.3, 0.3]} />
          <meshStandardMaterial color={VERDE_PLACA} emissive={VERDE_PLACA} emissiveIntensity={0.3} />
        </mesh>
        <Html position={[0, ALTURA_PORTICO + 1.3, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
          <span
            aria-hidden
            className="block rounded-lg border-2 border-white px-2.5 py-1 text-sm font-bold whitespace-nowrap text-white shadow"
            style={{ background: VERDE_PLACA }}
          >
            Seguir para {saida.destino} →
          </span>
        </Html>
      </group>
    </group>
  );
}

/** Rodovias e estradas do mapa do Brasil saindo da cidade: andar até o fim leva à vizinha. */
export function Saidas() {
  const { saidas } = useMundo();
  const tracos = useMemo(() => {
    const porTipo: Record<Saida["tipo"], Instance[]> = { rodovia: [], estrada: [] };
    for (const s of saidas) {
      const rotY = aoLongoDeX(s) ? 0 : Math.PI / 2;
      for (let d = 3; d < comprimento(s) - 2; d += 5) porTipo[s.tipo].push({ ...aoLongo(s, d), y: 0, rotY });
    }
    return porTipo;
  }, [saidas]);

  return (
    <>
      {saidas.map((s) => (
        <Estrada key={s.destinoId} saida={s} />
      ))}
      <InstancedParts parts={TRACO_AMARELO} instances={tracos.rodovia} shadows={false} />
      <InstancedParts parts={TRACO_BRANCO} instances={tracos.estrada} shadows={false} />
    </>
  );
}
