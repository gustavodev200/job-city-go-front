"use client";

import { Html } from "@react-three/drei";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { anunciantes, type Anunciante, type CategoriaAnunciante } from "@/data/anunciantes";
import { estados } from "@/data/brasil/estados";
import { criarAleatorio } from "@/lib/aleatorio";
import type { Mundo } from "@/lib/cidade/mundo";
import { useOutdoorStore } from "@/stores/outdoors";
import { cicloRuntime } from "./ciclo";
import type { Instance, Part } from "./facades";
import { InstancedParts } from "./Instanced";
import { useMundo } from "./mundo";
import { arvoresDoMundo, dentroDeCopa, type Arvores } from "./Trees";

// ── Dimensions (scene units) ────────────────────────────────────────────
const PANEL_W = 6;
const PANEL_H = 3;
/** Ground to the bottom edge of the panel. */
const PANEL_BOTTOM = 4;
const PANEL_Y = PANEL_BOTTOM + PANEL_H / 2;
/** Leg spacing from the panel center (along the panel width). */
const LEG_X = 1.4;
/** Road center line → billboard center: the sidewalk strip / shoulder, never the lot. */
const EDGE_OFFSET = 3.4;
/** How far the panel turns from "parallel to the road" toward oncoming traffic. */
const TURN = Math.PI / 6;
/** Raio sem outdoor em volta dos pontos de nascimento. */
const LIVRE_NASCIMENTO = 14;

const BASE_GLOW = 0.28;
const HOVER_GLOW = 0.6;
/** Extra glow once the city lights are on (content unchanged, just brighter). */
const NIGHT_GLOW = 0.5;
const LAMP_INTENSITY = 4;

// ── Steel truss structure (local space: width along x, panel facing +z) ─
const STEEL = "#7d848c";
const STEEL_DARK = "#5c636b";
const CONCRETE = "#bdb6aa";
const LEG_TOP = PANEL_Y + 0.6;
const RAIL_GAP = 0.22;
const BRACE_STEP = 0.8;
const BRACE_ANGLE = Math.atan2(RAIL_GAP * 2, BRACE_STEP);
const BRACE_LENGTH = Math.hypot(RAIL_GAP * 2, BRACE_STEP);
const TRUSS_Z = -0.25;

const leg = (x: number): Part[] => [
  // Concrete pier, mostly buried so it also works on the slope to the village.
  { shape: "box", size: [0.9, 1.55, 0.9], pos: [x, -0.525, TRUSS_Z], color: CONCRETE },
  ...[-1, 1].map((s): Part => ({
    shape: "box",
    size: [0.08, LEG_TOP, 0.08],
    pos: [x + s * RAIL_GAP, LEG_TOP / 2, TRUSS_Z],
    color: STEEL,
  })),
  ...Array.from({ length: Math.floor(LEG_TOP / BRACE_STEP) }, (_, i): Part => ({
    shape: "box",
    size: [0.05, BRACE_LENGTH, 0.05],
    pos: [x, i * BRACE_STEP + BRACE_STEP / 2, TRUSS_Z],
    rot: [0, 0, i % 2 === 0 ? BRACE_ANGLE : -BRACE_ANGLE],
    color: STEEL_DARK,
  })),
];

const STRUCTURE: Part[] = [
  ...leg(-LEG_X),
  ...leg(LEG_X),
  // Frame behind the panel (shows as a steel rim around it).
  { shape: "box", size: [PANEL_W + 0.3, PANEL_H + 0.3, 0.14], pos: [0, PANEL_Y, -0.09], color: STEEL_DARK },
  ...[PANEL_BOTTOM + 0.6, PANEL_BOTTOM + PANEL_H - 0.6].map((y): Part => ({
    shape: "box",
    size: [PANEL_W + 0.3, 0.1, 0.1],
    pos: [0, y, TRUSS_Z],
    color: STEEL,
  })),
  // Catwalk under the panel.
  { shape: "box", size: [PANEL_W + 0.2, 0.06, 0.7], pos: [0, PANEL_BOTTOM - 0.12, 0.25], color: STEEL },
  // Two lamp arms above the panel; the heads glow (lit instances).
  ...[-1.8, 1.8].flatMap((x): Part[] => [
    { shape: "box", size: [0.05, 0.05, 0.8], pos: [x, PANEL_BOTTOM + PANEL_H + 0.25, 0.3], color: STEEL_DARK },
    { shape: "box", size: [0.5, 0.12, 0.22], pos: [x, PANEL_BOTTOM + PANEL_H + 0.2, 0.7], color: "", glow: true },
  ]),
];

