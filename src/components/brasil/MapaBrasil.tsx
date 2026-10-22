"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BrasilPlano } from "./BrasilPlano";

const BrasilCena = dynamic(() => import("./BrasilCena"), { ssr: false });

function temWebgl() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Mapa 3D quando há WebGL; senão (ou se o contexto cair) o mapa plano em SVG. */
export function MapaBrasil() {
  const params = useSearchParams();
  // Força o mapa plano (testes e quem prefere a versão leve). Qualquer outro valor é ignorado.
  const forcarPlano = params.get("semWebgl") === "1";
  const [suporte, setSuporte] = useState<"verificando" | "3d" | "plano">("verificando");

  useEffect(() => {
    // Detecção só existe no cliente; o primeiro render (servidor) não mostra nenhum dos dois.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSuporte(temWebgl() ? "3d" : "plano");
  }, []);

  if (suporte === "verificando") return <div className="absolute inset-0 bg-sky-100" />;
  if (forcarPlano || suporte === "plano") return <BrasilPlano />;
  return (
    <div className="absolute inset-0">
      <BrasilCena onContextoPerdido={() => setSuporte("plano")} />
    </div>
  );
}
