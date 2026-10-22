"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { FONTE_RAIO as FOUNTAIN_RADIUS, LOT_TOP, QUARTEIRAO as CITY_BLOCK_SIZE, type Mundo, type Ponto, type Vila } from "@/lib/cidade/mundo";
import type { Instance, Part } from "./facades";
import { InstancedParts } from "./Instanced";
import { useMundo } from "./mundo";
import { corDaVegetacao } from "./Terrain";

const ASPHALT_Y = 0.04;
const DIRT = "#d9c39a";

const PAINT = "#f4f1e8";
const CURB = "#d3cab8";
const half = CITY_BLOCK_SIZE / 2;

// Sidewalk slab with a raised curb all around.
const SIDEWALK: Part[] = [
  { shape: "box", size: [CITY_BLOCK_SIZE, 0.15, CITY_BLOCK_SIZE], pos: [0, 0.075, 0], color: "#ebe3d2" },
  ...[-1, 1].flatMap((s): Part[] => [
    { shape: "box", size: [CITY_BLOCK_SIZE, 0.2, 0.3], pos: [0, 0.1, s * (half - 0.15)], color: CURB },
    { shape: "box", size: [0.3, 0.2, CITY_BLOCK_SIZE], pos: [s * (half - 0.15), 0.1, 0], color: CURB },
  ]),
];
const LOT_SIZE = CITY_BLOCK_SIZE - 1.6;
// Gramado do lote na cor do bioma (um array por cor: InstancedParts memoriza por array).
const lotesPorCor = new Map<string, Part[]>();
function gramadoDoLote(cor: string): Part[] {
  let parts = lotesPorCor.get(cor);
  if (!parts) {
    parts = [{ shape: "box", size: [LOT_SIZE, LOT_TOP, LOT_SIZE], pos: [0, LOT_TOP / 2, 0], color: cor }];
    lotesPorCor.set(cor, parts);
  }
  return parts;
}
// Paved parking lot with painted bays.
const PARKING: Part[] = [
  { shape: "box", size: [LOT_SIZE, LOT_TOP, LOT_SIZE], pos: [0, LOT_TOP / 2, 0], color: "#8f949a" },
  ...[-6, -3, 0, 3, 6].flatMap((x) =>
    [-3.2, 3.2].map((z): Part => ({ shape: "box", size: [0.12, 0.02, 4.4], pos: [x, LOT_TOP + 0.01, z], color: PAINT })),
  ),
];

// Center dashes, only between intersections.
const DASH: Part[] = [{ shape: "box", size: [1.8, 0.02, 0.22], pos: [0, ASPHALT_Y + 0.01, 0], color: PAINT }];

// Zebra crossings on every approach of the inner intersections.
const CROSSWALK: Part[] = [-2.4, -1.2, 0, 1.2, 2.4].map((z) => ({
  shape: "box",
  size: [1.6, 0.02, 0.55],
  pos: [0, ASPHALT_Y + 0.012, z],
  color: PAINT,
}));

// Street lights on the front corners of every block.
const LAMP: Part[] = [
  { shape: "cylinder", size: [0.34, 0.35, 0.34], pos: [0, 0.175, 0], color: "#2f463a" },
  { shape: "cylinder", size: [0.16, 4.2, 0.16], pos: [0, 2.1, 0], color: "#3e5a4a" },
  { shape: "box", size: [0.9, 0.1, 0.1], pos: [-0.35, 4.2, 0], color: "#3e5a4a" },
  { shape: "cone", size: [0.6, 0.3, 0.6], pos: [-0.75, 4.25, 0], color: "#3e5a4a" },
  { shape: "sphere", size: [0.42, 0.42, 0.42], pos: [-0.75, 4.0, 0], color: "", glow: true },
];

// Benches and trash bins on the front sidewalk.
const BENCH: Part[] = [
  { shape: "box", size: [1.8, 0.1, 0.5], pos: [0, 0.48, 0], color: "#a3714a" },
  { shape: "box", size: [1.8, 0.4, 0.08], pos: [0, 0.78, -0.22], color: "#a3714a" },
  { shape: "box", size: [0.08, 0.48, 0.45], pos: [-0.75, 0.24, 0], color: "#3e5a4a" },
  { shape: "box", size: [0.08, 0.48, 0.45], pos: [0.75, 0.24, 0], color: "#3e5a4a" },
];
const BIN: Part[] = [
  { shape: "cylinder", size: [0.5, 0.85, 0.5], pos: [0, 0.425, 0], color: "#3e5a4a" },
  { shape: "cylinder", size: [0.58, 0.08, 0.58], pos: [0, 0.88, 0], color: "#2f463a" },
];

/** Lâmpada de um poste (posição no mundo), usada pela iluminação noturna. */
export type Poste = { x: number; y: number; z: number; groundY: number };

const mesmo = (a: Ponto | null, b: Ponto) => a !== null && a.x === b.x && a.z === b.z;

