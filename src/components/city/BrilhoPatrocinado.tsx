"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { cicloRuntime } from "./ciclo";

const OURO = new THREE.Color("#ffc93a");
const ADITIVO = {
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  toneMapped: false,
} as const;

/** Disco radial suave (centro forte, borda zero): halo no chão. Criado sob demanda (usa o DOM). */
let textura: THREE.CanvasTexture | null = null;
function texturaHalo() {
  if (textura) return textura;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.55)");
  g.addColorStop(0.7, "rgba(255,255,255,0.15)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  return textura;
}

const HALO = new THREE.MeshBasicMaterial({ ...ADITIVO, color: OURO });
const ANEL = new THREE.MeshBasicMaterial({ ...ADITIVO, color: OURO, side: THREE.DoubleSide });
/** Feixe vertical: forte na base, some no alto. */
const FEIXE = new THREE.ShaderMaterial({
  ...ADITIVO,
  side: THREE.DoubleSide,
  uniforms: { uCor: { value: OURO }, uForca: { value: 1 } },
  vertexShader: /* glsl */ `
    varying float vY;
    void main() {
      vY = uv.y;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 uCor;
    uniform float uForca;
    varying float vY;
    void main() {
      float a = pow(1.0 - vY, 1.6) * uForca;
      gl_FragColor = vec4(uCor * a, a);
    }`,
});

export type PontoBrilho = { x: number; y: number; z: number };

/**
 * Destaque patrocinado (spec 009): feixe de luz dourado subindo do prédio, halo pulsante
 * no chão e uma onda que se expande. Mais forte à noite, mas sempre visível de dia.
 */
export function BrilhoPatrocinado({
  pontos,
  raio,
  altura,
}: {
  pontos: readonly PontoBrilho[];
  /** Raio do halo no chão (o feixe tem ~1/4 disso). */
  raio: number;
  altura: number;
}) {
  const geometrias = useMemo(
    () => ({
      // CylinderGeometry: uv.y = 0 na base, 1 no topo; base na origem.
      feixe: new THREE.CylinderGeometry(raio * 0.22, raio * 0.32, altura, 24, 1, true).translate(0, altura / 2, 0),
      halo: new THREE.PlaneGeometry(raio * 2, raio * 2).rotateX(-Math.PI / 2),
      anel: new THREE.RingGeometry(raio * 0.9, raio, 64).rotateX(-Math.PI / 2),
    }),
    [raio, altura],
  );
  useEffect(
    () => () => Object.values(geometrias).forEach((g) => g.dispose()),
    [geometrias],
  );
  const ondas = useMemo(() => pontos.map(() => new THREE.Object3D()), [pontos]);

  useFrame(({ clock }) => {
    if (!HALO.map) {
      HALO.map = texturaHalo();
      HALO.needsUpdate = true;
    }
    const t = clock.elapsedTime;
    const pulso = 0.5 + 0.5 * Math.sin(t * 2.4);
    const noite = cicloRuntime.luzes;
    HALO.opacity = 0.55 + 0.3 * pulso + 0.15 * noite;
    FEIXE.uniforms.uForca.value = 0.35 + 0.15 * pulso + 0.4 * noite;
    // Onda que se expande e recomeça, saindo do prédio.
    const k = (t * 0.5) % 1;
    ANEL.opacity = (1 - k) * 0.9;
    for (const o of ondas) o.scale.setScalar(0.45 + k * 0.6);
  });

  return (
    <>
      {pontos.map((p, i) => (
        <group key={i} position={[p.x, p.y, p.z]}>
          <mesh geometry={geometrias.feixe} material={FEIXE} renderOrder={4} />
          <mesh geometry={geometrias.halo} material={HALO} position-y={raio * 0.01} renderOrder={3} />
          <primitive object={ondas[i]} position-y={raio * 0.015}>
            <mesh geometry={geometrias.anel} material={ANEL} renderOrder={3} />
          </primitive>
        </group>
      ))}
    </>
  );
}
