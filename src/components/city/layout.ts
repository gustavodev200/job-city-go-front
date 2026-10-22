import {
  CITY_BLOCK_CENTERS,
  CITY_BLOCK_SIZE,
  FOUNTAIN_RADIUS,
  LOT_TOP,
  PLAZA,
  WORLD_BOUNDS,
  groundHeight,
  isInCity,
  isInVillage,
  isWater,
} from "@/data/mapa";
import { vagas, type Categoria, type Modelo, type VagaCidade, type VagaRemota } from "@/data/vagas";
import { FACADES, FILLER_HOUSES, REMOTE_HOUSE, type Instance } from "./facades";

/** Limite de construções visíveis (cidade + vila, incluindo casas decorativas). */
export const MAX_CONSTRUCOES = 300;

const cidade = vagas.filter(
  (v): v is VagaCidade => v.modelo !== "remoto" && isInCity(v.x, v.z),
);
const vila = vagas.filter(
  (v): v is VagaRemota => v.modelo === "remoto" && isInVillage(v.x, v.z),
);

if (process.env.NODE_ENV !== "production") {
  const posicionadas = new Set([...cidade, ...vila].map((v) => v.id));
  const fora = vagas.filter((v) => !posicionadas.has(v.id));
  if (fora.length > 0) {
    console.warn(
      "[job-city-go] vagas fora da área do seu modelo (não renderizadas):",
      fora.map((v) => v.id),
    );
  }
}

export const vagasCidade = cidade.slice(0, MAX_CONSTRUCOES);
export const vagasVila = vila.slice(0, MAX_CONSTRUCOES - vagasCidade.length);

// ── Free city blocks: the one closest to the center becomes a parking lot, the rest get houses ──
const HALF_BLOCK = CITY_BLOCK_SIZE / 2;
const ocupado = (bx: number, bz: number) =>
  (bx === PLAZA.x && bz === PLAZA.z) ||
  vagasCidade.some((v) => Math.abs(v.x - bx) <= HALF_BLOCK && Math.abs(v.z - bz) <= HALF_BLOCK);

const freeBlocks = CITY_BLOCK_CENTERS.flatMap((x) =>
  CITY_BLOCK_CENTERS.filter((z) => !ocupado(x, z)).map((z) => ({ x, z })),
).sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z));

export const parkingLot = freeBlocks.at(0) ?? null;

const fillerPositions = freeBlocks.slice(1).flatMap((b) =>
  [-3.4, 3.4].flatMap((dx) => [-3.4, 3.4].map((dz) => ({ x: b.x + dx, z: b.z + dz }))),
);

/** Decorative houses split by variant (alternating), capped by MAX_CONSTRUCOES. */
export const fillerInstances: Instance[][] = FILLER_HOUSES.map((_, variant) =>
  fillerPositions
    .slice(0, MAX_CONSTRUCOES - vagasCidade.length - vagasVila.length)
    .filter((_, i) => i % FILLER_HOUSES.length === variant)
    .map(({ x, z }) => ({ x, y: LOT_TOP, z })),
);

/** Parked cars (split by color variant); facing +z or -z in two rows. */
export const CAR_COLORS = ["#e8743b", "#5aa0c8", "#f2efe6"] as const;
const PARKING_SPOTS = [
  [-4.5, -3.2, 0],
  [1.5, -3.2, 0],
  [4.5, -3.2, 0],
  [-1.5, 3.2, Math.PI],
  [4.5, 3.2, Math.PI],
] as const;
export const carInstances: Instance[][] = CAR_COLORS.map((_, variant) =>
  parkingLot
    ? PARKING_SPOTS.filter((_, i) => i % CAR_COLORS.length === variant).map(([dx, dz, rotY]) => ({
        x: parkingLot.x + dx,
        y: LOT_TOP,
        z: parkingLot.z + dz,
        rotY,
      }))
    : [],
);

// ── Instâncias por categoria / tipo de casa ─────────────────────────────
const toInstance = (v: VagaCidade | VagaRemota, y: number): Instance => ({
  x: v.x,
  y,
  z: v.z,
  lit: v.status === "aberta",
  dim: v.status === "encerrada",
});

export const CATEGORIAS = Object.keys(FACADES) as Categoria[];

export const cityInstances = Object.fromEntries(
  CATEGORIAS.map((cat) => [
    cat,
    vagasCidade.filter((v) => v.categoria === cat).map((v) => toInstance(v, LOT_TOP)),
  ]),
) as Record<Categoria, Instance[]>;

