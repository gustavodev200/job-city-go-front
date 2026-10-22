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
 * Rótulos "Goiás · 24 vagas": nome completo do estado quando cabe; se colide com um vizinho
 * (Nordeste, DF), cai para "GO · 24 vagas" e, se ainda colidir, para "GO · 24". Decorativos: a versão acessível é a lista de estados.
 */
export function RotulosUf() {
  const ufEmFoco = useMapaStore((s) => s.ufEmFoco);
  const narrow = useIsNarrow();
  const camera = useThree((s) => s.camera);
  const tamanho = useThree((s) => s.size);
  // No nível Estado, a UF aberta mostra os rótulos das cidades no lugar do dela.
  const ufDaRota = useUfDaRota();
  /** Índice do texto usado por UF (0 = nome completo); começa no mais curto. */
  const [niveis, setNiveis] = useState<Partial<Record<Uf, number>>>({});
  const relogio = useRef(INTERVALO);
  const assinatura = useRef("");

  const pontos = useMemo(
    () =>
      UFS.filter((uf) => uf !== ufDaRota)
        .map((uf) => {
          const [x, z] = UF_GEO[uf].rotulo;
          const n = AGREGADO_UF[uf].abertas;
          const vagas = `${n} ${n === 1 ? "vaga" : "vagas"}`;
          return {
            uf,
            n,
            posicao: new THREE.Vector3(x, ALTURA_DEGRAU * 7, z),
            // Do mais longo ao mais curto; usa o maior que couber sem encostar no vizinho.
            textos: [`${estados[uf].nome} · ${vagas}`, `${uf} · ${vagas}`, `${uf} · ${n}`],
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
    // Primeiro reserva o lugar mínimo de todos; depois tenta ampliar, do texto mais longo ao mais curto.
    const ultimo = (p: (typeof pontos)[number]) => p.textos.length - 1;
    const ocupados: Retangulo[] = pontos.map((p, i) => ({ ...pos[i], w: larguraEstimada(p.textos[ultimo(p)]) * escala, h: altura }));
    const novos: Partial<Record<Uf, number>> = {};
    pontos.forEach((p, i) => {
      novos[p.uf] = ultimo(p);
      for (let nivel = 0; nivel < ultimo(p); nivel++) {
        const r = { ...pos[i], w: larguraEstimada(p.textos[nivel]) * escala, h: altura };
        if (!ocupados.some((o, j) => j !== i && cruzam(r, o))) {
          ocupados[i] = r;
          novos[p.uf] = nivel;
          break;
        }
      }
    });
    const chave = pontos.map((p) => novos[p.uf]).join(",");
    if (chave !== assinatura.current) {
      assinatura.current = chave;
      setNiveis(novos);
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
              {foco ? p.textos[0] : p.textos[niveis[p.uf] ?? p.textos.length - 1]}
            </span>
          </Html>
        );
      })}
    </>
  );
}