// ── Placement ──────────────────────────────────────────────────────────
/** A straight road: `axis` is the direction it runs; traffic is read as flowing toward `flow`. */
type Road = { axis: "x" | "z"; line: number; flow: 1 | -1 };
/** Candidate spot: position along the road and the side (+1 / -1 on the perpendicular axis). */
type Slot = { road: Road; along: number; side: 1 | -1 };

const slots = (road: Road, list: [number, 1 | -1][]): Slot[] => list.map(([along, side]) => ({ road, along, side }));

/**
 * Meios de quarteirão na ordem dada, alternando o lado da rua a cada um; depois os lados
 * que sobraram (como a cidade original: um outdoor por quarteirão antes de repetir).
 */
const alternando = (centros: readonly number[]): [number, 1 | -1][] => {
  const primeiro = centros.map((c, i): [number, 1 | -1] => [c, i % 2 === 0 ? 1 : -1]);
  return [...primeiro, ...primeiro.map(([c, lado]): [number, 1 | -1] => [c, lado === 1 ? -1 : 1])];
};
/** Norte (à frente de quem nasce olhando para o norte) primeiro, do centro para fora. */
const norteAntes = (centros: readonly number[]) => [...centros].sort((a, b) => Number(a > 0) - Number(b > 0) || Math.abs(a) - Math.abs(b));
/** Da ponte para dentro da cidade. */
const lesteAntes = (centros: readonly number[]) => [...centros].sort((a, b) => b - a);

/** Grupos de candidatos: cada grupo pega os primeiros `count` que couberem. */
function gruposDoMundo(mundo: Mundo): { count: number; candidates: Slot[] }[] {
  const { praca, ruasX, centrosX, centrosZ, urbano, ponte } = mundo;
  const bridgeAvenue: Road = { axis: "x", line: 0, flow: 1 };
  if (mundo.tipo === "remoto") {
    // Estrada de terra da ponte até a vila (z = 0) e rua principal da vila.
    return [
      { count: 2, candidates: slots(bridgeAvenue, [[ponte.x1 + 3, -1], [ponte.x1 + 8, 1], [ponte.x1 + 3, 1], [ponte.x1 + 8, -1]]) },
      { count: 2, candidates: slots(bridgeAvenue, alternando([...centrosX].sort((a, b) => a - b))) },
    ];
  }
  // Rua no sentido norte–sul mais perto do centro (x = 0 na cidade original).
  const central = [...ruasX].sort((a, b) => Math.abs(a) - Math.abs(b))[0];
  const avenida = (urbano.maxX + ponte.x0) / 2;
  return [
    { count: 3, candidates: slots({ axis: "z", line: central, flow: -1 }, alternando(norteAntes(centrosZ))) },
    { count: 3, candidates: slots(bridgeAvenue, [[avenida, 1], ...alternando(lesteAntes(centrosX)), [avenida, -1]]) },
    {
      // Plaza block has no buildings, so its side of the surrounding roads is always free.
      count: 2,
      candidates: praca
        ? [
            ...slots({ axis: "z", line: praca.x - 10, flow: -1 }, [[praca.z, 1]]),
            ...slots({ axis: "x", line: praca.z + 10, flow: 1 }, [[praca.x, -1]]),
          ]
        : [],
    },
  ];
}

export type OutdoorSpot = { x: number; y: number; z: number; rotY: number };

