"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { DayNight } from "@/components/city/DayNight";
import { cidades } from "@/data/brasil/cidades";
import { useUfDaRota } from "@/lib/brasil/navegacao";
import { cidadePorId } from "@/lib/brasil/rotas";
import { useIsNarrow } from "@/lib/movimento";
import { useMapaStore } from "@/stores/mapa";
import { ArvoresMapa } from "./ArvoresMapa";
import { AnelRaio } from "./AnelRaio";
import { Bordas } from "./Bordas";
import { CameraMapa } from "./CameraMapa";
import { Estradas } from "./Estradas";
import { IlhaRemota } from "./IlhaRemota";
import { MarcadorVoceAqui } from "./MarcadorVoceAqui";
import { Mar } from "./Mar";
import { PreviasDasCidades, usePrevia } from "./PreviaCidade";
import { Relevo } from "./Relevo";
import { RotulosCidade } from "./RotulosCidade";
import { RotulosUf } from "./RotulosUf";
import { mapaRuntime } from "./runtime";

const focoDaCamera = () => mapaRuntime.alvo;

/** Toda cidade do país mostra suas construções reais; no nível Estado entram anel e rótulos. */
function CamadaCidades() {
  const uf = useUfDaRota();
  const cidadeEmFoco = useMapaStore((s) => s.cidadeEmFoco);
  const cidade = cidadeEmFoco ? cidadePorId.get(cidadeEmFoco) : undefined;
  const previa = usePrevia(cidade && cidade.uf === uf ? cidade : undefined);

  return (
    <>
      <PreviasDasCidades cidades={cidades} uf={uf} />
      {uf && (
        <>
          <AnelRaio />
          <RotulosCidade uf={uf} excedente={previa?.excedente ?? 0} />
        </>
      )}
    </>
  );
}

export default function BrasilCena({ onContextoPerdido }: { onContextoPerdido: () => void }) {
  const narrow = useIsNarrow();
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
      <IlhaRemota />
      <RotulosUf />
      <Estradas />
      <ArvoresMapa />
      <CamadaCidades />
      <MarcadorVoceAqui />
      <CameraMapa />
    </Canvas>
  );
}
