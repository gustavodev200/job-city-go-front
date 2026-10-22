"use client";

import {
  BRIDGE,
  CITY_BLOCK_CENTERS,
  CITY_HALF,
  LOT_TOP,
  PLAZA,
  RIVER,
  VILLAGE_BLOCK_XS,
  VILLAGE_BLOCK_ZS,
  VILLAGE_BOUNDS,
  groundHeight,
} from "@/data/mapa";
import type { Instance, Part } from "./facades";
import { InstancedParts } from "./Instanced";
import { overlapsBuilding, parkingLot } from "./layout";

// Deterministic PRNG — the same landscape on every load.
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BARK = "#8a5a3a";
const sphere = (size: Part["size"], pos: Part["pos"], color: string): Part => ({ shape: "sphere", size, pos, color });

const broadleaf = (dark: string, mid: string, light: string): Part[] => [
  { shape: "cylinder", size: [0.38, 1.9, 0.38], pos: [0, 0.95, 0], color: BARK },
  { shape: "cylinder", size: [0.14, 0.9, 0.14], pos: [0.3, 1.7, 0], rot: [0, 0, -0.6], color: BARK },
  sphere([2.6, 2.2, 2.6], [0, 2.9, 0], mid),
  sphere([1.9, 1.7, 1.9], [0.9, 2.6, 0.4], dark),
  sphere([1.8, 1.6, 1.8], [-0.8, 2.7, -0.4], dark),
  sphere([1.7, 1.5, 1.7], [0.1, 3.8, -0.1], light),
];

const KINDS = {
  broadleafA: broadleaf("#4f9443", "#5fa64c", "#7cbd5f"),
  broadleafB: broadleaf("#5a9f4a", "#6fb35a", "#8cc66a"),
  pine: [
    { shape: "cylinder", size: [0.3, 1.2, 0.3], pos: [0, 0.6, 0], color: BARK },
    { shape: "cone", size: [2.4, 1.8, 2.4], pos: [0, 1.9, 0], color: "#3f8a4f" },
    { shape: "cone", size: [1.9, 1.6, 1.9], pos: [0, 2.9, 0], color: "#47915a" },
    { shape: "cone", size: [1.3, 1.4, 1.3], pos: [0, 3.8, 0], color: "#55a064" },
  ],
  round: [
    { shape: "cylinder", size: [0.25, 1.3, 0.25], pos: [0, 0.65, 0], color: BARK },
    sphere([1.7, 1.7, 1.7], [0, 2.0, 0], "#7cbd5f"),
    sphere([1.0, 0.9, 1.0], [0.2, 2.6, 0.1], "#93cc72"),
  ],
  bush: [
    sphere([1.3, 0.9, 1.2], [0, 0.45, 0], "#5c9f4c"),
    sphere([0.9, 0.7, 0.9], [0.55, 0.4, 0.2], "#6aae55"),
    sphere([0.8, 0.65, 0.8], [-0.5, 0.38, -0.15], "#6aae55"),
  ],
  flowers: [
    { shape: "box", size: [1.6, 0.2, 0.9], pos: [0, 0.1, 0], color: "#8a6a4a" },
    sphere([1.5, 0.28, 0.8], [0, 0.24, 0], "#5c9f4c"),
    ...(
      [
        [-0.55, -0.2, "#f29bb0"],
        [-0.2, 0.2, "#f6d05a"],
        [0.15, -0.15, "#fffaf0"],
        [0.5, 0.2, "#e8584a"],
        [0.55, -0.2, "#f29bb0"],
        [-0.5, 0.25, "#f6d05a"],
      ] as const
    ).map(([x, z, color]) => sphere([0.3, 0.24, 0.3], [x, 0.38, z], color)),
  ],
} satisfies Record<string, Part[]>;

type Kind = keyof typeof KINDS;

const rand = mulberry32(42);
const buckets: Record<Kind, Instance[]> = {
  broadleafA: [],
  broadleafB: [],
  pine: [],
  round: [],
  bush: [],
  flowers: [],
};

/** Places a plant unless it would clip into a building. */
function plant(kind: Kind, x: number, y: number, z: number, radius: number, scale = 0.85 + rand() * 0.4) {
  if (overlapsBuilding(x, z, radius * scale)) return;
  buckets[kind].push({ x, y, z, rotY: rand() * Math.PI * 2, scale });
}

