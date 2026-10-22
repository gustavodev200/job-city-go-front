"use client";

import Link from "next/link";
import { estados, UFS } from "@/data/brasil/estados";
import { AGREGADO_UF, CORES_CALOR, faixaCalor } from "@/lib/brasil/agregados";
import { CAIXA_BRASIL, CORES_BIOMA, UF_GEO } from "@/lib/brasil/geo";
import { useUfDaRota } from "@/lib/brasil/navegacao";
import { hrefEstado } from "@/lib/brasil/rotas";
import { useMapaStore } from "@/stores/mapa";

const MARGEM = 4;

const caminho = (aneis: [number, number][][]) =>
  aneis.map((anel) => `M${anel.map(([x, z]) => `${x},${z}`).join("L")}Z`).join("");

/** Fallback sem WebGL: mesmos estados, contagens e links, em SVG. */
export function BrasilPlano() {
  const modo = useMapaStore((s) => s.modo);
  const ufEmFoco = useMapaStore((s) => s.ufEmFoco);
  const focar = useMapaStore((s) => s.focar);
  const ufDaRota = useUfDaRota();
  const { minX, minZ, maxX, maxZ } = CAIXA_BRASIL;
  const viewBox = `${minX - MARGEM} ${minZ - MARGEM} ${maxX - minX + 2 * MARGEM} ${maxZ - minZ + 2 * MARGEM}`;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-sky-200 p-4">
      <svg viewBox={viewBox} className="h-full w-full max-w-3xl" role="group" aria-label="Mapa do Brasil">
        {UFS.map((uf) => {
          const cor = modo === "calor" ? CORES_CALOR[faixaCalor(uf)] : CORES_BIOMA[estados[uf].bioma];
          const [x, z] = UF_GEO[uf].rotulo;
          const apagado = ufDaRota !== null && ufDaRota !== uf;
          return (
            <Link
              key={uf}
              href={hrefEstado(uf)}
              aria-label={`${estados[uf].nome}, ${AGREGADO_UF[uf].abertas} vagas abertas`}
              // No toque o link navega direto; hover (resumo) só com mouse.
              onPointerEnter={(e) => e.pointerType === "mouse" && focar(uf)}
              // Só foco de teclado: o foco do toque abriria o resumo por cima do próprio link.
              onFocus={(e) => e.currentTarget.matches(":focus-visible") && focar(uf)}
              className="outline-none [&:focus-visible>path]:stroke-amber-400 [&:focus-visible>path]:stroke-[0.8]"
            >
              <path
                d={caminho(UF_GEO[uf].contorno)}
                fill={cor}
                fillRule="evenodd"
                opacity={apagado ? 0.5 : 1}
                stroke="#fff8e6"
                strokeWidth={uf === ufEmFoco ? 0.7 : 0.3}
              />
              <text x={x} y={z} textAnchor="middle" dominantBaseline="middle" fontSize={3.2} fontWeight={700} fill="#1c1917">
                {uf} · {AGREGADO_UF[uf].abertas}
              </text>
            </Link>
          );
        })}
      </svg>
    </div>
  );
}
