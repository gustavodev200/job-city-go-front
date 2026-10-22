"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useIdsNoFiltro } from "@/components/busca/usarBusca";
import { ORDEM_CATEGORIAS, type Categoria } from "@/data/vagas";
import { N_CORES_CARRO, destaqueAtivo, facadeDaVaga, type Lote, type Mundo, type Rect, type VagaSpot } from "@/lib/cidade/mundo";
import { useGameStore } from "@/stores/game";
import { BrilhoPatrocinado } from "./BrilhoPatrocinado";
import { cicloRuntime } from "./ciclo";
import { MODELO_COLORS } from "./cores";
import { FACADES, FILLER_HOUSES, PLACA_ENCERRADA, REMOTE_HOUSE, TORRE_PATROCINADA, car, type Instance } from "./facades";
import { InstancedParts } from "./Instanced";
import { useMundo } from "./mundo";

const CLOSED_COLOR = "#8a8f96";
/** Vaga patrocinada (FR-011): torre própria, marcador dourado 2,4× maior, feixe de luz e etiqueta. */
const SPONSORED_COLOR = "#f2c230";
const SPONSORED_SCALE = 2.4;
/** Feixe do patrocinado: visível de qualquer ponto da cidade. */
const FEIXE_ALTURA = 160;
const HALO_RAIO = 14;
const CAR_COLORS = ["#e8743b", "#5aa0c8", "#f2efe6"] as const;

const CAR_PARTS = CAR_COLORS.slice(0, N_CORES_CARRO).map(car);
// Stable arrays: InstancedParts caches merged geometry per parts array.
const BADGE_PARTS = Object.fromEntries(ORDEM_CATEGORIAS.map((cat) => [cat, [FACADES[cat].badge]])) as Record<
  Categoria,
  [(typeof FACADES)[Categoria]["badge"]]
>;

/** Instâncias das construções do mundo, por tipo (uma chamada de desenho por tipo). */
function construcoes(mundo: Mundo, noFiltro: ReadonlySet<string>) {
  // Fora do filtro da busca (spec 004): apagado e esmaecido, como uma vaga encerrada.
  const instancia = (l: Lote): Instance => ({
    x: l.x,
    y: l.y,
    z: l.z,
    lit: l.vaga.status === "aberta" && noFiltro.has(l.vaga.id),
    dim: l.vaga.status === "encerrada" || !noFiltro.has(l.vaga.id),
  });
  // Patrocinadas viram a torre dourada (fora das listas por categoria).
  const comuns = mundo.lotes.filter((l) => !destaqueAtivo(l.vaga));
  const daCidade = comuns.filter((l) => l.vaga.modelo !== "remoto");
  const porCategoria = (lista: Lote[]) =>
    Object.fromEntries(
      ORDEM_CATEGORIAS.map((cat) => [
        cat,
        lista.filter((l) => l.vaga.modelo !== "remoto" && l.vaga.categoria === cat).map(instancia),
      ]),
    ) as Record<Categoria, Instance[]>;
  return {
    porCategoria: porCategoria(daCidade),
    hibridas: porCategoria(daCidade.filter((l) => l.vaga.modelo === "hibrido" && noFiltro.has(l.vaga.id))),
    remotas: comuns.filter((l) => l.vaga.modelo === "remoto").map(instancia),
    torres: mundo.lotes.filter((l) => destaqueAtivo(l.vaga)).map(instancia),
    casas: FILLER_HOUSES.map((_, v) =>
      mundo.casas.filter((c) => c.variante === v).map((c) => ({ x: c.x, y: mundo.alturaDoPasso(c.x, c.z), z: c.z })),
    ),
    carros: CAR_PARTS.map((_, cor) =>
      mundo.carros.filter((c) => c.cor === cor).map((c) => ({ x: c.x, y: mundo.alturaDoPasso(c.x, c.z), z: c.z, rotY: c.rotY })),
    ),
    // Placa "Encerrada" na frente do prédio (+z), no canto do lote.
    encerradas: mundo.lotes
      .filter((l) => l.vaga.status === "encerrada")
      .map((l) => {
        const fundo = facadeDaVaga(l.vaga).footprint[1];
        return { x: l.x - 3, y: l.y, z: l.z + Math.min(fundo / 2 + 0.6, 6) };
      }),
  };
}

