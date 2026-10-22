"use client";

import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { DayNight } from "@/components/city/DayNight";
import { cidadesDoEstado } from "@/lib/brasil/agregados";
import { useUfDaRota } from "@/lib/brasil/navegacao";
import { cidadePorId } from "@/lib/brasil/rotas";
import { useIsNarrow } from "@/lib/movimento";
import { useMapaStore } from "@/stores/mapa";
import { Aglomerados } from "./Aglomerados";
import { Bordas } from "./Bordas";
import { CameraMapa } from "./CameraMapa";
import { IlhaRemota } from "./IlhaRemota";
import { MarcadorVoceAqui } from "./MarcadorVoceAqui";
import { Mar } from "./Mar";
import { PreviaCidade, usePrevia, usePreviaVisivel } from "./PreviaCidade";
import { Relevo } from "./Relevo";
import { RotulosCidade } from "./RotulosCidade";
import { RotulosUf } from "./RotulosUf";
import { mapaRuntime } from "./runtime";
import { TorresVagas } from "./TorresVagas";

const focoDaCamera = () => mapaRuntime.alvo;

/** Raio extra em volta da prévia em que aglomerados vizinhos somem (região metropolitana). */
const FOLGA_PREVIA = 0.4;

/** Cidades da UF aberta (nível Estado). */
function CamadaEstado() {
  const uf = useUfDaRota();
  const cidadeEmFoco = useMapaStore((s) => s.cidadeEmFoco);
  const cidade = cidadeEmFoco ? cidadePorId.get(cidadeEmFoco) : undefined;
  const daUf = cidade && cidade.uf === uf ? cidade : undefined;
  const previa = usePrevia(daUf);
  const visivel = usePreviaVisivel(daUf);

  // Só a cidade em foco mostra prédios (FR-005); vizinhas sob a prévia somem.
  const ocultar = useMemo(() => {
    if (!visivel || !daUf || !previa || !uf) return undefined;
    const raio = previa.raio + FOLGA_PREVIA;
    return new Set(
      cidadesDoEstado(uf)
        .filter((c) => Math.hypot(c.x - daUf.x, c.z - daUf.z) < raio)
        .map((c) => c.id),
    );
  }, [visivel, daUf, previa, uf]);

  if (!uf) return null;
  return (
    <>
      <Aglomerados uf={uf} ocultar={ocultar} />
      {visivel && daUf && previa && <PreviaCidade cidade={daUf} previa={previa} />}
      <RotulosCidade uf={uf} excedente={visivel ? (previa?.excedente ?? 0) : 0} />
    </>
  );
}

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
      <CamadaEstado />
      <MarcadorVoceAqui />
      <CameraMapa />
    </Canvas>
  );
}
