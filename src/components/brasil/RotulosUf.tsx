"use client";

import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { estados, UFS, type Uf } from "@/data/brasil/estados";
import { AGREGADO_UF } from "@/lib/brasil/agregados";
import { ALTURA_DEGRAU, UF_GEO } from "@/lib/brasil/geo";
import { useUfDaRota } from "@/lib/brasil/navegacao";
import { ALTURA_ROTULO, larguraEstimada } from "@/lib/brasil/rotulos";
import { useIsNarrow } from "@/lib/movimento";
import { useMapaStore } from "@/stores/mapa";

/** Reavalia o espaço na tela no máximo 10 vezes por segundo. */
const INTERVALO = 0.1;
const MARGEM = 3;

type Retangulo = { x: number; y: number; w: number; h: number };
const cruzam = (a: Retangulo, b: Retangulo) =>
  Math.abs(a.x - b.x) * 2 < a.w + b.w + 2 * MARGEM && Math.abs(a.y - b.y) * 2 < a.h + b.h + 2 * MARGEM;

/**
 * Rótulos "Goiás · 24": nome completo do estado quando cabe; se colide com um vizinho
 * (Nordeste, DF), cai para a sigla. Decorativos: a versão acessível é a lista de estados.
 */
export function RotulosUf() {
  const ufEmFoco = useMapaStore((s) => s.ufEmFoco);
  const narrow = useIsNarrow();
  const camera = useThree((s) => s.camera);
  const tamanho = useThree((s) => s.size);
  // No nível Estado, a UF aberta mostra os rótulos das cidades no lugar do dela.
  const ufDaRota = useUfDaRota();
  const [curtos, setCurtos] = useState<ReadonlySet<Uf>>(new Set(UFS));
  const relogio = useRef(INTERVALO);
  const assinatura = useRef("");

  const pontos = useMemo(
    () =>
      UFS.filter((uf) => uf !== ufDaRota)
        .map((uf) => {
          const [x, z] = UF_GEO[uf].rotulo;
          const n = AGREGADO_UF[uf].abertas;
          return {
            uf,
            n,
            posicao: new THREE.Vector3(x, ALTURA_DEGRAU * 7, z),
            completo: `${estados[uf].nome} · ${n}`,
            curto: `${uf} · ${n}`,
          };
        })
        // Mais vagas primeiro: estados grandes de mercado ficam com o nome inteiro.
        .sort((a, b) => b.n - a.n),
    [ufDaRota],
  );

  const _v = useRef(new THREE.Vector3());
  useFrame((_, dt) => {
    relogio.current += dt;
    if (relogio.current < INTERVALO) return;
    relogio.current = 0;
    const escala = narrow ? 0.8 : 1;
    const altura = ALTURA_ROTULO * escala;
    const pos = pontos.map((p) => {
      const v = _v.current.copy(p.posicao).project(camera);
      return { x: ((v.x + 1) / 2) * tamanho.width, y: ((1 - v.y) / 2) * tamanho.height };
    });
    // Primeiro reserva o lugar mínimo (sigla) de todos; depois tenta ampliar para o nome.
    const ocupados: Retangulo[] = pontos.map((p, i) => ({ ...pos[i], w: larguraEstimada(p.curto) * escala, h: altura }));
    const novos = new Set<Uf>();
    pontos.forEach((p, i) => {
      const completo = { ...pos[i], w: larguraEstimada(p.completo) * escala, h: altura };
      const colide = ocupados.some((r, j) => j !== i && cruzam(completo, r));
      if (colide) novos.add(p.uf);
      else ocupados[i] = completo;
    });
    const chave = [...novos].sort().join(",");
    if (chave !== assinatura.current) {
      assinatura.current = chave;
      setCurtos(novos);
    }
  });

  return (
    <>
      {pontos.map((p) => {
        const foco = p.uf === ufEmFoco;
        return (
          <Html key={p.uf} position={p.posicao} center zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
            <span
              aria-hidden
              className={`block whitespace-nowrap rounded-full font-semibold ${narrow ? "px-1.5 text-[10px]" : "px-2 py-0.5 text-[13px]"} tabular-nums shadow-sm transition-colors ${
                foco ? "bg-amber-300 text-stone-900" : "bg-stone-900/65 text-amber-50"
              }`}
            >
              {curtos.has(p.uf) && !foco ? p.curto : p.completo}
            </span>
          </Html>
        );
      })}
    </>
  );
}