/** Soft radial blob texture used as fake ambient occlusion under buildings and cars. */
function blobTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(64, 64, 10, 64, 64, 64);
  gradient.addColorStop(0, "rgba(40,45,35,0.55)");
  gradient.addColorStop(0.6, "rgba(40,45,35,0.3)");
  gradient.addColorStop(1, "rgba(40,45,35,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Contact shadows: grounds every building even when real shadows are off (narrow screens). */
function ContactShadows({ colliders }: { colliders: readonly Rect[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: blobTexture(),
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
      }),
    [],
  );

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const d = new THREE.Object3D();
    colliders.forEach((c, i) => {
      d.position.set(c.x, c.bottom + 0.03, c.z);
      d.rotation.set(-Math.PI / 2, 0, 0);
      d.scale.set(c.hw * 2 * 1.35 + 1, c.hd * 2 * 1.35 + 1, 1);
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [colliders]);

  return (
    <instancedMesh ref={ref} args={[undefined, material, colliders.length]} renderOrder={1}>
      <planeGeometry args={[1, 1]} />
    </instancedMesh>
  );
}

/** Floating diamond above each job: color by work model, grey when closed; grows when nearby. */
function Markers({ vagaSpots }: { vagaSpots: readonly VagaSpot[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    vagaSpots.forEach((spot, i) => {
      const cor = !spot.aberta ? CLOSED_COLOR : spot.destaque ? SPONSORED_COLOR : MODELO_COLORS[spot.modelo];
      mesh.setColorAt(i, color.set(cor));
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [color, vagaSpots]);

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = clock.elapsedTime;
    // Brighter at night so the diamonds stay readable in the dark.
    if (material.current) material.current.emissiveIntensity = 0.2 + cicloRuntime.luzes * 0.6;
    const nearby = useGameStore.getState().nearbyVagaId;
    vagaSpots.forEach((spot, i) => {
      const s = (spot.id === nearby ? 1.45 : 1) * (spot.destaque ? SPONSORED_SCALE : 1);
      dummy.position.set(spot.x, spot.y + Math.sin(t * 2 + i) * 0.3, spot.z);
      dummy.rotation.set(0, t * 1.2 + i, 0);
      dummy.scale.set(0.9 * s, 1.3 * s, 0.9 * s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, vagaSpots.length]} frustumCulled={false}>
      <octahedronGeometry args={[0.7, 0]} />
      <meshStandardMaterial ref={material} color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} flatShading />
    </instancedMesh>
  );
}

/** Etiqueta "Patrocinado" acima do marcador de toda vaga com destaque ativo. */
function EtiquetasPatrocinado({ vagaSpots }: { vagaSpots: readonly VagaSpot[] }) {
  return (
    <>
      {vagaSpots
        .filter((s) => s.destaque)
        .map((s) => (
          <Html key={s.id} position={[s.x, s.y + 4, s.z]} center zIndexRange={[4, 0]} style={{ pointerEvents: "none" }}>
            <span className="block rounded-full border-2 border-[#fff3c4] bg-gradient-to-b from-[#ffd84a] to-[#e0a51c] px-3 py-1 text-sm font-extrabold tracking-wide whitespace-nowrap text-[#3b2a1a] shadow-[0_0_18px_6px_rgba(255,201,58,0.75)]">
              ★ Patrocinado
            </span>
          </Html>
        ))}
    </>
  );
}

/** Pulsing ground ring around the job building the player is close to. */
function NearbyRing({ vagaSpots }: { vagaSpots: readonly VagaSpot[] }) {
  const nearbyId = useGameStore((s) => s.nearbyVagaId);
  const ref = useRef<THREE.Mesh>(null);
  const spot = vagaSpots.find((s) => s.id === nearbyId);

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh || !spot) return;
    const pulse = 1 + Math.sin(clock.elapsedTime * 3) * 0.03;
    mesh.scale.setScalar((spot.size + 1) * pulse);
    (mesh.material as THREE.MeshBasicMaterial).opacity = 0.55 + Math.sin(clock.elapsedTime * 3) * 0.15;
  });

  if (!spot) return null;
  return (
    <mesh ref={ref} position={[spot.x, spot.baseY + 0.06, spot.z]} rotation-x={-Math.PI / 2} renderOrder={2}>
      <ringGeometry args={[0.93, 1, 64]} />
      <meshBasicMaterial
        color={spot.aberta ? MODELO_COLORS[spot.modelo] : CLOSED_COLOR}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

export function Buildings() {
  const mundo = useMundo();
  const noFiltro = useIdsNoFiltro();
  const c = useMemo(() => construcoes(mundo, noFiltro), [mundo, noFiltro]);
  const visiveis = useMemo(() => mundo.spots.filter((s) => noFiltro.has(s.id)), [mundo, noFiltro]);
  return (
    <>
      {ORDEM_CATEGORIAS.map((cat) => (
        <InstancedParts key={cat} parts={FACADES[cat].parts} instances={c.porCategoria[cat]} />
      ))}
      {ORDEM_CATEGORIAS.map((cat) => (
        <InstancedParts key={`hibrido-${cat}`} parts={BADGE_PARTS[cat]} instances={c.hibridas[cat]} />
      ))}
      {FILLER_HOUSES.map((house, i) => (
        <InstancedParts key={`casa-${i}`} parts={house.parts} instances={c.casas[i]} />
      ))}
      {CAR_PARTS.map((parts, i) => (
        <InstancedParts key={`carro-${i}`} parts={parts} instances={c.carros[i]} />
      ))}
      <InstancedParts parts={REMOTE_HOUSE.parts} instances={c.remotas} />
      <InstancedParts parts={TORRE_PATROCINADA.parts} instances={c.torres} />
      <BrilhoPatrocinado
        pontos={visiveis.filter((s) => s.destaque).map((s) => ({ x: s.x, y: s.baseY, z: s.z }))}
        raio={HALO_RAIO}
        altura={FEIXE_ALTURA}
      />
      <InstancedParts parts={PLACA_ENCERRADA} instances={c.encerradas} shadows={false} />
      <ContactShadows colliders={mundo.colisores} />
      <Markers key={visiveis.length} vagaSpots={visiveis} />
      <EtiquetasPatrocinado vagaSpots={visiveis} />
      <NearbyRing vagaSpots={mundo.spots} />
    </>
  );
}
