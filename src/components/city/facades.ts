import type { Categoria } from "@/data/vagas";

// Each construction is a list of parts merged into one instanced geometry (see Instanced.tsx).
// Building front = +z, origin on the ground at the center. City lots span ±6.2.

export type Shape = "box" | "rounded" | "pyramid" | "prism" | "cylinder" | "cone" | "sphere" | "plane";
type Vec3 = readonly [number, number, number];

export type Part = {
  shape: Shape;
  size: Vec3;
  pos: Vec3;
  rot?: Vec3;
  color: string;
  /** Window/light: lit when the instance is `lit`, plain glass otherwise, dark when `dim`. */
  glow?: boolean;
  /** Plane with text (badge/sign). */
  label?: { text: string; background: string };
};

export type Instance = {
  x: number;
  y: number;
  z: number;
  rotY?: number;
  scale?: number;
  lit?: boolean;
  /** Closed job: building switched off. */
  dim?: boolean;
};

export type Facade = {
  parts: readonly Part[];
  /** Width × depth used for collision. */
  footprint: readonly [number, number];
  /** Height of the floating marker (also used as the building height for the camera). */
  markerY: number;
  /** "Híbrido" badge above the door. */
  badge: Part;
};

// ── Palette ──────────────────────────────────────────────────────────────
const CREAM = "#f5ecd9";
const CREAM_SHADE = "#e4d5bb";
const TRIM = "#fffaf0";
const WOOD = "#a3714a";
const WOOD_DARK = "#6f4a30";
const ORANGE = "#e57a3c";
const TERRACOTTA = "#c9663a";
const CONCRETE = "#cdc7bb";
const METAL = "#7d858d";
const PAVING = "#e2d8c6";
const LEAF = "#6aae55";
const YELLOW = "#f2c230";
const GREEN_ROOF = "#5c9e6e";

// ── Building blocks ─────────────────────────────────────────────────────
const box = (size: Vec3, pos: Vec3, color: string, rot?: Vec3): Part => ({ shape: "box", size, pos, color, rot });
const rounded = (size: Vec3, pos: Vec3, color: string): Part => ({ shape: "rounded", size, pos, color });
const cyl = (size: Vec3, pos: Vec3, color: string, rot?: Vec3): Part => ({ shape: "cylinder", size, pos, color, rot });
const sphere = (size: Vec3, pos: Vec3, color: string): Part => ({ shape: "sphere", size, pos, color });
const glass = (size: Vec3, pos: Vec3): Part => ({ shape: "box", size, pos, color: "", glow: true });

/** Framed window with sill, lintel and mullion. `face` is the wall plane (z for "z", x for "x±"). */
function windowAt(dir: "z" | "x+" | "x-", [x, y, z]: Vec3, w: number, h: number, frame = TRIM): Part[] {
  if (dir === "z") {
    return [
      glass([w, h, 0.1], [x, y, z + 0.02]),
      box([w + 0.3, 0.12, 0.26], [x, y - h / 2 - 0.06, z + 0.08], frame),
      box([w + 0.2, 0.14, 0.14], [x, y + h / 2 + 0.07, z + 0.03], frame),
      box([0.08, h, 0.12], [x, y, z + 0.05], frame),
    ];
  }
  const s = dir === "x+" ? 1 : -1;
  return [
    glass([0.1, h, w], [x + 0.02 * s, y, z]),
    box([0.26, 0.12, w + 0.3], [x + 0.08 * s, y - h / 2 - 0.06, z], frame),
    box([0.14, 0.14, w + 0.2], [x + 0.03 * s, y + h / 2 + 0.07, z], frame),
    box([0.12, h, 0.08], [x + 0.05 * s, y, z], frame),
  ];
}

