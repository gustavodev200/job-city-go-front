"use client";

import { Canvas } from "@react-three/fiber";
import { useSyncExternalStore } from "react";
import * as THREE from "three";
import { Buildings } from "./Buildings";
import { DayNight } from "./DayNight";
import { Outdoors } from "./Outdoors";
import { Player } from "./Player";
import { Roads } from "./Roads";
import { Terrain } from "./Terrain";
import { Trees } from "./Trees";

/** Narrow screens and touch-first devices (phones, also in landscape). */
const NARROW_QUERY = "(max-width: 768px), (pointer: coarse)";

function subscribeNarrow(onChange: () => void) {
  const media = window.matchMedia(NARROW_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** Celulares e telas estreitas desligam sombras (desempenho). */
function useIsNarrow() {
  return useSyncExternalStore(
    subscribeNarrow,
    () => window.matchMedia(NARROW_QUERY).matches,
    () => false,
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
      {/* Point lights only on desktop: each one costs every lit material in the scene. */}
      <DayNight shadows={!narrow} pointLights={!narrow} />
      <Terrain />
      <Roads />
      <Buildings />
      <Trees />
      <Outdoors lights={!narrow} />
      <Player />
    </Canvas>
  );
}
