"use client";

import { Line } from "@react-three/drei";
import { useMemo } from "react";
import { celulaDoPonto, topoDaCelula } from "@/lib/brasil/geo";
import { useUfDaRota } from "@/lib/brasil/navegacao";
import { cidadePorId } from "@/lib/brasil/rotas";
import { anelDoRaio } from "@/lib/busca/perto";
import { useFiltrosStore } from "@/stores/filtros";

const COR = "#d06f22";
/** Acima do relevo, para o anel não afundar nos morros. */
const FOLGA_Y = 0.35;

/** Pontos do anel do "Perto de mim" no nível Estado (research R12); null fora dele. */
function useAnel() {
  const perto = useFiltrosStore((s) => s.perto);
  const uf = useUfDaRota();
  return useMemo(() => {
    const ref = perto ? cidadePorId.get(perto.cidadeId) : undefined;
    if (!uf || !perto || !ref) return null;
    return anelDoRaio(ref, perto.raioKm);
  }, [perto, uf]);
}

/** Anel do raio sobre o relevo (cena 3D). */
export function AnelRaio() {
  const anel = useAnel();
  const pontos = useMemo(
    () =>
      anel?.map(({ x, z }) => {
        const cel = celulaDoPonto(x, z);
        return [x, (cel ? topoDaCelula(cel.col, cel.lin) : 0) + FOLGA_Y, z] as [number, number, number];
      }),
    [anel],
  );
  if (!pontos) return null;
  return <Line points={pontos} color={COR} lineWidth={3} dashed={false} />;
}

/** Mesmo anel no mapa plano (SVG, sem WebGL). */
export function AnelRaioSvg() {
  const anel = useAnel();
  if (!anel) return null;
  return (
    <polygon
      points={anel.map((p) => `${p.x},${p.z}`).join(" ")}
      fill={COR}
      fillOpacity={0.08}
      stroke={COR}
      strokeWidth={0.5}
      pointerEvents="none"
    />
  );
}
