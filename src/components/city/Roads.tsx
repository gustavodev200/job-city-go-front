"use client";

import { useMemo } from "react";
import * as THREE from "three";
import {
  BRIDGE,
  CITY_BLOCK_CENTERS,
  CITY_BLOCK_SIZE,
  CITY_HALF,
  CITY_ROAD_LINES,
  CITY_ROAD_WIDTH,
  FOUNTAIN_RADIUS,
  LOT_TOP,
  PLAZA,
  VILLAGE_BOUNDS,
  VILLAGE_ROAD_WIDTH,
  VILLAGE_ROAD_XS,
  VILLAGE_ROAD_ZS,
  groundHeight,
} from "@/data/mapa";
import type { Instance, Part } from "./facades";
import { InstancedParts } from "./Instanced";
import { parkingLot } from "./layout";

const ASPHALT_Y = 0.04;
const DIRT = "#d9c39a";

const BLOCKS = CITY_BLOCK_CENTERS.flatMap((x) => CITY_BLOCK_CENTERS.map((z) => ({ x, z })));
const isPlaza = (b: { x: number; z: number }) => b.x === PLAZA.x && b.z === PLAZA.z;

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
const LOT: Part[] = [
  { shape: "box", size: [LOT_SIZE, LOT_TOP, LOT_SIZE], pos: [0, LOT_TOP / 2, 0], color: "#a6cf8b" },
];
// Paved parking lot with painted bays.
const PARKING: Part[] = [
  { shape: "box", size: [LOT_SIZE, LOT_TOP, LOT_SIZE], pos: [0, LOT_TOP / 2, 0], color: "#8f949a" },
  ...[-6, -3, 0, 3, 6].flatMap((x) =>
    [-3.2, 3.2].map((z): Part => ({ shape: "box", size: [0.12, 0.02, 4.4], pos: [x, LOT_TOP + 0.01, z], color: PAINT })),
  ),
];
const isParking = (b: { x: number; z: number }) => parkingLot !== null && b.x === parkingLot.x && b.z === parkingLot.z;
const sidewalkInstances: Instance[] = BLOCKS.map(({ x, z }) => ({ x, y: 0, z }));
const lotInstances: Instance[] = BLOCKS.filter((b) => !isPlaza(b) && !isParking(b)).map(({ x, z }) => ({ x, y: 0, z }));
const parkingInstances: Instance[] = parkingLot ? [{ x: parkingLot.x, y: 0, z: parkingLot.z }] : [];

// Center dashes, only between intersections.
const DASH: Part[] = [{ shape: "box", size: [1.8, 0.02, 0.22], pos: [0, ASPHALT_Y + 0.01, 0], color: PAINT }];
const dashInstances: Instance[] = CITY_ROAD_LINES.flatMap((line) =>
  CITY_BLOCK_CENTERS.flatMap((c) =>
    [-4, 0, 4].flatMap((d) => [
      { x: c + d, y: 0, z: line },
      { x: line, y: 0, z: c + d, rotY: Math.PI / 2 },
    ]),
  ),
);

// Zebra crossings on every approach of the inner intersections.
const CROSSWALK: Part[] = [-2.4, -1.2, 0, 1.2, 2.4].map((z) => ({
  shape: "box",
  size: [1.6, 0.02, 0.55],
  pos: [0, ASPHALT_Y + 0.012, z],
  color: PAINT,
}));
const INNER_LINES = CITY_ROAD_LINES.slice(1, -1);
const crosswalkInstances: Instance[] = INNER_LINES.flatMap((rx) =>
  INNER_LINES.flatMap((rz) => [
    { x: rx + 4.2, y: 0, z: rz },
    { x: rx - 4.2, y: 0, z: rz },
    { x: rx, y: 0, z: rz + 4.2, rotY: Math.PI / 2 },
    { x: rx, y: 0, z: rz - 4.2, rotY: Math.PI / 2 },
  ]),
);

