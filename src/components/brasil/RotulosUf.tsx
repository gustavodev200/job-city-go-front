"use client";

import { Html } from "@react-three/drei";
import { UFS } from "@/data/brasil/estados";
import { AGREGADO_UF } from "@/lib/brasil/agregados";
import { ALTURA_DEGRAU, UF_GEO } from "@/lib/brasil/geo";
import { useIsNarrow } from "@/lib/movimento";
import { useMapaStore } from "@/stores/mapa";

/** Rótulos "UF · N". Decorativos: a versão acessível é a lista de estados. */
export function RotulosUf() {
  const ufEmFoco = useMapaStore((s) => s.ufEmFoco);
  const narrow = useIsNarrow();
  return (
    <>
      {UFS.map((uf) => {
        const [x, z] = UF_GEO[uf].rotulo;
        const foco = uf === ufEmFoco;
        return (
          <Html
            key={uf}
            position={[x, ALTURA_DEGRAU * 7, z]}
            center
            zIndexRange={[10, 0]}
            style={{ pointerEvents: "none" }}
          >
            <span
              aria-hidden
              className={`block whitespace-nowrap rounded-full font-semibold ${narrow ? "px-1.5 text-[10px]" : "px-2 py-0.5 text-[13px]"} tabular-nums shadow-sm transition-colors ${
                foco ? "bg-amber-300 text-stone-900" : "bg-stone-900/65 text-amber-50"
              }`}
            >
              {uf} · {AGREGADO_UF[uf].abertas}
            </span>
          </Html>
        );
      })}
    </>
  );
}
