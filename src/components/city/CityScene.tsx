"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { useIsNarrow } from "@/lib/movimento";
import { Buildings } from "./Buildings";
import { DayNight } from "./DayNight";
import { useMundo } from "./mundo";
import { Outdoors } from "./Outdoors";
import { Player, type Inicio } from "./Player";
import { Portal } from "./Portal";
import { Roads, postesDoMundo } from "./Roads";
import { Terrain } from "./Terrain";
import { Trees } from "./Trees";

type Props = {
  inicio: Inicio;
  /** Texto do arco da ponte e ação ao atravessá-lo. */
  rotuloPortal: string;
  aoAtravessar: () => void;
};

export default function CityScene({ inicio, rotuloPortal, aoAtravessar }: Props) {
  const narrow = useIsNarrow();
  const mundo = useMundo();
  return (
    <Canvas
      shadows={narrow ? false : "percentage"}
      dpr={[1, narrow ? 1.5 : 2]}
      camera={{ position: [inicio.x, 12, inicio.z + 18], fov: 48, near: 0.3, far: 700 }}
      gl={{ antialias: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1.0 }}
      style={{ touchAction: "none" }}
    >
      {/* Point lights only on desktop: each one costs every lit material in the scene. */}
      <DayNight shadows={!narrow} pointLights={!narrow} postes={postesDoMundo(mundo)} />
      <Terrain />
      <Roads />
      <Buildings />
      <Trees />
      <Outdoors lights={!narrow} />
      <Portal rotulo={rotuloPortal} />
      <Player inicio={inicio} aoAtravessar={aoAtravessar} />
    </Canvas>
  );
}
