"use client";

import { MapControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import type { MapControls as MapControlsImpl } from "three-stdlib";
import { CAIXA_BRASIL, UF_GEO } from "@/lib/brasil/geo";
import { useUfDaRota } from "@/lib/brasil/navegacao";
import { useReducedMotion } from "@/lib/movimento";
import { mapaRuntime } from "./runtime";

const GRAU = Math.PI / 180;
const POLAR_INICIAL = 40 * GRAU;
const DISTANCIA_MINIMA = 18;
/** Amortecimento do voo: ~95% do caminho em ~1 s. */
const VELOCIDADE_VOO = 3;
/** Margem do enquadramento (o estado deixa espaço para o painel lateral). */
const FOLGA_BRASIL = 1.1;
const FOLGA_UF = 1.4;
/** UFs pequenas (DF, SE) não colam a câmera no chão: sempre algum contexto em volta. */
const DISTANCIA_MINIMA_UF = 45;

type Caixa = { minX: number; minZ: number; maxX: number; maxZ: number };

const CAIXA_UF = (uf: keyof typeof UF_GEO): Caixa => {
  const [minX, minZ, maxX, maxZ] = UF_GEO[uf].caixa;
  return { minX, minZ, maxX, maxZ };
};

/** Distância que enquadra a caixa inteira, em retrato ou paisagem. */
function distanciaPara(caixa: Caixa, aspecto: number, fov: number, folga: number) {
  const largura = caixa.maxX - caixa.minX;
  const profundidade = caixa.maxZ - caixa.minZ;
  const tan = Math.tan((fov * GRAU) / 2);
  const vertical = profundidade * Math.cos(POLAR_INICIAL * 0.6);
  // Em retrato a perspectiva inclinada "sobra" nas laterais: aproxima um pouco mais.
  const retrato = aspecto < 1 ? 0.9 : 1;
  return Math.max(DISTANCIA_MINIMA, (Math.max(vertical, (largura / aspecto) * retrato) / (2 * tan)) * folga);
}

const centro = (c: Caixa) => new THREE.Vector3((c.minX + c.maxX) / 2, 0, (c.minZ + c.maxZ) / 2);

export function CameraMapa() {
  const controles = useRef<MapControlsImpl>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const tamanho = useThree((s) => s.size);
  const reduzir = useReducedMotion();
  const uf = useUfDaRota();
  const voo = useRef<{ alvo: THREE.Vector3; distancia: number } | null>(null);
  const primeiro = useRef(true);

  const aspecto = tamanho.width / Math.max(1, tamanho.height);
  const distanciaBrasil = distanciaPara(CAIXA_BRASIL, aspecto, camera.fov, FOLGA_BRASIL);

  // Destino do nível atual; o primeiro enquadramento é imediato.
  useLayoutEffect(() => {
    const caixa = uf ? CAIXA_UF(uf) : CAIXA_BRASIL;
    const destino = { alvo: centro(caixa), distancia: uf
        ? Math.max(DISTANCIA_MINIMA_UF, distanciaPara(caixa, aspecto, camera.fov, FOLGA_UF))
        : distanciaPara(caixa, aspecto, camera.fov, FOLGA_BRASIL),
    };
    mapaRuntime.centralizar = () => {
      voo.current = { alvo: destino.alvo.clone(), distancia: destino.distancia };
    };
    voo.current = destino;
    if (primeiro.current) {
      primeiro.current = false;
      const c = controles.current;
      if (c) {
        c.target.copy(destino.alvo);
        camera.position
          .copy(destino.alvo)
          .add(new THREE.Vector3(0, Math.cos(POLAR_INICIAL), Math.sin(POLAR_INICIAL)).multiplyScalar(destino.distancia));
        c.update();
        voo.current = null;
      }
    }
  }, [uf, aspecto, camera]);

  // Alvo preso à caixa do Brasil: não dá para perder o país de vista.
  useEffect(() => {
    const c = controles.current;
    if (!c) return;
    const prender = () => {
      c.target.x = THREE.MathUtils.clamp(c.target.x, CAIXA_BRASIL.minX, CAIXA_BRASIL.maxX);
      c.target.z = THREE.MathUtils.clamp(c.target.z, CAIXA_BRASIL.minZ, CAIXA_BRASIL.maxZ);
      c.target.y = 0;
    };
    c.addEventListener("change", prender);
    return () => c.removeEventListener("change", prender);
  }, []);

  const _offset = useRef(new THREE.Vector3());
  useFrame((_, dt) => {
    const c = controles.current;
    if (!c) return;
    const v = voo.current;
    if (v) {
      const k = reduzir ? 1 : 1 - Math.exp(-VELOCIDADE_VOO * dt);
      const offset = _offset.current.copy(camera.position).sub(c.target);
      const distancia = THREE.MathUtils.lerp(offset.length(), v.distancia, k);
      c.target.lerp(v.alvo, k);
      camera.position.copy(c.target).add(offset.setLength(distancia));
      c.enabled = false;
      if (c.target.distanceTo(v.alvo) < 0.05 && Math.abs(distancia - v.distancia) < 0.05) {
        voo.current = null;
        c.enabled = true;
      }
      c.update();
    }
    mapaRuntime.alvo.copy(c.target);
  });

  return (
    <MapControls
      ref={controles}
      makeDefault
      enableDamping
      screenSpacePanning={false}
      minPolarAngle={25 * GRAU}
      maxPolarAngle={65 * GRAU}
      minAzimuthAngle={-30 * GRAU}
      maxAzimuthAngle={30 * GRAU}
      minDistance={DISTANCIA_MINIMA}
      maxDistance={distanciaBrasil * 1.4}
    />
  );
}