function toSpot(mundo: Mundo, { road, along, side }: Slot): OutdoorSpot {
  // Perpendicular (toward the billboard side) and flow direction, in world xz.
  const [px, pz] = road.axis === "z" ? [side, 0] : [0, side];
  const [fx, fz] = road.axis === "z" ? [0, road.flow] : [road.flow, 0];
  // Face the road center, turned toward the oncoming camera.
  const nx = -px * Math.cos(TURN) - fx * Math.sin(TURN);
  const nz = -pz * Math.cos(TURN) - fz * Math.sin(TURN);
  const x = road.axis === "z" ? road.line + side * EDGE_OFFSET : along;
  const z = road.axis === "z" ? along : road.line + side * EDGE_OFFSET;
  const rotY = Math.atan2(nx, nz);
  // Stand on the higher leg so neither floats; the buried pier covers the gap.
  const ax = Math.cos(rotY);
  const az = -Math.sin(rotY);
  const y = Math.max(
    mundo.alturaDoPasso(x - ax * LEG_X, z - az * LEG_X),
    mundo.alturaDoPasso(x + ax * LEG_X, z + az * LEG_X),
  );
  return { x, y, z, rotY };
}

/** The panel and legs must not clip buildings, parked cars, tree canopies or water. */
function fits(mundo: Mundo, arvores: Arvores, { x, y, z, rotY }: OutdoorSpot) {
  // Longe de onde o personagem nasce: o painel não tapa a primeira vista.
  const { praca, ponte } = mundo.nascimento;
  if (Math.hypot(x - praca.x, z - praca.z) < LIVRE_NASCIMENTO || Math.hypot(x - ponte.x, z - ponte.z) < LIVRE_NASCIMENTO) {
    return false;
  }
  const ax = Math.cos(rotY);
  const az = -Math.sin(rotY);
  for (let t = -PANEL_W / 2; t <= PANEL_W / 2; t += 0.5) {
    const px = x + ax * t;
    const pz = z + az * t;
    const isLeg = Math.abs(Math.abs(t) - LEG_X) < 0.3;
    const minTop = isLeg ? -Infinity : y + PANEL_BOTTOM - 0.3;
    if (
      mundo.colisores.some((c) => c.top > minTop && Math.abs(px - c.x) < c.hw + 0.4 && Math.abs(pz - c.z) < c.hd + 0.4)
    ) {
      return false;
    }
    if (isLeg && Math.abs(px - mundo.rio.x) < mundo.rio.meiaLargura + 2) return false;
    for (const h of [PANEL_BOTTOM, PANEL_Y, PANEL_BOTTOM + PANEL_H]) {
      if (dentroDeCopa(arvores, px, y + h, pz)) return false;
    }
  }
  return true;
}

/** Two spots stay without an advertiser to show the "Espaço para sua marca" panel. */
const EMPTY_SLOTS = new Set([4, 9]);

/** Semente por região: cidades da mesma região mostram os mesmos anunciantes (base da spec 010). */
function anunciantesDaRegiao(mundo: Mundo) {
  const regiao = mundo.uf ? estados[mundo.uf].regiao : "Brasil";
  let h = 7;
  for (let i = 0; i < regiao.length; i++) h = Math.imul(h ^ regiao.charCodeAt(i), 16777619);
  const a = criarAleatorio(h >>> 0);
  const lista = [...anunciantes];
  for (let i = lista.length - 1; i > 0; i--) {
    const j = a.inteiro(0, i);
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }
  return lista;
}

export function outdoorsDoMundo(mundo: Mundo) {
  const arvores = arvoresDoMundo(mundo);
  const placed = gruposDoMundo(mundo).flatMap(({ count, candidates }) => {
    const picked: OutdoorSpot[] = [];
    for (const slot of candidates) {
      if (picked.length === count) break;
      const spot = toSpot(mundo, slot);
      if (fits(mundo, arvores, spot)) picked.push(spot);
    }
    return picked;
  });
  const marcas = anunciantesDaRegiao(mundo);
  let nextBrand = 0;
  return placed.map((spot, i) => ({
    ...spot,
    numero: i + 1,
    anunciante: EMPTY_SLOTS.has(i) ? null : marcas[nextBrand++ % marcas.length],
  }));
}