/** Gable roof (ridge along x): wall-colored gable ends plus two sloped slabs and a ridge cap. */
function gableRoof(w: number, d: number, baseY: number, rise: number, roof: string, wall: string): Part[] {
  const half = d / 2 + 0.35;
  const angle = Math.atan2(rise, half);
  const slope = Math.hypot(half, rise) + 0.1;
  return [
    { shape: "prism", size: [w, rise, d], pos: [0, baseY + rise / 2, 0], color: wall },
    box([w + 0.7, 0.22, slope], [0, baseY + rise / 2, half / 2], roof, [angle, 0, 0]),
    box([w + 0.7, 0.22, slope], [0, baseY + rise / 2, -half / 2], roof, [-angle, 0, 0]),
    box([w + 0.8, 0.16, 0.36], [0, baseY + rise + 0.06, 0], roof),
  ];
}

/** Paved walkway from the building front to the sidewalk. */
const walkway = (x: number, front: number, width = 1.8): Part =>
  box([width, 0.04, 6.2 - front], [x, 0.02, (front + 6.2) / 2], PAVING);

const planter = (x: number, z: number): Part[] => [
  box([0.9, 0.5, 0.6], [x, 0.25, z], WOOD),
  sphere([0.95, 0.7, 0.7], [x, 0.7, z], LEAF),
];

const bench = (x: number, z: number): Part[] => [
  box([1.8, 0.1, 0.5], [x, 0.48, z], WOOD),
  box([1.8, 0.4, 0.08], [x, 0.78, z - 0.22], WOOD),
  box([0.08, 0.48, 0.45], [x - 0.75, 0.24, z], "#4a4f55"),
  box([0.08, 0.48, 0.45], [x + 0.75, 0.24, z], "#4a4f55"),
];

/** Striped awning tilted towards the street. */
function awning(width: number, y: number, z: number, depth: number, stripe: string, count: number): Part[] {
  const tilt = 0.28;
  const stripeW = width / (count * 2 - 1);
  const frontZ = z + (depth / 2) * Math.cos(tilt);
  const frontY = y - (depth / 2) * Math.sin(tilt);
  return [
    box([width, 0.2, depth], [0, y, z], "#fbf3e6", [tilt, 0, 0]),
    ...Array.from({ length: count }, (_, i): Part =>
      box([stripeW, 0.22, depth + 0.02], [-width / 2 + stripeW / 2 + i * 2 * stripeW, y + 0.005, z], stripe, [tilt, 0, 0]),
    ),
    box([width, 0.32, 0.06], [0, frontY - 0.14, frontZ], stripe),
  ];
}

const HIBRIDO = { text: "HÍBRIDO", background: "#7b5cff" };
const REMOTO = { text: "REMOTO", background: "#1d9f95" };

const badge = (pos: Vec3, width = 2, height = 0.5): Part => ({
  shape: "plane",
  size: [width, height, 1],
  pos,
  color: "#ffffff",
  label: HIBRIDO,
});

const OFFICE_FLOORS = [4.0, 6.2, 8.4, 10.6, 12.8];
const OFFICE_COLS = [-2.1, 0, 2.1];

