// Layout do mundo: cidade (oeste), rio com ponte e vila remota (leste, terreno alto).
// Tudo em unidades da cena (~1 = 1 metro). Funções puras — usadas pela cena e pelo HUD.

// ── Cidade: 6×6 quarteirões ─────────────────────────────────────────────
export const CITY_BLOCK_SIZE = 14;
export const CITY_BLOCK_CENTERS = [-50, -30, -10, 10, 30, 50] as const;
export const CITY_ROAD_LINES = [-60, -40, -20, 0, 20, 40, 60] as const;
export const CITY_ROAD_WIDTH = 6;
export const CITY_HALF = 63;
/** Topo do gramado dos lotes — base dos prédios da cidade. */
export const LOT_TOP = 0.18;
export const PLAZA = { x: -10, z: 10 } as const;
export const FOUNTAIN_RADIUS = 3;

// ── Rio, ponte e encosta ────────────────────────────────────────────────
export const RIVER = { x: 86, halfWidth: 8, depth: 2, waterY: -0.45 } as const;
export const BRIDGE = { x0: 73, x1: 99, halfWidth: 3.2, deckTop: 0.35 } as const;
export const HILL = { start: 98, end: 108, height: 3 } as const;

// ── Vila remota: 3×3 quarteirões no planalto ───────────────────────────
export const VILLAGE_BLOCK_SIZE = 14;
export const VILLAGE_BLOCK_XS = [120, 140, 160] as const;
export const VILLAGE_BLOCK_ZS = [-10, 10, 30] as const;
export const VILLAGE_ROAD_XS = [110, 130, 150, 170] as const;
export const VILLAGE_ROAD_ZS = [-20, 0, 20, 40] as const;
export const VILLAGE_ROAD_WIDTH = 4;
export const VILLAGE_BOUNDS = { minX: 108, maxX: 172, minZ: -22, maxZ: 42 } as const;

export const WORLD_BOUNDS = { minX: -78, maxX: 185, minZ: -78, maxZ: 78 } as const;

export type Area = "cidade" | "vila";

/** Ponto de chegada dos botões "Ir para…". */
export const AREAS: Record<Area, { x: number; z: number }> = {
  cidade: { x: 0, z: 0 },
  vila: { x: 130, z: 0 },
};

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Altura do terreno (sem ponte nem calçadas) — só varia no eixo x. */
export function groundHeight(x: number) {
  const hill = smoothstep(HILL.start, HILL.end, x) * HILL.height;
  const fromRiver = Math.abs(x - RIVER.x);
  const riverBed = (1 - smoothstep(RIVER.halfWidth - 1, RIVER.halfWidth + 2, fromRiver)) * RIVER.depth;
  return hill - riverBed;
}

export function isOnBridge(x: number, z: number) {
  return x >= BRIDGE.x0 && x <= BRIDGE.x1 && Math.abs(z) <= BRIDGE.halfWidth;
}

export function isInCity(x: number, z: number) {
  return Math.abs(x) <= CITY_HALF && Math.abs(z) <= CITY_HALF;
}

export function isInVillage(x: number, z: number) {
  return (
    x >= VILLAGE_BOUNDS.minX &&
    x <= VILLAGE_BOUNDS.maxX &&
    z >= VILLAGE_BOUNDS.minZ &&
    z <= VILLAGE_BOUNDS.maxZ
  );
}

function blockIndex(value: number) {
  const index = CITY_BLOCK_CENTERS.findIndex((c) => Math.abs(value - c) <= CITY_BLOCK_SIZE / 2);
  return index;
}

/** Está sobre um quarteirão (calçada/lote) da cidade? */
export function isOnCityBlock(x: number, z: number) {
  return blockIndex(x) !== -1 && blockIndex(z) !== -1;
}

/** Água fora da ponte — o personagem não entra. */
export function isWater(x: number, z: number) {
  return !isOnBridge(x, z) && groundHeight(x) < RIVER.waterY + 0.1;
}

/** Altura onde os pés do personagem ficam. */
export function walkHeight(x: number, z: number) {
  if (isOnBridge(x, z)) return Math.max(BRIDGE.deckTop, groundHeight(x));
  if (isOnCityBlock(x, z)) return LOT_TOP;
  return groundHeight(x);
}
