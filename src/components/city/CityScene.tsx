"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useSyncExternalStore } from "react";
import * as THREE from "three";
import { Buildings } from "./Buildings";
import { Player, playerRuntime } from "./Player";
import { Roads } from "./Roads";
import { Terrain } from "./Terrain";
import { Trees } from "./Trees";

const NARROW_QUERY = "(max-width: 768px)";
const SKY_TOP = "#86c4ea";
const HORIZON = "#dcedf3";

const SHADOW_EXTENT = 50;
const SHADOW_MAP = 2048;
const TEXEL = (SHADOW_EXTENT * 2) / SHADOW_MAP;

function subscribeNarrow(onChange: () => void) {
  const media = window.matchMedia(NARROW_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** Telas estreitas desligam sombras (desempenho em celular). */
function useIsNarrow() {
  return useSyncExternalStore(
    subscribeNarrow,
    () => window.matchMedia(NARROW_QUERY).matches,
    () => false,
  );
}

/** Gradient sky dome that follows the camera (no texture, ignores fog). */
function Sky() {
  const ref = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => {
    const g = new THREE.SphereGeometry(400, 24, 12);
    const top = new THREE.Color(SKY_TOP);
    const horizon = new THREE.Color(HORIZON);
    const color = new THREE.Color();
    const position = g.attributes.position;
    const colors = new Float32Array(position.count * 3);
    for (let i = 0; i < position.count; i++) {
      const t = THREE.MathUtils.clamp(position.getY(i) / 400, 0, 1);
      color.copy(horizon).lerp(top, Math.pow(t, 0.6)).toArray(colors, i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, []);

  useFrame(({ camera }) => ref.current?.position.copy(camera.position));

  return (
    <mesh ref={ref} geometry={geometry} renderOrder={-1}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

/** Sun that follows the player; the shadow box is snapped to texels to avoid shimmering. */
function Sun({ shadows }: { shadows: boolean }) {
  const ref = useRef<THREE.DirectionalLight>(null);
  useFrame(() => {
    const light = ref.current;
    if (!light) return;
    const p = playerRuntime.position;
    const x = Math.round(p.x / TEXEL) * TEXEL;
    const z = Math.round(p.z / TEXEL) * TEXEL;
    light.position.set(x + 35, 70, z + 28);
    light.target.position.set(x, 0, z);
    light.target.updateMatrixWorld();
  });
  return (
    <directionalLight
      ref={ref}
      color="#fff0d6"
      intensity={2.3}
      castShadow={shadows}
      shadow-mapSize={[SHADOW_MAP, SHADOW_MAP]}
      shadow-camera-left={-SHADOW_EXTENT}
      shadow-camera-right={SHADOW_EXTENT}
      shadow-camera-top={SHADOW_EXTENT}
      shadow-camera-bottom={-SHADOW_EXTENT}
      shadow-camera-near={1}
      shadow-camera-far={180}
      shadow-bias={-0.0004}
      shadow-normalBias={0.03}
      shadow-radius={4}
    />
  );
}

export default function CityScene() {
  const narrow = useIsNarrow();
  return (
    <Canvas
      shadows={narrow ? false : "percentage"}
      dpr={[1, narrow ? 1.5 : 2]}
      camera={{ position: [0, 12, 18], fov: 48, near: 0.3, far: 700 }}
      gl={{ antialias: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1.0 }}
      style={{ touchAction: "none" }}
    >
      <color attach="background" args={[HORIZON]} />
      <fog attach="fog" args={[HORIZON, 85, 250]} />
      <Sky />
      <hemisphereLight args={["#eef6ff", "#a7c48c", 1.3]} />
      <Sun shadows={!narrow} />
      <Terrain />
      <Roads />
      <Buildings />
      <Trees />
      <Player />
    </Canvas>
  );
}