export const FACADES: Record<Categoria, Facade> = {
  // Corner shop / bakery: peach plaster, striped awning, display windows, café table.
  comercio: {
    footprint: [9.4, 8.6],
    markerY: 7.5,
    badge: badge([3.2, 2.95, 3.68], 1.7, 0.4),
    parts: [
      rounded([9, 4.4, 7], [0, 2.2, 0], "#f6c9a0"),
      box([9.15, 0.45, 7.15], [0, 0.225, 0], "#d9ab82"),
      box([9.4, 0.35, 7.4], [0, 4.45, 0], TERRACOTTA),
      box([9.1, 0.5, 7.1], [0, 4.85, 0], CREAM_SHADE),
      box([9.3, 0.12, 7.3], [0, 5.15, 0], TRIM),
      ...windowAt("z", [-2.9, 1.65, 3.5], 2.4, 1.9, WOOD),
      ...windowAt("z", [-0.2, 1.65, 3.5], 2.4, 1.9, WOOD),
      box([1.7, 2.7, 0.16], [3.2, 1.35, 3.52], WOOD_DARK),
      glass([1.2, 2.2, 0.1], [3.2, 1.2, 3.58]),
      ...awning(9.2, 3.35, 4.35, 1.9, "#e2643a", 4),
      rounded([4.4, 0.85, 0.22], [0.4, 3.95, 3.62], "#fff3e0"),
      cyl([0.75, 0.1, 0.75], [-1.2, 3.95, 3.75], ORANGE, [Math.PI / 2, 0, 0]),
      box([2.2, 0.16, 0.05], [0.8, 4.07, 3.74], WOOD_DARK),
      box([1.6, 0.12, 0.05], [0.5, 3.82, 3.74], ORANGE),
      ...planter(-4.1, 4.0),
      ...planter(1.4, 4.0),
      box([0.9, 0.4, 0.6], [-2.0, 0.35, 4.0], WOOD),
      sphere([0.8, 0.28, 0.5], [-2.0, 0.6, 4.0], "#e8833a"),
      box([0.9, 0.4, 0.6], [-1.0, 0.35, 4.0], WOOD),
      sphere([0.8, 0.28, 0.5], [-1.0, 0.6, 4.0], "#c94a3a"),
      cyl([0.9, 0.06, 0.9], [-5.5, 0.75, 2.0], TRIM),
      cyl([0.1, 0.75, 0.1], [-5.5, 0.375, 2.0], METAL),
      cyl([0.06, 2.2, 0.06], [-5.5, 1.4, 2.0], METAL),
      { shape: "cone", size: [2.2, 0.6, 2.2], pos: [-5.5, 2.45, 2.0], color: "#fbf3e6" },
      box([1.4, 0.7, 1.1], [-2, 5.45, -1.4], "#c9cdd1"),
      walkway(3.2, 3.5),
    ],
  },

  // Office tower: cream facade with pilasters, floor bands, framed windows, balconies and a rooftop sign.
  escritorio: {
    footprint: [7.6, 7.6],
    markerY: 18.5,
    badge: badge([0, 3.2, 3.78], 2, 0.45),
    parts: [
      box([7, 14, 7], [0, 7, 0], CREAM),
      box([7.3, 0.45, 7.3], [0, 0.225, 0], "#cfc4b2"),
      ...[-3.5, 3.5].flatMap((x) => [-3.5, 3.5].map((z) => box([0.55, 13.6, 0.55], [x, 7.25, z], CREAM_SHADE))),
      ...[2.9, 5.1, 7.3, 9.5, 11.7].map((y) => box([7.25, 0.2, 7.25], [0, y, 0], CREAM_SHADE)),
      box([7.7, 0.5, 7.7], [0, 14.2, 0], "#d8ccb6"),
      box([7.4, 0.4, 7.4], [0, 14.6, 0], CREAM),
      ...OFFICE_FLOORS.flatMap((y) => [
        ...OFFICE_COLS.flatMap((c) => windowAt("z", [c, y, 3.5], 1.25, 1.45)),
        ...OFFICE_COLS.flatMap((c) => windowAt("x+", [3.5, y, c], 1.25, 1.45)),
        ...OFFICE_COLS.flatMap((c) => windowAt("x-", [-3.5, y, c], 1.25, 1.45)),
      ]),
      glass([4.2, 2.1, 0.1], [0, 1.5, 3.52]),
      ...[-1.4, 0, 1.4].map((x) => box([0.1, 2.1, 0.14], [x, 1.5, 3.56], "#6d757d")),
      box([4.3, 0.12, 0.14], [0, 2.55, 3.56], "#6d757d"),
      rounded([5.4, 0.25, 1.8], [0, 2.8, 4.3], "#e9e2d4"),
      cyl([0.12, 2.7, 0.12], [-2.4, 1.35, 5.0], METAL),
      cyl([0.12, 2.7, 0.12], [2.4, 1.35, 5.0], METAL),
      ...[6.2, 10.6].flatMap((y) => [
        box([2.0, 0.14, 0.7], [0, y - 0.95, 3.85], CREAM_SHADE),
        box([2.0, 0.5, 0.06], [0, y - 0.63, 4.18], TRIM),
      ]),
      box([2.4, 1.0, 1.8], [1.2, 15.3, -1.2], "#b8b2a8"),
      cyl([1.2, 1.4, 1.2], [-1.6, 15.5, -1.4], "#d1ccc2"),
      box([0.15, 1.2, 0.15], [-0.7, 15.2, 3.0], METAL),
      box([0.15, 1.2, 0.15], [0.7, 15.2, 3.0], METAL),
      rounded([2.2, 2.2, 0.3], [0, 16.6, 3.0], "#2f86b0"),
      sphere([0.55, 0.55, 0.15], [0, 17.0, 3.17], TRIM),
      rounded([1.0, 0.6, 0.12], [0, 16.35, 3.17], TRIM),
      ...planter(-3.0, 4.4),
      ...planter(3.0, 4.4),
      walkway(0, 3.5, 2.6),
    ],
  },

  // Clinic: white plaster, green accent band, orange canopy and a rooftop green cross.
  saude: {
    footprint: [10.4, 11],
    markerY: 9,
    badge: badge([0, 3.4, 4.12], 2, 0.48),
    parts: [
      rounded([10, 4.8, 8], [0, 2.4, 0], "#f8f5ee"),
      box([10.15, 0.4, 8.15], [0, 0.2, 0], "#cfd6d8"),
      box([10.12, 0.3, 8.12], [0, 3.4, 0], "#5fb37e"),
      box([10.4, 0.35, 8.4], [0, 4.95, 0], "#dfe9e3"),
      box([3.4, 0.5, 2.4], [-2, 5.3, -1], "#a9d9e0"),
      ...windowAt("z", [-3.4, 1.9, 4], 2.2, 1.5),
      ...windowAt("z", [3.4, 1.9, 4], 2.2, 1.5),
      ...windowAt("z", [-3.4, 4.2, 4], 2.2, 0.7),
      ...windowAt("z", [3.4, 4.2, 4], 2.2, 0.7),
      ...[-1.6, 1.8].flatMap((z) => [
        ...windowAt("x+", [5, 1.9, z], 2, 1.5),
        ...windowAt("x-", [-5, 1.9, z], 2, 1.5),
      ]),
      box([2.8, 2.6, 0.14], [0, 1.3, 3.98], "#d7dee0"),
      glass([2.4, 2.3, 0.1], [0, 1.25, 4.04]),
      rounded([3.8, 0.25, 2], [0, 2.85, 5.0], ORANGE),
      cyl([0.12, 2.7, 0.12], [-1.7, 1.35, 5.8], "#e8e3da"),
      cyl([0.12, 2.7, 0.12], [1.7, 1.35, 5.8], "#e8e3da"),
      box([0.15, 1.2, 0.15], [2.4, 5.6, 3.0], METAL),
      box([0.15, 1.2, 0.15], [4.0, 5.6, 3.0], METAL),
      rounded([2.6, 2.6, 0.3], [3.2, 6.9, 3.0], TRIM),
      box([0.7, 1.9, 0.12], [3.2, 6.9, 3.2], "#2fa25b"),
      box([1.9, 0.7, 0.12], [3.2, 6.9, 3.2], "#2fa25b"),
      ...bench(-3.6, 5.2),
      ...planter(3.6, 4.9),
      walkway(0, 4, 2.6),
    ],
  },

  // Warehouse: broad gable roof, roll-up loading bays, office corner, forklift and pallets.
  galpao: {
    footprint: [13.4, 10.6],
    markerY: 10.5,
    badge: badge([4.4, 2.5, 5.16], 1.7, 0.42),
    parts: [
      box([13, 5, 10], [0, 2.5, 0], "#ece2cf"),
      box([13.15, 0.7, 10.15], [0, 0.35, 0], "#c9bca3"),
      ...gableRoof(13, 10, 5, 1.9, GREEN_ROOF, "#ece2cf"),
      cyl([0.5, 0.6, 0.5], [-3, 7.1, 0], METAL),
      cyl([0.5, 0.6, 0.5], [3, 7.1, 0], METAL),
      ...[-4.4, -1.2].flatMap((x) => [
        box([2.9, 3.4, 0.16], [x, 1.7, 5.02], "#9aa1a8"),
        box([2.5, 3.0, 0.1], [x, 1.55, 5.08], "#c3c8cd"),
        ...[0.9, 1.6, 2.3].map((y) => box([2.5, 0.05, 0.04], [x, y, 5.14], "#9aa1a8")),
        box([0.3, 0.4, 0.2], [x - 1.2, 0.2, 5.2], "#3c4248"),
        box([0.3, 0.4, 0.2], [x + 1.2, 0.2, 5.2], "#3c4248"),
      ]),
      box([7.2, 0.18, 1.6], [-2.8, 3.75, 5.8], GREEN_ROOF),
      ...windowAt("z", [4.4, 3.5, 5], 2.4, 1.0),
      box([1.3, 2.3, 0.14], [4.4, 1.15, 5.02], "#9aa1a8"),
      box([1.1, 2.1, 0.1], [4.4, 1.05, 5.06], WOOD_DARK),
      rounded([2.6, 0.7, 0.2], [4.4, 4.55, 5.1], GREEN_ROOF),
      box([0.45, 0.45, 0.06], [3.6, 4.55, 5.22], TRIM),
      box([1.2, 0.14, 0.06], [4.7, 4.6, 5.22], TRIM),
      box([13, 0.05, 1.2], [0, 0.025, 5.6], CONCRETE),
      cyl([0.25, 0.9, 0.25], [0.6, 0.45, 5.9], YELLOW),
      cyl([0.25, 0.9, 0.25], [2.6, 0.45, 5.9], YELLOW),
      box([1.2, 0.15, 1.0], [-5.8, 0.075, 5.6], WOOD),
      box([1.1, 0.8, 0.9], [-5.8, 0.55, 5.6], "#c99a55"),
      rounded([1.0, 0.9, 1.3], [1.6, 0.75, 5.5], YELLOW),
      box([1.0, 0.06, 0.9], [1.6, 1.95, 5.35], "#3c4248"),
      box([0.08, 0.8, 0.08], [1.15, 1.6, 5.0], "#3c4248"),
      box([0.08, 0.8, 0.08], [2.05, 1.6, 5.0], "#3c4248"),
      box([0.1, 1.8, 0.1], [1.3, 1.0, 6.2], "#3c4248"),
      box([0.1, 1.8, 0.1], [1.9, 1.0, 6.2], "#3c4248"),
      cyl([0.5, 1.05, 0.5], [1.6, 0.25, 5.1], "#2b2f34", [0, 0, Math.PI / 2]),
      cyl([0.5, 1.05, 0.5], [1.6, 0.25, 5.9], "#2b2f34", [0, 0, Math.PI / 2]),
    ],
  },

  // Construction site: concrete frame, brick walls, scaffolding, lattice crane, mixer and fence.
  obra: {
    footprint: [10, 8.6],
    markerY: 12,
    badge: badge([0, 1.9, 6.2], 2.2, 0.55),
    parts: [
      box([9.4, 0.4, 8.4], [0, 0.2, 0], CONCRETE),
      ...[3.2, 6.2, 9.2].map((y) => box([9, 0.3, 8], [0, y, 0], "#bdb8ae")),
      ...[-4.2, 0, 4.2].flatMap((x) => [-3.7, 3.7].map((z) => box([0.45, 9.2, 0.45], [x, 4.6, z], "#aaa59c"))),
      box([9, 2.8, 0.3], [0, 1.8, -3.8], "#d97a4f"),
      box([0.3, 2.8, 7.4], [-4.2, 1.8, 0], "#d97a4f"),
      box([5, 2.6, 0.3], [-2, 4.7, -3.8], "#d97a4f"),
      cyl([0.08, 6.4, 0.08], [2.4, 3.2, 4.4], METAL),
      cyl([0.08, 6.4, 0.08], [4.6, 3.2, 4.4], METAL),
      ...[3.2, 6.2].flatMap((y) => [
        box([2.6, 0.08, 0.6], [3.5, y + 0.1, 4.4], WOOD),
        box([2.6, 0.06, 0.06], [3.5, y + 1.0, 4.65], METAL),
      ]),
      ...[-0.35, 0.35].flatMap((dx) =>
        [-0.35, 0.35].map((dz) => box([0.12, 16, 0.12], [-5.6 + dx, 8, -5.2 + dz], YELLOW)),
      ),
      ...Array.from({ length: 8 }, (_, i) => 1 + i * 2).flatMap((y) => [
        box([0.8, 0.08, 0.08], [-5.6, y, -4.85], YELLOW, [0, 0, 0.6]),
        box([0.08, 0.08, 0.8], [-5.25, y, -5.2], YELLOW, [0.6, 0, 0]),
      ]),
      box([12, 0.45, 0.55], [-2, 15.8, -5.2], YELLOW),
      box([1.6, 1, 1], [-7.2, 15.3, -5.2], METAL),
      box([1, 1, 1], [-5.6, 15.0, -4.3], YELLOW),
      glass([0.8, 0.5, 0.1], [-5.6, 15.1, -3.78]),
      box([0.05, 5, 0.05], [2.5, 13.2, -5.2], "#333333"),
      box([0.4, 0.4, 0.4], [2.5, 10.6, -5.2], "#555555"),
      glass([0.9, 0.9, 0.9], [4.2, 9.9, 3.7]),
      cyl([1.0, 1.4, 1.0], [-3.2, 1.1, 5.0], ORANGE, [0, 0, 1.2]),
      box([1.4, 0.4, 0.9], [-3.2, 0.2, 5.0], "#4a4f55"),
      { shape: "cone", size: [2.6, 1.2, 2.6], pos: [3.4, 0.6, 5.0], color: "#dcc08a" },
      box([2.4, 0.5, 0.9], [-0.2, 0.25, 5.0], "#c99a55"),
      box([1, 2.1, 1], [5.4, 1.05, -1], "#3c8fd1"),
      ...[-3.65, 3.65].map((x) => box([4.9, 1.0, 0.1], [x, 0.5, 6.1], "#f08a24")),
      cyl([0.12, 2.2, 0.12], [-1.3, 1.1, 6.1], METAL),
      cyl([0.12, 2.2, 0.12], [1.3, 1.1, 6.1], METAL),
      rounded([2.6, 0.7, 0.12], [0, 1.9, 6.1], YELLOW),
      walkway(0, 4.2, 2.4),
    ],
  },

  // School: warm brick-orange body, central clock tower, playground and picket fence.
  escola: {
    footprint: [12.4, 10],
    markerY: 14.5,
    badge: badge([0, 2.95, 5.14], 1.9, 0.45),
    parts: [
      rounded([12, 5, 8], [0, 2.5, -0.5], "#e9a96e"),
      box([12.15, 0.5, 8.15], [0, 0.25, -0.5], "#c98a55"),
      box([12.12, 0.2, 8.12], [0, 2.6, -0.5], "#f6d9b5"),
      box([12.4, 0.4, 8.4], [0, 5.15, -0.5], "#b8693d"),
      box([12.2, 0.3, 8.2], [0, 5.45, -0.5], "#f6d9b5"),
      ...[1.5, 3.8].flatMap((y) => [
        ...[-4.6, -2.6, 2.6, 4.6].flatMap((x) => windowAt("z", [x, y, 3.5], 1.4, 1.3)),
        ...[-2.5, 1.5].flatMap((z) => [
          ...windowAt("x+", [6, y, z], 1.4, 1.3),
          ...windowAt("x-", [-6, y, z], 1.4, 1.3),
        ]),
      ]),
      rounded([3, 8.5, 3], [0, 4.25, 3.5], "#f2bd85"),
      box([3.15, 0.2, 3.15], [0, 5.3, 3.5], "#f6d9b5"),
      box([3.3, 0.3, 3.3], [0, 8.4, 3.5], "#b8693d"),
      { shape: "pyramid", size: [3.6, 1.6, 3.6], pos: [0, 9.35, 3.5], color: "#b8693d" },
      cyl([1.9, 0.1, 1.9], [0, 7, 5.02], "#b8693d", [Math.PI / 2, 0, 0]),
      cyl([1.7, 0.12, 1.7], [0, 7, 5.06], TRIM, [Math.PI / 2, 0, 0]),
      box([0.08, 0.6, 0.04], [0, 7.25, 5.14], "#333333"),
      box([0.45, 0.08, 0.04], [0.2, 7, 5.14], "#333333"),
      box([1.9, 2.6, 0.14], [0, 1.3, 5.04], TRIM),
      box([1.6, 2.4, 0.1], [0, 1.2, 5.08], WOOD),
      ...windowAt("z", [0, 4.1, 5], 1.2, 1.1),
      box([2.6, 0.15, 0.6], [0, 0.075, 5.4], CONCRETE),
      box([0.1, 3, 0.1], [0, 11.6, 3.5], "#dddddd"),
      box([0.9, 0.6, 0.05], [0.5, 12.7, 3.5], "#d64545"),
      box([0.9, 0.1, 0.9], [-4.6, 1.2, 5.0], YELLOW),
      ...[-0.4, 0.4].flatMap((dx) => [-0.4, 0.4].map((dz) => cyl([0.08, 1.2, 0.08], [-4.6 + dx, 0.6, 5.0 + dz], "#e05a47"))),
      box([2.0, 0.08, 0.8], [-3.65, 0.65, 5.0], YELLOW, [0, 0, -0.6]),
      cyl([0.1, 2.4, 0.1], [4.6, 2.0, 5.2], "#e05a47", [0, 0, Math.PI / 2]),
      cyl([0.1, 2.0, 0.1], [3.4, 1.0, 5.2], "#e05a47"),
      cyl([0.1, 2.0, 0.1], [5.8, 1.0, 5.2], "#e05a47"),
      ...[4.1, 5.1].flatMap((x) => [
        box([0.03, 1.4, 0.03], [x, 1.3, 5.2], "#555555"),
        box([0.5, 0.06, 0.25], [x, 0.6, 5.2], WOOD),
      ]),
      ...[-3.6, 3.6].flatMap((x) => [
        box([4.6, 0.6, 0.06], [x, 0.3, 6.1], TRIM),
        box([4.6, 0.08, 0.1], [x, 0.55, 6.1], TRIM),
      ]),
      walkway(0, 5.7, 2.2),
    ],
  },

  // Neighborhood laundromat: blue plaster, round washer icon sign, teal awning.
  bairro: {
    footprint: [8.4, 7.6],
    markerY: 7.5,
    badge: badge([2.8, 2.47, 3.16], 1.5, 0.4),
    parts: [
      rounded([8, 4, 6], [0, 2, 0], "#a9d2e3"),
      box([8.15, 0.4, 6.15], [0, 0.2, 0], "#7fb2c7"),
      box([8.35, 0.3, 6.35], [0, 4.1, 0], TRIM),
      box([8.1, 0.35, 6.1], [0, 4.4, 0], "#8dbfd3"),
      rounded([6.6, 0.9, 0.22], [0, 3.55, 3.1], TRIM),
      cyl([0.7, 0.08, 0.7], [-2.5, 3.55, 3.25], "#2c86b0", [Math.PI / 2, 0, 0]),
      cyl([0.45, 0.09, 0.45], [-2.5, 3.55, 3.28], "#bfe6f5", [Math.PI / 2, 0, 0]),
      box([3.4, 0.18, 0.05], [0.4, 3.68, 3.24], "#2c86b0"),
      box([2.4, 0.12, 0.05], [0, 3.42, 3.24], "#3aa39a"),
      ...awning(8.2, 2.85, 3.75, 1.4, "#3aa39a", 4),
      ...windowAt("z", [-1.4, 1.55, 3], 3.6, 1.7),
      box([1.4, 2.3, 0.14], [2.8, 1.15, 3.02], TRIM),
      glass([1.1, 2.0, 0.1], [2.8, 1.05, 3.06]),
      ...planter(-3.6, 3.6),
      walkway(2.8, 3, 1.6),
    ],
  },
};

