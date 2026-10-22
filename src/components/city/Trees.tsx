"use client";

import { useMemo } from "react";
import { LOT_TOP, type Mundo, type Ponto } from "@/lib/cidade/mundo";
import type { Instance, Part } from "./facades";
import { InstancedParts } from "./Instanced";
import { useMundo } from "./mundo";

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

type Copa = { x: number; y: number; z: number; r: number };
export type Arvores = { buckets: Record<Kind, Instance[]>; copas: Copa[] };

/** Copas das árvores como esferas: a câmera evita ficar dentro da folhagem. */
export function dentroDeCopa(arvores: Arvores, x: number, y: number, z: number) {
  return arvores.copas.some((c) => (x - c.x) ** 2 + (y - c.y) ** 2 + (z - c.z) ** 2 < c.r * c.r);
}

/** Semente por mundo: cada cidade tem sua paisagem, sempre a mesma. */
function semente(id: string) {
  let h = 42;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
}

const mesmo = (a: Ponto | null, x: number, z: number) => a !== null && a.x === x && a.z === z;
const arvoresCache = new WeakMap<Mundo, Arvores>();

/** Árvores, arbustos e flores do mundo (quarteirões, praça, vila, campo e margens do rio). */
export function arvoresDoMundo(mundo: Mundo): Arvores {
  const pronto = arvoresCache.get(mundo);
  if (pronto) return pronto;
  const rand = mulberry32(semente(mundo.id));
  const buckets: Record<Kind, Instance[]> = {
    broadleafA: [],
    broadleafB: [],
    pine: [],
    round: [],
    bush: [],
    flowers: [],
  };
  const copas: Copa[] = [];
  const { colisores, praca, estacionamento, rio, ponte, urbano, limites, alturaDoChao } = mundo;
  const overlapsBuilding = (x: number, z: number, r: number) =>
    colisores.some((c) => Math.abs(x - c.x) < c.hw + r && Math.abs(z - c.z) < c.hd + r);

  /** Places a plant unless it would clip into a building. */
  function plant(kind: Kind, x: number, y: number, z: number, radius: number, scale = 0.85 + rand() * 0.4) {
    if (overlapsBuilding(x, z, radius * scale)) return;
    buckets[kind].push({ x, y, z, rotY: rand() * Math.PI * 2, scale });
    if (kind !== "bush" && kind !== "flowers") copas.push({ x, y: y + 2.8 * scale, z, r: 1.6 * scale });
  }

  const pickTree = (): Kind => {
    const r = rand();
    return r < 0.35 ? "broadleafA" : r < 0.7 ? "broadleafB" : "round";
  };

  if (mundo.tipo === "cidade") {
    // City blocks: trees on the side/back sidewalks, bushes and flower beds on the front lot corners.
    for (const bx of mundo.centrosX) {
      for (const bz of mundo.centrosZ) {
        if (mesmo(praca, bx, bz)) {
          for (const sx of [-1, 1]) {
            for (const sz of [-1, 1]) {
              plant("round", bx + sx * 4.1, LOT_TOP, bz + sz * 4.1, 0.9, 0.9);
              plant("flowers", bx + sx * 4.4, LOT_TOP, bz + sz * 5.4, 0.5, 0.9);
              plant("bush", bx + sx * 5.3, LOT_TOP, bz + sz * 2.4, 0.6, 0.9);
            }
          }
          continue;
        }
        if (mesmo(estacionamento, bx, bz)) {
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
  } else {
    // Village: mixed trees and bushes around the houses.
    for (const bx of mundo.centrosX) {
      for (const bz of mundo.centrosZ) {
        const y = alturaDoChao(bx);
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
  }

  // Outskirts: forest (more pines on the highland), clear of the urban area, roads, river and portal.
  const campo = { minX: limites.minX - 60, maxX: limites.maxX + 60, minZ: limites.minZ - 60, maxZ: limites.maxZ + 60 };
  const quantidade = Math.min(400, Math.round(((campo.maxX - campo.minX) * (campo.maxZ - campo.minZ)) / 170));
  let placed = 0;
  for (let tentativas = 0; placed < quantidade && tentativas < quantidade * 6; tentativas++) {
    const x = campo.minX + rand() * (campo.maxX - campo.minX);
    const z = campo.minZ + rand() * (campo.maxZ - campo.minZ);
    const inUrban = x > urbano.minX - 4 && x < urbano.maxX + 4 && z > urbano.minZ - 4 && z < urbano.maxZ + 4;
    const nearRiver = Math.abs(x - rio.x) < rio.meiaLargura + 3;
    // Avenue/dirt road along z = 0, from the far bank to the urban area.
    const onRoad = Math.abs(z) < 6 && x > Math.min(urbano.maxX, ponte.x0) - 8 && x < Math.max(urbano.minX, ponte.x1) + 12;
    const nearPortal = Math.abs(z) < 10 && (x > ponte.x1 && mundo.tipo === "cidade" || x < ponte.x0 && mundo.tipo === "remoto");
    if (inUrban || nearRiver || onRoad || nearPortal) continue;
    placed++;
    const r = rand();
    const highland = (mundo.colina?.altura ?? 0) > 0 && alturaDoChao(x) > 1;
    const kind: Kind = r < 0.3 ? "bush" : r < (highland ? 0.6 : 0.45) ? "pine" : pickTree();
    plant(kind, x, alturaDoChao(x), z, 0, 0.8 + rand() * 0.6);
  }

  // River banks: bushes along both shores, away from the bridge.
  for (let z = campo.minZ; z <= campo.maxZ; z += 7) {
    if (Math.abs(z) < 10) continue;
    for (const side of [-1, 1]) {
      const x = rio.x + side * (rio.meiaLargura + 2.5 + rand() * 1.5);
      plant("bush", x, alturaDoChao(x), z + rand() * 3, 0, 0.8 + rand() * 0.4);
    }
  }

  const arvores = { buckets, copas };
  arvoresCache.set(mundo, arvores);
  return arvores;
}

const KIND_LIST = Object.keys(KINDS) as Kind[];

export function Trees() {
  const mundo = useMundo();
  const { buckets } = useMemo(() => arvoresDoMundo(mundo), [mundo]);
  return (
    <>
      {KIND_LIST.map((kind) => (
        <InstancedParts key={kind} parts={KINDS[kind]} instances={buckets[kind]} shadows={kind !== "flowers"} />
      ))}
    </>
  );
}