// Street lights on the front corners of every block.
const LAMP: Part[] = [
  { shape: "cylinder", size: [0.34, 0.35, 0.34], pos: [0, 0.175, 0], color: "#2f463a" },
  { shape: "cylinder", size: [0.16, 4.2, 0.16], pos: [0, 2.1, 0], color: "#3e5a4a" },
  { shape: "box", size: [0.9, 0.1, 0.1], pos: [-0.35, 4.2, 0], color: "#3e5a4a" },
  { shape: "cone", size: [0.6, 0.3, 0.6], pos: [-0.75, 4.25, 0], color: "#3e5a4a" },
  { shape: "sphere", size: [0.42, 0.42, 0.42], pos: [-0.75, 4.0, 0], color: "", glow: true },
];
const lampInstances: Instance[] = BLOCKS.flatMap(({ x, z }) =>
  [-1, 1].map((side) => ({ x: x + side * 6.5, y: 0.15, z: z + 6.5, rotY: side === -1 ? Math.PI : 0, lit: true })),
);

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
const benchInstances: Instance[] = [
  ...BLOCKS.filter((b) => !isPlaza(b)).map(({ x, z }) => ({ x: x - 3.6, y: 0.15, z: z + 6.6 })),
  // Plaza benches facing the fountain.
  ...[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((angle) => ({
    x: PLAZA.x + Math.sin(angle) * 5.3,
    y: LOT_TOP,
    z: PLAZA.z + Math.cos(angle) * 5.3,
    rotY: angle + Math.PI,
  })),
];
const binInstances: Instance[] = BLOCKS.map(({ x, z }) => ({ x: x - 5.4, y: 0.15, z: z + 6.6 }));

function Plaza() {
  return (
    <group position={[PLAZA.x, 0, PLAZA.z]}>
      <mesh position={[0, 0.09, 0]} receiveShadow>
        <boxGeometry args={[CITY_BLOCK_SIZE - 1.6, LOT_TOP, CITY_BLOCK_SIZE - 1.6]} />
        <meshStandardMaterial color="#efe3c9" />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 4.1, 0.2, sz * 4.1]} receiveShadow>
            <boxGeometry args={[3.6, 0.06, 3.6]} />
            <meshStandardMaterial color="#9fcd82" />
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
function useSlopeRoadGeometry(x0: number, x1: number, z: number, width: number) {
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
  }, [x0, x1, z, width]);
}

function VillageRoads() {
  const slope = useSlopeRoadGeometry(BRIDGE.x1 - 0.5, VILLAGE_BOUNDS.minX + 2, 0, VILLAGE_ROAD_WIDTH);
  const top = groundHeight(VILLAGE_BOUNDS.minX + 2);
  const spanX = VILLAGE_BOUNDS.maxX - VILLAGE_BOUNDS.minX;
  const spanZ = VILLAGE_BOUNDS.maxZ - VILLAGE_BOUNDS.minZ;
  const centerX = (VILLAGE_BOUNDS.minX + VILLAGE_BOUNDS.maxX) / 2;
  const centerZ = (VILLAGE_BOUNDS.minZ + VILLAGE_BOUNDS.maxZ) / 2;

  return (
    <group>
      <mesh geometry={slope} receiveShadow>
        <meshStandardMaterial color={DIRT} />
      </mesh>
      {VILLAGE_ROAD_XS.map((x) => (
        <mesh key={`x${x}`} position={[x, top + 0.03, centerZ]} rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[VILLAGE_ROAD_WIDTH, spanZ]} />
          <meshStandardMaterial color={DIRT} polygonOffset polygonOffsetFactor={-1} />
        </mesh>
      ))}
      {VILLAGE_ROAD_ZS.map((z) => (
        <mesh key={`z${z}`} position={[centerX, top + 0.04, z]} rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[spanX, VILLAGE_ROAD_WIDTH]} />
          <meshStandardMaterial color={DIRT} polygonOffset polygonOffsetFactor={-2} />
        </mesh>
      ))}
    </group>
  );
}

export function Roads() {
  const cityRoadLength = CITY_HALF * 2;
  return (
    <>
      <mesh position={[0, ASPHALT_Y, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[cityRoadLength, cityRoadLength]} />
        <meshStandardMaterial color="#858a90" polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      {/* Avenida da cidade até a ponte */}
      <mesh position={[(CITY_HALF + BRIDGE.x0) / 2, ASPHALT_Y, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[BRIDGE.x0 - CITY_HALF + 0.5, CITY_ROAD_WIDTH]} />
        <meshStandardMaterial color="#858a90" polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      <InstancedParts parts={SIDEWALK} instances={sidewalkInstances} />
      <InstancedParts parts={LOT} instances={lotInstances} />
      <InstancedParts parts={PARKING} instances={parkingInstances} />
      <InstancedParts parts={DASH} instances={dashInstances} shadows={false} />
      <InstancedParts parts={CROSSWALK} instances={crosswalkInstances} shadows={false} />
      <InstancedParts parts={LAMP} instances={lampInstances} />
      <InstancedParts parts={BENCH} instances={benchInstances} />
      <InstancedParts parts={BIN} instances={binInstances} />
      <Plaza />
      <VillageRoads />
    </>
  );
}
