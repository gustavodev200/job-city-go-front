"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Modelo } from "@/data/vagas";
import { useGameStore } from "@/stores/game";
import { FACADES, FILLER_HOUSES, REMOTE_HOUSE, car } from "./facades";
import { InstancedParts } from "./Instanced";
import {
  CAR_COLORS,
  CATEGORIAS,
  carInstances,
  cityInstances,
  colliders,
  fillerInstances,
  houseInstances,
  hybridBadgeInstances,
  vagaSpots,
} from "./layout";

export const MODELO_COLORS: Record<Modelo, string> = {
  presencial: "#f08a24",
  hibrido: "#7b5cff",
  remoto: "#1d9f95",
};
const CLOSED_COLOR = "#8a8f96";

const CAR_PARTS = CAR_COLORS.map(car);
// Stable arrays: InstancedParts caches merged geometry per parts array.
const BADGE_PARTS = Object.fromEntries(CATEGORIAS.map((cat) => [cat, [FACADES[cat].badge]]));

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
function ContactShadows() {
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
  }, []);

  return (
    <instancedMesh ref={ref} args={[undefined, material, colliders.length]} renderOrder={1}>
      <planeGeometry args={[1, 1]} />
    </instancedMesh>
  );
}

/** Floating diamond above each job: color by work model, grey when closed; grows when nearby. */
function Markers() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    vagaSpots.forEach((spot, i) => {
      mesh.setColorAt(i, color.set(spot.aberta ? MODELO_COLORS[spot.modelo] : CLOSED_COLOR));
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [color]);

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = clock.elapsedTime;
    const nearby = useGameStore.getState().nearbyVagaId;
    vagaSpots.forEach((spot, i) => {
      const s = spot.id === nearby ? 1.45 : 1;
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
      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} flatShading />
    </instancedMesh>
  );
}

/** Pulsing ground ring around the job building the player is close to. */
function NearbyRing() {
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
  return (
    <>
      {CATEGORIAS.map((cat) => (
        <InstancedParts key={cat} parts={FACADES[cat].parts} instances={cityInstances[cat]} />
      ))}
      {CATEGORIAS.map((cat) => (
        <InstancedParts key={`hibrido-${cat}`} parts={BADGE_PARTS[cat]} instances={hybridBadgeInstances[cat]} />
      ))}
      {FILLER_HOUSES.map((house, i) => (
        <InstancedParts key={`casa-${i}`} parts={house.parts} instances={fillerInstances[i]} />
      ))}
      {CAR_PARTS.map((parts, i) => (
        <InstancedParts key={`carro-${i}`} parts={parts} instances={carInstances[i]} />
      ))}
      <InstancedParts parts={REMOTE_HOUSE.parts} instances={houseInstances} />
      <ContactShadows />
      <Markers />
      <NearbyRing />
    </>
  );
}
