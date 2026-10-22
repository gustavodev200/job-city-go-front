"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Instance, Part, Shape } from "./facades";

// Unit geometries (non-indexed, position + normal only) so every part can be merged.
function prepare(geometry: THREE.BufferGeometry, flatNormals = false) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  g.deleteAttribute("uv");
  if (flatNormals) g.computeVertexNormals();
  return g;
}

/** Triangular prism for gable roofs: ridge along x, base at y = -0.5, apex at y = 0.5. */
function prismGeometry() {
  const shape = new THREE.Shape([
    new THREE.Vector2(-0.5, -0.5),
    new THREE.Vector2(0.5, -0.5),
    new THREE.Vector2(0, 0.5),
  ]);
  const g = new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false });
  // Shape lives in XY (x = depth axis here); rotate so the extrusion runs along x.
  g.translate(0, 0, -0.5);
  g.rotateY(Math.PI / 2);
  return g;
}

const GEOMETRIES: Record<Shape, THREE.BufferGeometry> = {
  box: prepare(new THREE.BoxGeometry(1, 1, 1)),
  rounded: prepare(new RoundedBoxGeometry(1, 1, 1, 2, 0.06)),
  pyramid: prepare(new THREE.ConeGeometry(Math.SQRT1_2, 1, 4).rotateY(Math.PI / 4), true),
  prism: prepare(prismGeometry(), true),
  cylinder: prepare(new THREE.CylinderGeometry(0.5, 0.5, 1, 14)),
  cone: prepare(new THREE.ConeGeometry(0.5, 1, 9), true),
  sphere: prepare(new THREE.SphereGeometry(0.5, 12, 9)),
  plane: new THREE.PlaneGeometry(1, 1),
};

const SOLID_MATERIAL = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0 });
const LIT_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#ffe6b0",
  emissive: "#ffc46a",
  emissiveIntensity: 0.75,
  roughness: 0.35,
});
const GLASS_MATERIAL = new THREE.MeshStandardMaterial({ color: "#9cc4d8", roughness: 0.18, metalness: 0.05 });
const DARK_GLASS_MATERIAL = new THREE.MeshStandardMaterial({ color: "#4d5b68", roughness: 0.3 });

const DIM = new THREE.Color(0.6, 0.61, 0.65);
const WHITE = new THREE.Color(1, 1, 1);

const labelMaterials = new Map<string, THREE.MeshBasicMaterial>();

function labelMaterial({ text, background }: NonNullable<Part["label"]>) {
  const key = `${text}|${background}`;
  const cached = labelMaterials.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 144;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = background;
  ctx.beginPath();
  ctx.roundRect(4, 4, 504, 136, 40);
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 76px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 78);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, toneMapped: false });
  labelMaterials.set(key, material);
  return material;
}

const _euler = new THREE.Euler();
const _color = new THREE.Color();

function partMatrix(part: Part) {
  _euler.set(...(part.rot ?? [0, 0, 0]));
  return new THREE.Matrix4().compose(
    new THREE.Vector3(...part.pos),
    new THREE.Quaternion().setFromEuler(_euler),
    new THREE.Vector3(...part.size),
  );
}

/** Bakes the parts into one geometry; solid parts carry their color as a vertex attribute. */
function mergeParts(parts: readonly Part[], withColor: boolean) {
  if (parts.length === 0) return null;
  const pieces = parts.map((part) => {
    const g = GEOMETRIES[part.shape].clone().applyMatrix4(partMatrix(part));
    if (withColor) {
      _color.set(part.color);
      const colors = new Float32Array(g.attributes.position.count * 3);
      for (let i = 0; i < colors.length; i += 3) _color.toArray(colors, i);
      g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    }
    return g;
  });
  return mergeGeometries(pieces);
}

type Merged = { solid: THREE.BufferGeometry | null; glow: THREE.BufferGeometry | null; labels: Part[] };
const mergedCache = new WeakMap<readonly Part[], Merged>();

function getMerged(parts: readonly Part[]) {
  let merged = mergedCache.get(parts);
  if (!merged) {
    merged = {
      solid: mergeParts(parts.filter((p) => !p.glow && !p.label), true),
      glow: mergeParts(parts.filter((p) => p.glow), false),
      labels: parts.filter((p) => p.label),
    };
    mergedCache.set(parts, merged);
  }
  return merged;
}

const _matrix = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _pos = new THREE.Vector3();
const _scale = new THREE.Vector3();

function instanceMatrix(inst: Instance) {
  _pos.set(inst.x, inst.y, inst.z);
  _quat.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, inst.rotY ?? 0);
  _scale.setScalar(inst.scale ?? 1);
  return _matrix.compose(_pos, _quat, _scale);
}

/** Small per-instance brightness variation so repeated objects don't look cloned. */
function variation(inst: Instance) {
  const h = Math.sin(inst.x * 12.9898 + inst.z * 78.233) * 43758.5453;
  return 0.93 + (h - Math.floor(h)) * 0.12;
}

type MeshProps = {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  instances: Instance[];
  tint?: (inst: Instance) => THREE.Color;
  shadows: boolean;
};

function Mesh({ geometry, material, instances, tint, shadows }: MeshProps) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    instances.forEach((inst, i) => {
      mesh.setMatrixAt(i, instanceMatrix(inst));
      if (tint) mesh.setColorAt(i, tint(inst));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [instances, tint]);

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, instances.length]}
      castShadow={shadows}
      receiveShadow={shadows}
    />
  );
}

const solidTint = (inst: Instance) => (inst.dim ? DIM.clone() : WHITE.clone().multiplyScalar(variation(inst)));
const labelTint = (inst: Instance) => (inst.dim ? DIM : WHITE);

/**
 * Draws a construction (list of parts) on every instance. Parts are merged, so each
 * construction costs one draw call for solids plus one per window state and label.
 */
export function InstancedParts({
  parts,
  instances,
  shadows = true,
}: {
  parts: readonly Part[];
  instances: Instance[];
  shadows?: boolean;
}) {
  const merged = getMerged(parts);
  const [lit, glass, dark] = useMemo(
    () => [
      instances.filter((i) => i.lit),
      instances.filter((i) => !i.lit && !i.dim),
      instances.filter((i) => !i.lit && i.dim),
    ],
    [instances],
  );

  if (instances.length === 0) return null;
  return (
    <group>
      {merged.solid && (
        <Mesh geometry={merged.solid} material={SOLID_MATERIAL} instances={instances} tint={solidTint} shadows={shadows} />
      )}
      {merged.glow &&
        (
          [
            [lit, LIT_MATERIAL],
            [glass, GLASS_MATERIAL],
            [dark, DARK_GLASS_MATERIAL],
          ] as const
        ).map(
          ([list, material]) =>
            list.length > 0 && (
              <Mesh key={material.uuid} geometry={merged.glow!} material={material} instances={list} shadows={false} />
            ),
        )}
      {merged.labels.map((part, i) => (
        <LabelMesh key={i} part={part} instances={instances} />
      ))}
    </group>
  );
}

function LabelMesh({ part, instances }: { part: Part; instances: Instance[] }) {
  const geometry = useMemo(() => GEOMETRIES.plane.clone().applyMatrix4(partMatrix(part)), [part]);
  return (
    <Mesh geometry={geometry} material={labelMaterial(part.label!)} instances={instances} tint={labelTint} shadows={false} />
  );
}