const pickTree = (): Kind => {
  const r = rand();
  return r < 0.35 ? "broadleafA" : r < 0.7 ? "broadleafB" : "round";
};

// City blocks: trees on the side/back sidewalks, bushes and flower beds on the front lot corners.
for (const bx of CITY_BLOCK_CENTERS) {
  for (const bz of CITY_BLOCK_CENTERS) {
    if (bx === PLAZA.x && bz === PLAZA.z) {
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          plant("round", bx + sx * 4.1, LOT_TOP, bz + sz * 4.1, 0.9, 0.9);
          plant("flowers", bx + sx * 4.4, LOT_TOP, bz + sz * 5.4, 0.5, 0.9);
          plant("bush", bx + sx * 5.3, LOT_TOP, bz + sz * 2.4, 0.6, 0.9);
        }
      }
      continue;
    }
    if (parkingLot && bx === parkingLot.x && bz === parkingLot.z) {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) plant("round", bx + sx * 5.6, LOT_TOP, bz + sz * 5.6, 0.9, 0.85);
      continue;
    }
    for (const sx of [-1, 1]) {
      plant(pickTree(), bx + sx * 6.5, LOT_TOP, bz - 6.5, 1.1);
      plant("round", bx + sx * 6.6, LOT_TOP, bz - 3, 0.9, 0.8);
      plant("bush", bx + sx * 5.4, LOT_TOP, bz + 5.4, 0.7, 0.8);
      plant("flowers", bx + sx * 5.2, LOT_TOP, bz + 3.6, 0.6, 0.9);
    }
  }
}

// Village: mixed trees and bushes around the houses.
for (const bx of VILLAGE_BLOCK_XS) {
  for (const bz of VILLAGE_BLOCK_ZS) {
    const y = groundHeight(bx);
    for (const [dx, dz] of [
      [-5.5, -5.5],
      [5.5, -5.5],
      [-5.5, 5.5],
      [5.5, 5.5],
      [0, -5.5],
      [-5.5, 0],
      [5.5, 0],
    ]) {
      plant(rand() < 0.4 ? "pine" : pickTree(), bx + dx, y, bz + dz, 1.4);
    }
    plant("bush", bx + (rand() - 0.5) * 8, y, bz + 5.8, 0.8);
    plant("flowers", bx + (rand() - 0.5) * 6, y, bz - 2.5, 0.8);
  }
}

// Outskirts: forest (more pines on the highland), clear of roads, river and village.
let placed = 0;
while (placed < 420) {
  const x = -120 + rand() * 330;
  const z = -110 + rand() * 220;
  const inCity = Math.abs(x) < CITY_HALF + 4 && Math.abs(z) < CITY_HALF + 4;
  const nearRiver = Math.abs(x - RIVER.x) < RIVER.halfWidth + 3;
  const onRoad = Math.abs(z) < 6 && x > CITY_HALF && x < VILLAGE_BOUNDS.minX + 2;
  const inVillage =
    x > VILLAGE_BOUNDS.minX - 3 &&
    x < VILLAGE_BOUNDS.maxX + 3 &&
    z > VILLAGE_BOUNDS.minZ - 3 &&
    z < VILLAGE_BOUNDS.maxZ + 3;
  const onBridgeApproach = x > BRIDGE.x0 - 6 && x < BRIDGE.x1 + 6 && Math.abs(z) < 8;
  if (inCity || nearRiver || onRoad || inVillage || onBridgeApproach) continue;
  placed++;
  const r = rand();
  const kind: Kind = r < 0.3 ? "bush" : r < (x > RIVER.x ? 0.6 : 0.45) ? "pine" : pickTree();
  plant(kind, x, groundHeight(x), z, 0, 0.8 + rand() * 0.6);
}

// River banks: bushes along both shores, away from the bridge.
for (let z = -100; z <= 100; z += 7) {
  if (Math.abs(z) < 10) continue;
  for (const side of [-1, 1]) {
    const x = RIVER.x + side * (RIVER.halfWidth + 2.5 + rand() * 1.5);
    plant("bush", x, groundHeight(x), z + rand() * 3, 0, 0.8 + rand() * 0.4);
  }
}

const KIND_LIST = Object.keys(KINDS) as Kind[];

export function Trees() {
  return (
    <>
      {KIND_LIST.map((kind) => (
        <InstancedParts key={kind} parts={KINDS[kind]} instances={buckets[kind]} shadows={kind !== "flowers"} />
      ))}
    </>
  );
}
