import * as THREE from "three";

/**
 * Day/night cycle math (no React). `calcularCeu` turns an hour (0–24) into the
 * target sky/light state; DayNight eases the scene toward it.
 */

type Paleta = {
  topo: string;
  horizonte: string;
  neblina: string;
  /** Glow around the sun on the horizon (dawn/dusk). */
  brilho: string;
  nuvem: string;
  ceuLuz: string;
  chaoLuz: string;
  ambiente: number;
};

const MADRUGADA: Paleta = {
  topo: "#030817",
  horizonte: "#101c38",
  neblina: "#111d38",
  brilho: "#000000",
  nuvem: "#171f33",
  ceuLuz: "#7a8cc0",
  chaoLuz: "#36405a",
  ambiente: 1.0,
};
const AMANHECER: Paleta = {
  topo: "#5873ad",
  horizonte: "#f6b08f",
  neblina: "#e6b3a0",
  brilho: "#ff8752",
  nuvem: "#f8c2ae",
  ceuLuz: "#f5cab2",
  chaoLuz: "#7e8466",
  ambiente: 0.95,
};
const DIA: Paleta = {
  topo: "#86c4ea",
  horizonte: "#dcedf3",
  neblina: "#dcedf3",
  brilho: "#3a3020",
  nuvem: "#ffffff",
  ceuLuz: "#eef6ff",
  chaoLuz: "#a7c48c",
  ambiente: 1.3,
};
const ENTARDECER: Paleta = {
  topo: "#3b3272",
  horizonte: "#f28a4a",
  neblina: "#b98078",
  brilho: "#ff6232",
  nuvem: "#f09f7c",
  ceuLuz: "#f2a070",
  chaoLuz: "#5f5050",
  ambiente: 0.85,
};
const NOITE: Paleta = {
  topo: "#081230",
  horizonte: "#263350",
  neblina: "#353f58",
  brilho: "#18122c",
  nuvem: "#283146",
  ceuLuz: "#8496c8",
  chaoLuz: "#3c4762",
  ambiente: 1.05,
};

/** Madrugada 0–5 · amanhecer 5–7 · dia 7–17 · entardecer 17–19 · noite 19–24. */
const CHAVES: [number, Paleta][] = [
  [0, MADRUGADA],
  [5, MADRUGADA],
  [6, AMANHECER],
  [7, DIA],
  [17, DIA],
  [18, ENTARDECER],
  [19, NOITE],
  [24, MADRUGADA],
];

const CORES = ["topo", "horizonte", "neblina", "brilho", "nuvem", "ceuLuz", "chaoLuz"] as const;
type ChaveCor = (typeof CORES)[number];

const CHAVES_CORES = CHAVES.map(([hora, p]) => ({
  hora,
  ambiente: p.ambiente,
  cores: Object.fromEntries(CORES.map((c) => [c, new THREE.Color(p[c])])) as Record<ChaveCor, THREE.Color>,
}));

const SOL_BAIXO = new THREE.Color("#ff9b5a");
const SOL_ALTO = new THREE.Color("#fff0d6");
/** Sun arc tilt toward +z so noon light is not straight down. */
const INCLINACAO = 0.35;

export const SOL_MAX = 2.3;
/** Luar forte o bastante para enxergar ruas e prédios sem depender só dos postes. */
export const LUA_MAX = 1.1;

export type EstadoCeu = Record<ChaveCor, THREE.Color> & {
  ambiente: number;
  /** Unit vector toward the sun (east = +x at 6h, west = -x at 18h). */
  sol: THREE.Vector3;
  /** sin(elevation): 0 at sunrise/sunset, 1 at noon, negative at night. */
  altura: number;
  corSol: THREE.Color;
  intensidadeSol: number;
  intensidadeLua: number;
  /** 0 = day, 1 = full night (stars, milky way). */
  noite: number;
  /** City lights: 0 off, 1 on (switches at dusk/dawn, eased over ~1 s). */
  luzes: number;
  /** Moon phase 0–1 (0 new, 0.5 full). */
  faseLua: number;
};

export function criarEstado(): EstadoCeu {
  return {
    ...(Object.fromEntries(CORES.map((c) => [c, new THREE.Color()])) as Record<ChaveCor, THREE.Color>),
    ambiente: 1,
    sol: new THREE.Vector3(0, 1, 0),
    altura: 1,
    corSol: new THREE.Color(),
    intensidadeSol: SOL_MAX,
    intensidadeLua: 0,
    noite: 0,
    luzes: 0,
    faseLua: 0.5,
  };
}

const LUA_NOVA_REF = Date.UTC(2000, 0, 6, 18, 14);
const MES_SINODICO = 29.530588853;

/** Real moon phase for the device date. */
export function faseDaLua(data = new Date()) {
  const ciclos = (data.getTime() - LUA_NOVA_REF) / 86_400_000 / MES_SINODICO;
  return ciclos - Math.floor(ciclos);
}

const smooth = THREE.MathUtils.smoothstep;

export function calcularCeu(hora: number, out: EstadoCeu): EstadoCeu {
  const h = ((hora % 24) + 24) % 24;
  let i = 0;
  while (i < CHAVES_CORES.length - 2 && h >= CHAVES_CORES[i + 1].hora) i++;
  const a = CHAVES_CORES[i];
  const b = CHAVES_CORES[i + 1];
  const t = smooth(h, a.hora, b.hora);
  for (const c of CORES) out[c].lerpColors(a.cores[c], b.cores[c], t);
  out.ambiente = THREE.MathUtils.lerp(a.ambiente, b.ambiente, t);

  // Arc from east (6h) through the zenith side (12h) to west (18h).
  const angulo = ((h - 6) / 12) * Math.PI;
  out.sol.set(Math.cos(angulo), Math.sin(angulo), INCLINACAO).normalize();
  out.altura = out.sol.y;

  out.corSol.lerpColors(SOL_BAIXO, SOL_ALTO, smooth(out.altura, 0, 0.45));
  out.intensidadeSol = SOL_MAX * smooth(out.altura, 0, 0.2);
  out.faseLua = faseDaLua();
  const iluminada = (1 - Math.cos(out.faseLua * Math.PI * 2)) / 2;
  out.intensidadeLua = LUA_MAX * smooth(-out.altura, 0, 0.2) * (0.35 + 0.65 * iluminada);
  out.noite = 1 - smooth(out.altura, -0.25, 0.05);
  out.luzes = out.altura < 0.03 ? 1 : 0;
  return out;
}

/** Eases `atual` toward `alvo`; k = 1 copies (reduced motion / first frame). */
export function aproximar(atual: EstadoCeu, alvo: EstadoCeu, k: number) {
  for (const c of CORES) atual[c].lerp(alvo[c], k);
  atual.corSol.lerp(alvo.corSol, k);
  atual.sol.lerp(alvo.sol, k).normalize();
  atual.altura = atual.sol.y;
  const lerp = THREE.MathUtils.lerp;
  atual.ambiente = lerp(atual.ambiente, alvo.ambiente, k);
  atual.intensidadeSol = lerp(atual.intensidadeSol, alvo.intensidadeSol, k);
  atual.intensidadeLua = lerp(atual.intensidadeLua, alvo.intensidadeLua, k);
  atual.noite = lerp(atual.noite, alvo.noite, k);
  atual.luzes = lerp(atual.luzes, alvo.luzes, k);
  atual.faseLua = alvo.faseLua;
}

/** Eased values written by DayNight every frame, read by billboards and markers. */
export const cicloRuntime = { noite: 0, luzes: 0 };