type HouseColors = { wall: string; roof: string; shutter: string };

/** Residential house: gable roof, chimney, porch, framed windows with shutters and flower boxes. */
function house({ wall, roof, shutter }: HouseColors): Part[] {
  return [
    rounded([5, 3, 4.5], [0, 1.5, 0], wall),
    box([5.15, 0.35, 4.65], [0, 0.175, 0], "#c9b597"),
    ...gableRoof(5, 4.5, 3, 1.7, roof, wall),
    box([0.6, 1.4, 0.6], [-1.4, 4.3, -0.8], "#b5643a"),
    box([0.75, 0.12, 0.75], [-1.4, 5.05, -0.8], "#8a4a2a"),
    box([1.2, 2.2, 0.12], [0, 1.1, 2.26], TRIM),
    box([1.0, 2.0, 0.1], [0, 1.0, 2.3], WOOD),
    box([2.4, 0.18, 1.2], [0, 0.09, 2.85], "#c99b6b"),
    box([2.6, 0.12, 1.3], [0, 2.55, 2.9], roof, [0.12, 0, 0]),
    cyl([0.12, 2.4, 0.12], [-1.1, 1.25, 3.4], TRIM),
    cyl([0.12, 2.4, 0.12], [1.1, 1.25, 3.4], TRIM),
    ...[-1.6, 1.6].flatMap((x) => [
      ...windowAt("z", [x, 1.7, 2.25], 0.95, 0.95),
      box([0.3, 1.0, 0.06], [x - 0.68, 1.7, 2.3], shutter),
      box([0.3, 1.0, 0.06], [x + 0.68, 1.7, 2.3], shutter),
      box([1.1, 0.2, 0.25], [x, 1.08, 2.45], WOOD),
      sphere([1.0, 0.25, 0.2], [x, 1.22, 2.45], "#f29bb0"),
    ]),
    ...windowAt("x+", [2.5, 1.7, 0], 1, 0.9),
    ...windowAt("x-", [-2.5, 1.7, 0], 1, 0.9),
    sphere([1.1, 0.8, 0.9], [-2.0, 0.4, 3.0], LEAF),
    sphere([1.1, 0.8, 0.9], [2.0, 0.4, 3.0], "#5f9f4d"),
    box([1.2, 0.04, 1.4], [0, 0.02, 4.1], PAVING),
  ];
}