type OutdoorDoMundo = ReturnType<typeof outdoorsDoMundo>[number];

// ── Panel textures (one per advertiser, cached) ────────────────────────
const TEX_W = 1024;
const TEX_H = 512;

function drawIcon(ctx: CanvasRenderingContext2D, categoria: CategoriaAnunciante, color: string) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  switch (categoria) {
    case "alimentacao": // burger
      ctx.beginPath();
      ctx.ellipse(0, -18, 92, 62, 0, Math.PI, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(-96, -4, 192, 34, 17);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(-88, 42, 176, 38, [6, 6, 30, 30]);
      ctx.fill();
      break;
    case "farmacia": // cross
      ctx.beginPath();
      ctx.roundRect(-30, -95, 60, 190, 12);
      ctx.roundRect(-95, -30, 190, 60, 12);
      ctx.fill();
      break;
    case "moda": // hanger
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.arc(0, -62, 22, Math.PI, Math.PI * 2.4);
      ctx.lineTo(0, -28);
      ctx.lineTo(-100, 50);
      ctx.lineTo(100, 50);
      ctx.closePath();
      ctx.stroke();
      break;
    case "servicos": // wrench
      ctx.save();
      ctx.rotate(-Math.PI / 4);
      ctx.beginPath();
      ctx.roundRect(-18, -20, 36, 130, 18);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -48, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-16, -110, 32, 58);
      ctx.restore();
      break;
    case "tecnologia": // monitor
      ctx.beginPath();
      ctx.roundRect(-100, -80, 200, 130, 14);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-82, -62, 164, 94);
      ctx.fillStyle = color;
      ctx.fillRect(-14, 50, 28, 28);
      ctx.beginPath();
      ctx.roundRect(-56, 76, 112, 16, 8);
      ctx.fill();
      break;
  }
}

/** Largest font size (down to `min`) that fits `text` in `maxWidth`. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, weight: string, size: number, min: number, maxWidth: number) {
  let s = size;
  ctx.font = `${weight} ${s}px system-ui, sans-serif`;
  while (s > min && ctx.measureText(text).width > maxWidth) {
    s -= 4;
    ctx.font = `${weight} ${s}px system-ui, sans-serif`;
  }
}

const textures = new Map<string, THREE.CanvasTexture>();

function panelTexture(anunciante: Anunciante | null) {
  const key = anunciante?.id ?? "vazio";
  const cached = textures.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext("2d")!;
  // White paper border, like a printed billboard sheet.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  if (anunciante) {
    ctx.fillStyle = anunciante.cor;
    ctx.beginPath();
    ctx.roundRect(18, 18, TEX_W - 36, TEX_H - 36, 18);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(250, TEX_H / 2, 160, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(250, TEX_H / 2);
    drawIcon(ctx, anunciante.categoria, anunciante.cor);
    ctx.restore();

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    fitFont(ctx, anunciante.nome, "800", 104, 56, 540);
    ctx.fillText(anunciante.nome, 450, 240);
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    fitFont(ctx, anunciante.slogan, "500", 50, 30, 540);
    ctx.fillText(anunciante.slogan, 452, 320);
  } else {
    ctx.fillStyle = "#e7e2d8";
    ctx.fillRect(18, 18, TEX_W - 36, TEX_H - 36);
    ctx.setLineDash([28, 18]);
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#a59d8f";
    ctx.strokeRect(54, 54, TEX_W - 108, TEX_H - 108);
    ctx.fillStyle = "#5f5a52";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    fitFont(ctx, "Espaço para sua marca", "800", 84, 48, 820);
    ctx.fillText("Espaço para sua marca", TEX_W / 2, TEX_H / 2 - 24);
    ctx.font = "500 42px system-ui, sans-serif";
    ctx.fillStyle = "#8a8378";
    ctx.fillText("Anuncie aqui", TEX_W / 2, TEX_H / 2 + 62);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  textures.set(key, texture);
  return texture;
}

// ── Components ─────────────────────────────────────────────────────────
const PANEL_GEOMETRY = new THREE.PlaneGeometry(PANEL_W, PANEL_H);
const DEBUG_SIZE: [number, number, number] = [PANEL_W + 0.6, LEG_TOP + 2.4, 1.6];
const DEBUG_GEOMETRY = new THREE.BoxGeometry(...DEBUG_SIZE);
const DEBUG_MATERIAL = new THREE.MeshBasicMaterial({ color: "#ff2b2b", wireframe: true, depthTest: false, fog: false });

/** Drag distance (px) above which a pointer-up is a camera drag, not a click. */
const CLICK_SLOP = 6;