/** Instâncias do mobiliário urbano da cidade, derivadas do mundo. */
function ruasDaCidade(mundo: Mundo) {
  const { centrosX, centrosZ, ruasX, ruasZ, praca, estacionamento } = mundo;
  const blocks = centrosX.flatMap((x) => centrosZ.map((z) => ({ x, z })));
  const isPlaza = (b: Ponto) => mesmo(praca, b);
  const isParking = (b: Ponto) => mesmo(estacionamento, b);
  const innerX = ruasX.slice(1, -1);
  const innerZ = ruasZ.slice(1, -1);
  return {
    sidewalk: blocks.map(({ x, z }) => ({ x, y: 0, z })),
    lot: blocks.filter((b) => !isPlaza(b) && !isParking(b)).map(({ x, z }) => ({ x, y: 0, z })),
    parking: estacionamento ? [{ x: estacionamento.x, y: 0, z: estacionamento.z }] : [],
    dash: [
      ...ruasZ.flatMap((line) => centrosX.flatMap((c) => [-4, 0, 4].map((d) => ({ x: c + d, y: 0, z: line })))),
      ...ruasX.flatMap((line) =>
        centrosZ.flatMap((c) => [-4, 0, 4].map((d) => ({ x: line, y: 0, z: c + d, rotY: Math.PI / 2 }))),
      ),
    ],
    crosswalk: innerX.flatMap((rx) =>
      innerZ.flatMap((rz) => [
        { x: rx + 4.2, y: 0, z: rz },
        { x: rx - 4.2, y: 0, z: rz },
        { x: rx, y: 0, z: rz + 4.2, rotY: Math.PI / 2 },
        { x: rx, y: 0, z: rz - 4.2, rotY: Math.PI / 2 },
      ]),
    ),
    lamp: blocks.flatMap(({ x, z }) =>
      [-1, 1].map((side) => ({ x: x + side * 6.5, y: 0.15, z: z + 6.5, rotY: side === -1 ? Math.PI : 0, lit: true })),
    ),
    bench: [
      ...blocks.filter((b) => !isPlaza(b)).map(({ x, z }) => ({ x: x - 3.6, y: 0.15, z: z + 6.6 })),
      // Plaza benches facing the fountain.
      ...(praca
        ? [0, Math.PI / 2, Math.PI, -Math.PI / 2].map((angle) => ({
            x: praca.x + Math.sin(angle) * 5.3,
            y: LOT_TOP,
            z: praca.z + Math.cos(angle) * 5.3,
            rotY: angle + Math.PI,
          }))
        : []),
    ],
    bin: blocks.map(({ x, z }) => ({ x: x - 5.4, y: 0.15, z: z + 6.6 })),
  } satisfies Record<string, Instance[]>;
}

const postesCache = new WeakMap<Mundo, Poste[]>();

/** Lâmpadas dos postes (luz noturna); vazio no Bairro Remoto. */
export function postesDoMundo(mundo: Mundo): Poste[] {
  let postes = postesCache.get(mundo);
  if (!postes) {
    postes =
      mundo.tipo === "cidade"
        ? ruasDaCidade(mundo).lamp.map(({ x, y, z, rotY }) => ({
            x: x - 0.75 * Math.cos(rotY),
            y: y + 4.0,
            z: z + 0.75 * Math.sin(rotY),
            groundY: y,
          }))
        : [];
    postesCache.set(mundo, postes);
  }
  return postes;
}

function Plaza({ praca, grama }: { praca: Ponto; grama: string }) {
  return (
    <group position={[praca.x, 0, praca.z]}>
      <mesh position={[0, 0.09, 0]} receiveShadow>
        <boxGeometry args={[CITY_BLOCK_SIZE - 1.6, LOT_TOP, CITY_BLOCK_SIZE - 1.6]} />
        <meshStandardMaterial color="#efe3c9" />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 4.1, 0.2, sz * 4.1]} receiveShadow>
            <boxGeometry args={[3.6, 0.06, 3.6]} />
            <meshStandardMaterial color={grama} />
          </mesh>
        )),
      )}
      {/* Basin: low base, rounded rim and a visible water surface */}
      <mesh position={[0, 0.35, 0]} receiveShadow>
        <cylinderGeometry args={[FOUNTAIN_RADIUS, FOUNTAIN_RADIUS + 0.15, 0.35, 48]} />
        <meshStandardMaterial color="#e6d9bd" />
      </mesh>
      <mesh position={[0, 0.62, 0]} rotation-x={-Math.PI / 2} castShadow receiveShadow>
        <torusGeometry args={[FOUNTAIN_RADIUS - 0.2, 0.28, 12, 48]} />
        <meshStandardMaterial color="#efe4cc" />
      </mesh>
      <mesh position={[0, 0.6, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[FOUNTAIN_RADIUS - 0.25, 48]} />
        <meshStandardMaterial color="#86d0e6" roughness={0.1} />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.55, 1.6, 16]} />
        <meshStandardMaterial color="#e6d9bd" />
      </mesh>
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[1.2, 0.4, 0.4, 24]} />
        <meshStandardMaterial color="#e6d9bd" />
      </mesh>
      <mesh position={[0, 2.75, 0]}>
        <cylinderGeometry args={[1, 1, 0.05, 24]} />
        <meshStandardMaterial color="#86d0e6" roughness={0.1} />
      </mesh>
    </group>
  );
}

