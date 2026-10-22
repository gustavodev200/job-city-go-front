"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { BRIDGE, HILL, RIVER, groundHeight } from "@/data/mapa";

const GROUND = { minX: -170, maxX: 270, minZ: -170, maxZ: 170, step: 2 };

const GRASS = new THREE.Color("#a3c98a");
const GRASS_LIGHT = new THREE.Color("#b6d792");
const GRASS_DARK = new THREE.Color("#8fbc76");
const HIGHLAND = new THREE.Color("#8fbd78");
const SAND = new THREE.Color("#ddcd9f");

/** Cheap smooth noise in [-1, 1] for grass patches. */
const patches = (x: number, z: number) =>
  Math.sin(x * 0.09) * Math.cos(z * 0.075) * 0.6 + Math.sin(x * 0.23 + z * 0.19) * 0.4;

function useGroundGeometry() {
  return useMemo(() => {
    const width = GROUND.maxX - GROUND.minX;
    const depth = GROUND.maxZ - GROUND.minZ;
    const geometry = new THREE.PlaneGeometry(width, depth, width / GROUND.step, depth / GROUND.step);
    geometry.rotateX(-Math.PI / 2);
    geometry.translate((GROUND.minX + GROUND.maxX) / 2, 0, (GROUND.minZ + GROUND.maxZ) / 2);

    const position = geometry.attributes.position;
    const colors = new Float32Array(position.count * 3);
    const color = new THREE.Color();
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const z = position.getZ(i);
      const y = groundHeight(x);
      position.setY(i, y);
      const n = patches(x, z);
      color.copy(GRASS).lerp(n > 0 ? GRASS_LIGHT : GRASS_DARK, Math.abs(n) * 0.7);
      color.lerp(HIGHLAND, (Math.max(0, y) / HILL.height) * 0.6);
      // Sandy banks blend into the river bed.
      color.lerp(SAND, THREE.MathUtils.smoothstep(-y, -0.05, 0.4));
      color.toArray(colors, i * 3);
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    return geometry;
  }, []);
}

const BRIDGE_LENGTH = BRIDGE.x1 - BRIDGE.x0;
const BRIDGE_CENTER = (BRIDGE.x0 + BRIDGE.x1) / 2;

function Bridge() {
  return (
    <group position={[BRIDGE_CENTER, 0, 0]}>
      <mesh position={[0, BRIDGE.deckTop - 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[BRIDGE_LENGTH, 0.5, BRIDGE.halfWidth * 2 + 0.6]} />
        <meshStandardMaterial color="#cfcac0" />
      </mesh>
      <mesh position={[0, BRIDGE.deckTop + 0.01, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[BRIDGE_LENGTH, BRIDGE.halfWidth * 2 - 0.6]} />
        <meshStandardMaterial color="#8e9196" polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[0, BRIDGE.deckTop + 0.45, side * (BRIDGE.halfWidth + 0.15)]} castShadow>
          <boxGeometry args={[BRIDGE_LENGTH, 0.9, 0.3]} />
          <meshStandardMaterial color="#e2ddd2" />
        </mesh>
      ))}
      {[-6, 0, 6].map((dx) => (
        <mesh key={dx} position={[dx, -1.2, 0]} castShadow>
          <boxGeometry args={[1.2, 2.6, BRIDGE.halfWidth * 2 - 1]} />
          <meshStandardMaterial color="#b9b4aa" />
        </mesh>
      ))}
    </group>
  );
}

export function Terrain() {
  const ground = useGroundGeometry();
  return (
    <>
      <mesh geometry={ground} receiveShadow>
        <meshStandardMaterial vertexColors roughness={1} />
      </mesh>
      <mesh position={[RIVER.x, RIVER.waterY, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[RIVER.halfWidth * 2 + 6, GROUND.maxZ - GROUND.minZ]} />
        <meshStandardMaterial color="#86d0e6" roughness={0.15} metalness={0.05} transparent opacity={0.9} />
      </mesh>
      <Bridge />
    </>
  );
}