/** Remote village house: orange gable roof, antenna and a "Remoto" sign on the roof. */
export const REMOTE_HOUSE: Omit<Facade, "badge"> = {
  footprint: [5.8, 7],
  markerY: 7.6,
  parts: [
    ...house({ wall: "#f6ead3", roof: "#e2773a", shutter: "#3aa39a" }),
    box([0.1, 2.0, 0.1], [1.4, 5.0, -1.0], METAL),
    cyl([1.0, 0.1, 1.0], [1.4, 5.9, -0.85], "#e9edf1", [-0.9, 0, 0]),
    box([0.08, 0.8, 0.08], [-0.8, 5.05, 0], "#4a4f55"),
    box([0.08, 0.8, 0.08], [0.8, 5.05, 0], "#4a4f55"),
    box([2.3, 0.75, 0.06], [0, 5.55, 0], "#2b3238"),
    { shape: "plane", size: [2.2, 0.66, 1], pos: [0, 5.55, 0.04], color: "#ffffff", label: REMOTO },
  ],
};

/** Decorative city houses (no job) — muted roofs so they don't read as the remote village. */
export const FILLER_HOUSES: readonly Pick<Facade, "parts" | "footprint">[] = [
  { footprint: [5.8, 6.8], parts: house({ wall: "#f3e7d0", roof: "#8f9aa6", shutter: "#7f97a8" }) },
  { footprint: [5.8, 6.8], parts: house({ wall: "#efe0c6", roof: "#9aa58a", shutter: "#a3714a" }) },
];

/** Small rounded hatchback, facing +z. */
export function car(color: string): Part[] {
  return [
    rounded([1.9, 0.75, 4], [0, 0.65, 0], color),
    rounded([1.7, 0.75, 2.2], [0, 1.3, -0.3], color),
    glass([1.74, 0.45, 2.0], [0, 1.35, -0.3]),
    box([1.92, 0.18, 0.1], [0, 0.55, 2.0], "#e9e6dd"),
    ...[-0.85, 0.85].flatMap((x) =>
      [-1.3, 1.3].map((z) => cyl([0.62, 0.3, 0.62], [x, 0.31, z], "#2b2f34", [0, 0, Math.PI / 2])),
    ),
  ];
}