/** Faixa de terra que acompanha o relevo (ponte → vila). */
function useSlopeRoadGeometry(groundHeight: (x: number) => number, x0: number, x1: number, z: number, width: number) {
  return useMemo(() => {
    const steps = Math.ceil((x1 - x0) / 0.5);
    const positions: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i <= steps; i++) {
      const x = x0 + ((x1 - x0) * i) / steps;
      const y = groundHeight(x) + 0.05;
      positions.push(x, y, z - width / 2, x, y, z + width / 2);
      if (i < steps) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }, [groundHeight, x0, x1, z, width]);
}

function VillageRoads({ mundo, vila }: { mundo: Mundo; vila: Vila }) {
  const { ponte, alturaDoChao, limites } = mundo;
  const { urbano, ruasX, ruasZ, larguraRua } = vila;
  const slope = useSlopeRoadGeometry(alturaDoChao, ponte.x1 - 0.5, urbano.minX + 2, 0, larguraRua);
  const top = alturaDoChao(urbano.minX + 2);
  const spanX = ruasX.at(-1)! - ruasX[0] + larguraRua;
  const spanZ = ruasZ.at(-1)! - ruasZ[0] + larguraRua;
  const centerX = (ruasX[0] + ruasX.at(-1)!) / 2;
  const centerZ = (ruasZ[0] + ruasZ.at(-1)!) / 2;
  const margemOeste = ponte.x0 - limites.minX;

  return (
    <group>
      {/* Bairro Remoto avulso: estradinha da margem oeste até o portal de volta. */}
      {mundo.tipo === "remoto" && (
      <mesh
        position={[limites.minX + margemOeste / 2, alturaDoChao(limites.minX) + 0.05, 0]}
        rotation-x={-Math.PI / 2}
        receiveShadow
      >
        <planeGeometry args={[margemOeste + 0.5, larguraRua]} />
        <meshStandardMaterial color={DIRT} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      )}
      <mesh geometry={slope} receiveShadow>
        <meshStandardMaterial color={DIRT} />
      </mesh>
      {ruasX.map((x) => (
        <mesh key={`x${x}`} position={[x, top + 0.03, centerZ]} rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[larguraRua, spanZ]} />
          <meshStandardMaterial color={DIRT} polygonOffset polygonOffsetFactor={-1} />
        </mesh>
      ))}
      {ruasZ.map((z) => (
        <mesh key={`z${z}`} position={[centerX, top + 0.04, z]} rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[spanX, larguraRua]} />
          <meshStandardMaterial color={DIRT} polygonOffset polygonOffsetFactor={-2} />
        </mesh>
      ))}
    </group>
  );
}

function CityRoads({ mundo }: { mundo: Mundo }) {
  const r = useMemo(() => ruasDaCidade(mundo), [mundo]);
  const grama = corDaVegetacao(mundo);
  const { urbano, ponte, praca, larguraRua } = mundo;
  return (
    <>
      <mesh
        position={[(urbano.minX + urbano.maxX) / 2, ASPHALT_Y, (urbano.minZ + urbano.maxZ) / 2]}
        rotation-x={-Math.PI / 2}
        receiveShadow
      >
        <planeGeometry args={[urbano.maxX - urbano.minX, urbano.maxZ - urbano.minZ]} />
        <meshStandardMaterial color="#858a90" polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      {/* Avenida da cidade até a ponte (do outro lado começa a estrada do Bairro Remoto). */}
      <mesh position={[(urbano.maxX + ponte.x0) / 2, ASPHALT_Y, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[ponte.x0 - urbano.maxX + 0.5, larguraRua]} />
        <meshStandardMaterial color="#858a90" polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      <InstancedParts parts={SIDEWALK} instances={r.sidewalk} />
      <InstancedParts parts={gramadoDoLote(grama)} instances={r.lot} />
      <InstancedParts parts={PARKING} instances={r.parking} />
      <InstancedParts parts={DASH} instances={r.dash} shadows={false} />
      <InstancedParts parts={CROSSWALK} instances={r.crosswalk} shadows={false} />
      <InstancedParts parts={LAMP} instances={r.lamp} />
      <InstancedParts parts={BENCH} instances={r.bench} />
      <InstancedParts parts={BIN} instances={r.bin} />
      {praca && <Plaza praca={praca} grama={grama} />}
    </>
  );
}

export function Roads() {
  const mundo = useMundo();
  return (
    <>
      {mundo.tipo === "cidade" && <CityRoads mundo={mundo} />}
      {mundo.vila && <VillageRoads mundo={mundo} vila={mundo.vila} />}
    </>
  );
}
