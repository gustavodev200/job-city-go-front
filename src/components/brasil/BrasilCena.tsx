"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { DayNight } from "@/components/city/DayNight";
import { useIsNarrow } from "@/lib/movimento";
import { useMapaStore } from "@/stores/mapa";
import { Bordas } from "./Bordas";
import { CameraMapa } from "./CameraMapa";
import { IlhaRemota } from "./IlhaRemota";
import { MarcadorVoceAqui } from "./MarcadorVoceAqui";
import { Mar } from "./Mar";
import { Relevo } from "./Relevo";
import { RotulosUf } from "./RotulosUf";
import { mapaRuntime } from "./runtime";
import { TorresVagas } from "./TorresVagas";

const focoDaCamera = () => mapaRuntime.alvo;

export default function BrasilCena({ onContextoPerdido }: { onContextoPerdido: () => void }) {
  const narrow = useIsNarrow();
  const modo = useMapaStore((s) => s.modo);
  return (
    <Canvas
      dpr={[1, narrow ? 1.5 : 2]}
      camera={{ position: [0, 150, 180], fov: 40, near: 1, far: 3000 }}
      gl={{ antialias: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1.0 }}
      style={{ touchAction: "none" }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", onContextoPerdido);
      }}
    >
      {/* Sem sombras nem luzes pontuais no país inteiro: custo alto, ganho baixo. */}
      <DayNight shadows={false} pointLights={false} cidade={false} foco={focoDaCamera} raioCeu={1200} neblina={[700, 2200]} />
      <Mar />
      <Relevo />
      <Bordas />
      {modo === "luzes" && <TorresVagas />}
      <IlhaRemota />
      <RotulosUf />
      <MarcadorVoceAqui />
      <CameraMapa />
    </Canvas>
  );
}
