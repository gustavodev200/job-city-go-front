"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { cicloRuntime } from "@/components/city/ciclo";
import type { Uf } from "@/data/brasil/estados";
import type { Cidade } from "@/data/brasil/tipos";
import { criarAleatorio } from "@/lib/aleatorio";
import { agregadoDaCidade, cidadesDoEstado, totalDaCidade } from "@/lib/brasil/agregados";
import { useAgregados } from "@/components/busca/usarBusca";
import { celulaDoPonto, topoDaCelula } from "@/lib/brasil/geo";
import { useMapaStore } from "@/stores/mapa";

/** Arrasto maior que isto (px) é câmera, não clique. */
const ARRASTO_MAXIMO = 6;
const EMISSIVO_DIA = 0.15;
const EMISSIVO_NOITE = 1.6;

const MATERIAL_ACESO = new THREE.MeshStandardMaterial({
  color: "#f6ead2",
  emissive: "#ffc46b",
  emissiveIntensity: EMISSIVO_DIA,
  roughness: 0.7,
  flatShading: true,
});
// Cidade só com vagas encerradas: apagada, mas ainda clicável (US1 cenário 3).
const MATERIAL_APAGADO = new THREE.MeshStandardMaterial({ color: "#8c867c", roughness: 0.9, flatShading: true });
const GEOMETRIA = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);

type Caixa = { cidade: Cidade; matriz: THREE.Matrix4 };

/** Hash simples e estável do id: semente do aglomerado de cada cidade. */
function semente(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Silhuetas de prédios de uma cidade: mais vagas, mais (e mais altos) prédios. */
function caixasDaCidade(cidade: Cidade): Caixa[] {
  const total = totalDaCidade(cidade.id);
  const n = THREE.MathUtils.clamp(Math.round(2 + 1.5 * Math.sqrt(total)), 3, 12);
  const raio = Math.min(0.8, 0.15 + 0.1 * Math.sqrt(total));
  const cel = celulaDoPonto(cidade.x, cidade.z);
  const base = cel ? topoDaCelula(cel.col, cel.lin) : 0;
  const r = criarAleatorio(semente(cidade.id));
  return Array.from({ length: n }, (_, i) => {
    // O primeiro prédio fica no centro e é o mais alto.
    const d = i === 0 ? 0 : raio * Math.sqrt(r.proximo());
    const a = r.proximo() * Math.PI * 2;
    const largura = 0.24 + r.proximo() * 0.16;
    const altura = (i === 0 ? 1 : 0.35 + r.proximo() * 0.6) * (0.6 + 0.25 * Math.sqrt(total));
    const matriz = new THREE.Matrix4()
      .makeScale(largura, altura, largura)
      .setPosition(cidade.x + d * Math.cos(a), base, cidade.z + d * Math.sin(a));
    return { cidade, matriz };
  });
}

const ESCONDIDA = new THREE.Matrix4().makeScale(0, 0, 0);

function Camada({
  caixas,
  material,
  ocultar,
}: {
  caixas: Caixa[];
  material: THREE.Material;
  ocultar?: ReadonlySet<string>;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const focarCidade = useMapaStore((s) => s.focarCidade);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    caixas.forEach((c, i) => mesh.setMatrixAt(i, ocultar?.has(c.cidade.id) ? ESCONDIDA : c.matriz));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [caixas, ocultar]);

  if (caixas.length === 0) return null;
  const cidadeDe = (e: ThreeEvent<MouseEvent>) => (e.instanceId === undefined ? null : caixas[e.instanceId].cidade);
  return (
    <instancedMesh
      ref={ref}
      args={[GEOMETRIA, material, caixas.length]}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
      onClick={(e) => {
        if (e.delta > ARRASTO_MAXIMO) return;
        e.stopPropagation();
        const cidade = cidadeDe(e);
        if (cidade) focarCidade(cidade.id);
      }}
    />
  );
}

/** Cidades da UF com vaga, vistas de longe: um aglomerado de silhuetas por cidade. */
export function Aglomerados({ uf, ocultar }: { uf: Uf; ocultar?: ReadonlySet<string> }) {
  // Cidade sem vaga aberta no filtro fica apagada (spec 004, FR-005).
  const { porCidade } = useAgregados();
  const [acesas, apagadas] = useMemo(() => {
    const lista = cidadesDoEstado(uf);
    const aberta = (c: Cidade) => agregadoDaCidade(porCidade, c.id).abertas > 0;
    return [lista.filter(aberta).flatMap(caixasDaCidade), lista.filter((c) => !aberta(c)).flatMap(caixasDaCidade)];
  }, [uf, porCidade]);

  useFrame(() => {
    MATERIAL_ACESO.emissiveIntensity = THREE.MathUtils.lerp(EMISSIVO_DIA, EMISSIVO_NOITE, cicloRuntime.luzes);
  });

  return (
    <>
      <Camada key={`${uf}-a`} caixas={acesas} material={MATERIAL_ACESO} ocultar={ocultar} />
      <Camada key={`${uf}-b`} caixas={apagadas} material={MATERIAL_APAGADO} ocultar={ocultar} />
    </>
  );
}
