// Traçado 3D das estradas sobre o relevo em degraus do mapa do Brasil.
import type { Cidade } from "@/data/brasil/tipos";
import { celulaDoPonto, topoDaCelula } from "./geo";

export type PontoEstrada = { x: number; y: number; z: number };

/** Sobre o mar (ponte) o tabuleiro fica um pouco acima da água. */
const ALTURA_PONTE = 0.12;
/** Folga sobre o relevo para não brigar com o chão. */
const FOLGA = 0.02;

const distancia = (p: Cidade, q: Cidade) => Math.hypot(p.x - q.x, p.z - q.z);

/** Altura do leito da estrada num ponto da cena (topo do degrau do relevo; ponte no mar). */
export function alturaDaEstrada(x: number, z: number) {
  const cel = celulaDoPonto(x, z);
  const topo = cel ? topoDaCelula(cel.col, cel.lin) : 0;
  return (topo > 0 ? topo : ALTURA_PONTE) + FOLGA;
}

/** Pontos ao longo da estrada a cada `passo`, seguindo a altura do relevo. */
export function tracado(de: Cidade, ate: Cidade, passo = 0.2): PontoEstrada[] {
  const n = Math.max(1, Math.ceil(distancia(de, ate) / passo));
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const x = de.x + (ate.x - de.x) * t;
    const z = de.z + (ate.z - de.z) * t;
    return { x, y: alturaDaEstrada(x, z), z };
  });
}