function Outdoor({ outdoor, light }: { outdoor: OutdoorDoMundo; light: boolean }) {
  const canvas = useThree((state) => state.gl.domElement);
  const debug = useOutdoorStore((state) => state.debug);
  const material = useMemo(() => {
    const map = panelTexture(outdoor.anunciante);
    return new THREE.MeshStandardMaterial({
      map,
      emissiveMap: map,
      emissive: "#ffffff",
      emissiveIntensity: BASE_GLOW,
      roughness: 0.6,
    });
  }, [outdoor.anunciante]);
  useEffect(() => () => material.dispose(), [material]);
  const panel = useRef<THREE.Mesh>(null);
  const lamp = useRef<THREE.PointLight>(null);

  useFrame(() => {
    const mesh = panel.current;
    const on = cicloRuntime.luzes;
    if (mesh) {
      const glow = mesh.userData.hovered ? HOVER_GLOW : BASE_GLOW;
      (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = glow + on * NIGHT_GLOW;
    }
    if (lamp.current) lamp.current.intensity = on * LAMP_INTENSITY;
  });

  const hover = (on: boolean) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    e.eventObject.userData.hovered = on;
    canvas.style.cursor = on ? "pointer" : "";
  };

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > CLICK_SLOP) return;
    useOutdoorStore.getState().selecionar(outdoor.anunciante ?? "vazio");
  };

  return (
    <group position={[outdoor.x, outdoor.y, outdoor.z]} rotation-y={outdoor.rotY}>
      <mesh
        ref={panel}
        geometry={PANEL_GEOMETRY}
        material={material}
        position={[0, PANEL_Y, 0.01]}
        onPointerOver={hover(true)}
        onPointerOut={hover(false)}
        onClick={onClick}
      />
      {light && (
        <pointLight
          ref={lamp}
          position={[0, PANEL_BOTTOM + PANEL_H + 0.4, 1.4]}
          color="#ffe2a8"
          intensity={0}
          distance={9}
          decay={2}
        />
      )}
      {debug && (
        <>
          <mesh geometry={DEBUG_GEOMETRY} material={DEBUG_MATERIAL} position={[0, DEBUG_SIZE[1] / 2 - 1.2, 0.2]} renderOrder={999} />
          <Html position={[0, DEBUG_SIZE[1] - 0.6, 0]} center zIndexRange={[20, 0]}>
            <span className="pointer-events-none rounded bg-[#ff2b2b] px-1.5 py-0.5 text-xs font-bold text-white shadow">
              #{outdoor.numero}
            </span>
          </Html>
        </>
      )}
    </group>
  );
}

/** Roadside billboards with mock advertisers. `lights` adds a small point light per panel. */
export function Outdoors({ lights }: { lights: boolean }) {
  const canvas = useThree((state) => state.gl.domElement);
  const mundo = useMundo();
  const outdoors = useMemo(() => outdoorsDoMundo(mundo), [mundo]);
  const structureInstances = useMemo(
    () => outdoors.map(({ x, y, z, rotY }): Instance => ({ x, y, z, rotY, lit: true })),
    [outdoors],
  );
  useEffect(
    () => () => {
      canvas.style.cursor = "";
    },
    [canvas],
  );
  return (
    <>
      <InstancedParts parts={STRUCTURE} instances={structureInstances} shadows={false} />
      {outdoors.map((outdoor) => (
        <Outdoor key={outdoor.numero} outdoor={outdoor} light={lights} />
      ))}
    </>
  );
}
