"use client";

import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { Uf } from "@/data/brasil/estados";
import { AGREGADO_CIDADE, cidadesDoEstado } from "@/lib/brasil/agregados";
import { celulaDoPonto, topoDaCelula } from "@/lib/brasil/geo";
import { hrefCidade } from "@/lib/brasil/rotas";
import { agruparRotulos, ALTURA_ROTULO, larguraEstimada, type GrupoRotulo } from "@/lib/brasil/rotulos";
import { useMapaStore } from "@/stores/mapa";
import { usePerfilStore } from "@/stores/perfil";
import { mapaRuntime } from "./runtime";

/** Reagrupa no máximo 10 vezes por segundo (research R4). */
const INTERVALO = 0.1;
const ALTURA_SOBRE_CIDADE = 2.2;
const PRIORIDADE_MAXIMA = 1e6;

export function textoRotulo(nome: string, abertas: number) {
  if (abertas === 0) return `${nome} · 0 vagas abertas`;
  return `${nome} · ${abertas} ${abertas === 1 ? "vaga" : "vagas"}`;
}

/**
 * Rótulos "Nome · N vagas" das cidades da UF, sem sobreposição: quem colide na tela
 * entra no grupo de quem já tem lugar ("+K cidades"). Decorativos para leitor de tela —
 * a versão acessível é a lista de cidades.
 */
export function RotulosCidade({ uf, excedente = 0 }: { uf: Uf; excedente?: number }) {
  const camera = useThree((s) => s.camera);
  const tamanho = useThree((s) => s.size);
  const router = useRouter();
  const cidadeEmFoco = useMapaStore((s) => s.cidadeEmFoco);
  const focarCidade = useMapaStore((s) => s.focarCidade);
  const cidadePerfil = usePerfilStore((s) => s.cidadeId);
  const [grupos, setGrupos] = useState<GrupoRotulo[]>([]);
  const relogio = useRef(INTERVALO);
  const assinatura = useRef("");

  const pontos = useMemo(
    () =>
      cidadesDoEstado(uf).map((c) => {
        const cel = celulaDoPonto(c.x, c.z);
        const abertas = AGREGADO_CIDADE.get(c.id)!.abertas;
        return {
          cidade: c,
          abertas,
          texto: textoRotulo(c.nome, abertas),
          posicao: new THREE.Vector3(c.x, (cel ? topoDaCelula(cel.col, cel.lin) : 0) + ALTURA_SOBRE_CIDADE, c.z),
        };
      }),
    [uf],
  );
  const porId = useMemo(() => new Map(pontos.map((p) => [p.cidade.id, p])), [pontos]);

  const _v = useRef(new THREE.Vector3());
  useFrame((_, dt) => {
    relogio.current += dt;
    if (relogio.current < INTERVALO) return;
    relogio.current = 0;
    const visiveis = [];
    for (const p of pontos) {
      const v = _v.current.copy(p.posicao).project(camera);
      if (v.z > 1 || Math.abs(v.x) > 1.2 || Math.abs(v.y) > 1.2) continue;
      const fixa = p.cidade.id === cidadeEmFoco || p.cidade.id === cidadePerfil;
      visiveis.push({
        id: p.cidade.id,
        sx: ((v.x + 1) / 2) * tamanho.width,
        sy: ((1 - v.y) / 2) * tamanho.height,
        largura: larguraEstimada(p.texto) + 70, // folga para o chip "+K cidades"
        altura: ALTURA_ROTULO,
        prioridade: (fixa ? PRIORIDADE_MAXIMA : 0) + p.abertas,
      });
    }
    const novos = agruparRotulos(visiveis);
    const chave = novos.map((g) => g.membros.join(",")).join("|");
    if (chave !== assinatura.current) {
      assinatura.current = chave;
      setGrupos(novos);
    }
  });

  const grupoPorLider = new Map(grupos.map((g) => [g.lider, g]));

  // Um Html fixo por cidade (só escondido quando não lidera grupo): montar e desmontar
  // Html a cada reagrupamento cria e destrói raízes React no meio da renderização.
  return (
    <>
      {pontos.map((p) => {
        const id = p.cidade.id;
        const g = grupoPorLider.get(id);
        const extras = g ? g.membros.length - 1 : 0;
        const foco = id === cidadeEmFoco;
        return (
          <Html key={id} position={p.posicao} center zIndexRange={[12, 0]}>
            <span
              aria-hidden
              data-rotulo-cidade={g ? id : undefined}
              className={`items-center gap-1 whitespace-nowrap ${g ? "flex" : "hidden"}`}
            >
              <button
                type="button"
                tabIndex={-1}
                onClick={() => (foco ? router.push(hrefCidade(id)) : focarCidade(id))}
                className={`rounded-full px-2 py-0.5 text-[12px] font-semibold tabular-nums shadow-sm transition-colors ${
                  foco
                    ? "bg-amber-300 text-stone-900"
                    : p.abertas === 0
                      ? "bg-stone-700/60 text-stone-200"
                      : "bg-stone-900/70 text-amber-50"
                }`}
              >
                {p.texto}
                {foco && excedente > 0 && <span className="ml-1 opacity-75">+{excedente}</span>}
              </button>
              {g && extras > 0 && (
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => {
                    const membros = g.membros.map((m) => porId.get(m)!.cidade);
                    mapaRuntime.enquadrar({
                      minX: Math.min(...membros.map((c) => c.x)),
                      maxX: Math.max(...membros.map((c) => c.x)),
                      minZ: Math.min(...membros.map((c) => c.z)),
                      maxZ: Math.max(...membros.map((c) => c.z)),
                    });
                  }}
                  className="rounded-full bg-white/85 px-1.5 py-0.5 text-[11px] font-semibold text-stone-800 shadow-sm"
                >
                  +{extras} {extras === 1 ? "cidade" : "cidades"}
                </button>
              )}
            </span>
          </Html>
        );
      })}
    </>
  );
}
