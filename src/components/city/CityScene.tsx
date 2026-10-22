"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import type { Area } from "@/data/mapa";
import { useIsNarrow } from "@/lib/movimento";
import { Buildings } from "./Buildings";
import { DayNight } from "./DayNight";
import { Outdoors } from "./Outdoors";
import { Player } from "./Player";
import { Roads } from "./Roads";
import { Terrain } from "./Terrain";
import { Trees } from "./Trees";

export default function CityScene({ areaInicial }: { areaInicial?: Area }) {
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
      <Player areaInicial={areaInicial} />
    </Canvas>
  );
}