export const hybridBadgeInstances = Object.fromEntries(
  CATEGORIAS.map((cat) => [
    cat,
    vagasCidade
      .filter((v) => v.categoria === cat && v.modelo === "hibrido")
      .map((v) => toInstance(v, LOT_TOP)),
  ]),
) as Record<Categoria, Instance[]>;

export const houseInstances: Instance[] = vagasVila.map((v) => toInstance(v, groundHeight(v.x)));

// ── Pontos de interação (HUD) e marcadores ─────────────────────────────
export type VagaSpot = {
  id: string;
  x: number;
  /** Ground level of the building. */
  baseY: number;
  /** Marker height above the ground. */
  y: number;
  z: number;
  radius: number;
  /** Footprint half-diagonal — used by the highlight ring. */
  size: number;
  aberta: boolean;
  modelo: Modelo;
};

export const vagaSpots: VagaSpot[] = [
  ...vagasCidade.map((v) => {
    const facade = FACADES[v.categoria];
    return {
      id: v.id,
      x: v.x,
      baseY: LOT_TOP,
      y: LOT_TOP + facade.markerY,
      z: v.z,
      radius: Math.max(...facade.footprint) / 2 + 5,
      size: Math.hypot(...facade.footprint) / 2,
      aberta: v.status === "aberta",
      modelo: v.modelo,
    };
  }),
  ...vagasVila.map((v) => ({
    id: v.id,
    x: v.x,
    baseY: groundHeight(v.x),
    y: groundHeight(v.x) + REMOTE_HOUSE.markerY,
    z: v.z,
    radius: Math.max(...REMOTE_HOUSE.footprint) / 2 + 5,
    size: Math.hypot(...REMOTE_HOUSE.footprint) / 2,
    aberta: v.status === "aberta",
    modelo: v.modelo,
  })),
];

export function nearestVagaId(x: number, z: number) {
  let best: string | null = null;
  let bestDist = Infinity;
  for (const spot of vagaSpots) {
    const dist = Math.hypot(spot.x - x, spot.z - z);
    if (dist <= spot.radius && dist < bestDist) {
      best = spot.id;
      bestDist = dist;
    }
  }
  return best;
}

// ── Colisão ────────────────────────────────────────────────────────────
type Rect = { x: number; z: number; hw: number; hd: number; bottom: number; top: number };

const rect = (x: number, z: number, [w, d]: readonly [number, number], bottom: number, height: number): Rect => ({
  x,
  z,
  hw: w / 2,
  hd: d / 2,
  bottom,
  top: bottom + height,
});

export const colliders: Rect[] = [
  ...vagasCidade.map((v) => rect(v.x, v.z, FACADES[v.categoria].footprint, LOT_TOP, FACADES[v.categoria].markerY - 1.5)),
  ...vagasVila.map((v) => rect(v.x, v.z, REMOTE_HOUSE.footprint, groundHeight(v.x), 5)),
  ...fillerInstances.flat().map((f) => rect(f.x, f.z, FILLER_HOUSES[0].footprint, LOT_TOP, 5)),
  ...carInstances.flat().map((c) => rect(c.x, c.z, [2.1, 4.3], LOT_TOP, 1.6)),
];

/** Does a circle of `radius` at (x, z) overlap any building footprint? */
export function overlapsBuilding(x: number, z: number, radius: number) {
  return colliders.some((c) => Math.abs(x - c.x) < c.hw + radius && Math.abs(z - c.z) < c.hd + radius);
}

/** Is the point inside a building volume (with padding)? Used to keep the camera out of walls. */
export function isInsideBuilding(x: number, y: number, z: number, pad: number) {
  return colliders.some(
    (c) => y < c.top + pad && y > c.bottom - pad && Math.abs(x - c.x) < c.hw + pad && Math.abs(z - c.z) < c.hd + pad,
  );
}

export function isBlocked(x: number, z: number, radius: number) {
  if (x < WORLD_BOUNDS.minX || x > WORLD_BOUNDS.maxX || z < WORLD_BOUNDS.minZ || z > WORLD_BOUNDS.maxZ) {
    return true;
  }
  if (isWater(x, z)) return true;
  if (Math.hypot(x - PLAZA.x, z - PLAZA.z) < FOUNTAIN_RADIUS + radius) return true;
  return overlapsBuilding(x, z, radius);
}
