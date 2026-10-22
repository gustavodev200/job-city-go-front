"use client";

import { useFrame } from "@react-three/fiber";
import { useImperativeHandle, useMemo, useRef, type Ref, type RefObject } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

// Chibi developer with soft, rounded shapes. Units ≈ meters, feet on y = 0, facing +z.
// Hips, knees, shoulders, elbows and head are pivot groups driven by `applyGait`.

const SKIN = "#f2c39b";
const SKIN_SHADE = "#e6b089";
const HAIR = "#6b4426";
const HAIR_LIGHT = "#7d5332";
const HOODIE = "#5d626a";
const HOODIE_DARK = "#4c5158";
const JEANS = "#4f78b0";
const JEANS_LIGHT = "#6a92c7";
const SHOE = "#3a3d42";
const SOLE = "#e3e6ea";
const FRAME = "#26282c";

type Vec3 = [number, number, number];

// Rounded boxes are cached by size: every part shares geometry with its twin (left/right).
const roundedCache = new Map<string, THREE.BufferGeometry>();
function roundedBox([w, h, d]: Vec3, roundness: number) {
  const key = `${w}|${h}|${d}|${roundness}`;
  let g = roundedCache.get(key);
  if (!g) {
    g = new RoundedBoxGeometry(w, h, d, 4, Math.min(w, h, d) * roundness);
    roundedCache.set(key, g);
  }
  return g;
}

function Mat({ color, roughness = 0.7 }: { color: string; roughness?: number }) {
  return <meshStandardMaterial color={color} roughness={roughness} />;
}

/** Rounded box; `roundness` is the corner radius as a fraction of the smallest side (max 0.5). */
function Soft({
  size,
  position,
  color,
  rotation,
  roundness = 0.35,
}: {
  size: Vec3;
  position: Vec3;
  color: string;
  rotation?: Vec3;
  roundness?: number;
}) {
  return (
    <mesh geometry={roundedBox(size, roundness)} position={position} rotation={rotation} castShadow receiveShadow>
      <Mat color={color} />
    </mesh>
  );
}

function Ball({ scale, position, color }: { scale: Vec3; position: Vec3; color: string }) {
  return (
    <mesh position={position} scale={scale} castShadow>
      <sphereGeometry args={[0.5, 20, 14]} />
      <Mat color={color} />
    </mesh>
  );
}

/** Neon "</>" logo drawn on a canvas once. */
function useCodeLogo() {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 160;
    const ctx = canvas.getContext("2d")!;
    ctx.strokeStyle = "#45e07a";
    ctx.lineWidth = 18;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "#45e07a";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(78, 34);
    ctx.lineTo(28, 80);
    ctx.lineTo(78, 126);
    ctx.moveTo(178, 34);
    ctx.lineTo(228, 80);
    ctx.lineTo(178, 126);
    ctx.moveTo(146, 26);
    ctx.lineTo(110, 134);
    ctx.stroke();
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

// ── Legs ────────────────────────────────────────────────────────────────
/** Hip height: legs hang from here and the upper body leans around it. */
const HIP_Y = 0.89;
const KNEE_DROP = 0.38;

type JointProps = { side: number; jointRef: RefObject<THREE.Group | null>; endRef: RefObject<THREE.Group | null> };

/** One leg: hip joint → thigh → knee joint → shin and sneaker. */
function Perna({ side, jointRef, endRef }: JointProps) {
  const k = HIP_Y - KNEE_DROP; // knee height when standing
  return (
    <group ref={jointRef} position={[side * 0.16, HIP_Y, 0]}>
      <Soft size={[0.28, 0.44, 0.3]} position={[0, -0.19, 0]} color={JEANS} roundness={0.4} />
      <group ref={endRef} position={[0, -KNEE_DROP, 0]}>
        <Soft size={[0.26, 0.4, 0.28]} position={[0, -0.16, 0]} color={JEANS} roundness={0.4} />
        <Soft size={[0.3, 0.1, 0.32]} position={[0, 0.2 - k, 0]} color={JEANS_LIGHT} roundness={0.45} />
        <Soft size={[0.3, 0.17, 0.46]} position={[0, 0.1 - k, 0.06]} color={SHOE} roundness={0.5} />
        <Soft size={[0.32, 0.06, 0.48]} position={[0, 0.03 - k, 0.06]} color={SOLE} roundness={0.45} />
        <Soft size={[0.24, 0.05, 0.1]} position={[0, 0.07 - k, 0.27]} color={SOLE} roundness={0.45} />
      </group>
    </group>
  );
}

// ── Arms ────────────────────────────────────────────────────────────────
const SHOULDER_Y = 1.56;
const ELBOW_DROP = 0.42;

/** One free arm: shoulder joint → sleeve → elbow joint → forearm, cuff and hand. */
function Braco({ side, jointRef, endRef }: JointProps) {
  return (
    <group ref={jointRef} position={[side * 0.48, SHOULDER_Y, 0]}>
      <Ball scale={[0.27, 0.27, 0.29]} position={[0, 0, 0]} color={HOODIE} />
      <Soft size={[0.2, 0.46, 0.22]} position={[0, -0.2, 0]} color={HOODIE} roundness={0.5} />
      <group ref={endRef} position={[0, -ELBOW_DROP, 0]}>
        <Soft size={[0.19, 0.36, 0.2]} position={[0, -0.15, 0]} color={HOODIE} roundness={0.5} />
        <Soft size={[0.2, 0.07, 0.21]} position={[0, -0.32, 0]} color={HOODIE_DARK} roundness={0.45} />
        <Ball scale={[0.15, 0.17, 0.13]} position={[0, -0.43, 0.01]} color={SKIN} />
        <Ball scale={[0.06, 0.09, 0.06]} position={[side * -0.07, -0.4, 0.05]} color={SKIN} />
        {/* Smartwatch on the left wrist */}
        {side === 1 && <Soft size={[0.21, 0.06, 0.22]} position={[0, -0.27, 0]} color="#1f2125" roundness={0.45} />}
      </group>
    </group>
  );
}

// ── Hoodie torso ────────────────────────────────────────────────────────
function Corpo() {
  const logo = useCodeLogo();
  return (
    <group name="corpo">
      <Soft size={[0.82, 0.78, 0.5]} position={[0, 1.27, 0]} color={HOODIE} roundness={0.3} />
      <Soft size={[0.84, 0.12, 0.52]} position={[0, 0.91, 0]} color={HOODIE_DARK} roundness={0.45} />
      <Soft size={[0.5, 0.2, 0.05]} position={[0, 1.05, 0.25]} color={HOODIE_DARK} roundness={0.45} />
      {/* Hood resting behind the neck, open collar with the T-shirt showing */}
      <Soft size={[0.66, 0.28, 0.32]} position={[0, 1.7, -0.13]} color={HOODIE} rotation={[-0.25, 0, 0]} roundness={0.48} />
      <Soft size={[0.52, 0.14, 0.42]} position={[0, 1.66, 0.02]} color={HOODIE_DARK} roundness={0.48} />
      <Soft size={[0.22, 0.12, 0.03]} position={[0, 1.6, 0.245]} color="#ececec" roundness={0.45} />
      {[-0.08, 0.08].map((x) => (
        <group key={x}>
          <mesh position={[x, 1.47, 0.262]} castShadow>
            <cylinderGeometry args={[0.013, 0.013, 0.26, 8]} />
            <Mat color="#d9dadc" />
          </mesh>
          <Ball scale={[0.045, 0.06, 0.045]} position={[x, 1.33, 0.262]} color="#d9dadc" />
        </group>
      ))}
      <mesh position={[0.17, 1.42, 0.252]}>
        <planeGeometry args={[0.22, 0.14]} />
        <meshBasicMaterial map={logo} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}

// ── Head: rounded, round glasses, soft beard, smile and tufted hair ─────
const TUFTS: { pos: Vec3; rot: Vec3; scale: number }[] = [
  { pos: [-0.2, 2.5, 0.16], rot: [0.75, 0, 0.35], scale: 1 },
  { pos: [0, 2.53, 0.19], rot: [0.85, 0, 0], scale: 1.15 },
  { pos: [0.2, 2.5, 0.15], rot: [0.75, 0, -0.35], scale: 1 },
  { pos: [-0.12, 2.56, 0.01], rot: [0.35, 0, 0.25], scale: 1.1 },
  { pos: [0.1, 2.58, 0], rot: [0.3, 0, -0.2], scale: 1.2 },
  { pos: [-0.23, 2.48, -0.1], rot: [-0.2, 0, 0.6], scale: 0.9 },
  { pos: [0.24, 2.47, -0.08], rot: [-0.2, 0, -0.6], scale: 0.9 },
  { pos: [0, 2.52, -0.18], rot: [-0.6, 0, 0], scale: 1 },
];

function Oculos() {
  return (
    <group name="oculos" position={[0, 2.08, 0.315]}>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.145, 0, 0]}>
          <mesh scale={[1.15, 0.85, 1]} castShadow>
            <torusGeometry args={[0.1, 0.022, 10, 32]} />
            <Mat color={FRAME} roughness={0.35} />
          </mesh>
          <mesh scale={[1.15, 0.85, 1]} position={[0, 0, -0.005]}>
            <circleGeometry args={[0.1, 32]} />
            <meshStandardMaterial color="#9fb4c2" transparent opacity={0.28} roughness={0.1} />
          </mesh>
          <Soft size={[0.03, 0.03, 0.32]} position={[side * 0.13, 0.03, -0.17]} color={FRAME} roundness={0.5} />
        </group>
      ))}
      <mesh position={[0, 0.03, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.014, 0.014, 0.07, 8]} />
        <Mat color={FRAME} roughness={0.35} />
      </mesh>
    </group>
  );
}

function Cabeca() {
  return (
    <group name="cabeca">
      <Soft size={[0.16, 0.14, 0.16]} position={[0, 1.72, 0]} color={SKIN} roundness={0.5} />
      <Soft size={[0.62, 0.64, 0.58]} position={[0, 2.08, 0]} color={SKIN} roundness={0.3} />
      {[-1, 1].map((side) => (
        <Ball key={side} scale={[0.07, 0.14, 0.11]} position={[side * 0.31, 2.06, -0.02]} color={SKIN_SHADE} />
      ))}
      {/* Eyes, brows and nose */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Ball scale={[0.06, 0.07, 0.03]} position={[side * 0.14, 2.08, 0.288]} color="#2b2522" />
          <Ball scale={[0.035, 0.035, 0.02]} position={[side * 0.13, 2.095, 0.3]} color="#ffffff" />
          <Soft
            size={[0.16, 0.04, 0.03]}
            position={[side * 0.14, 2.22, 0.29]}
            color={HAIR}
            rotation={[0, 0, side * -0.1]}
            roundness={0.5}
          />
        </group>
      ))}
      <Ball scale={[0.09, 0.09, 0.08]} position={[0, 1.99, 0.3]} color={SKIN_SHADE} />
      {/* Short beard wrapping the jaw, mustache and a smile */}
      <Soft size={[0.62, 0.2, 0.12]} position={[0, 1.83, 0.24]} color={HAIR} roundness={0.48} />
      <Soft size={[0.08, 0.34, 0.5]} position={[-0.3, 1.93, 0.01]} color={HAIR} roundness={0.48} />
      <Soft size={[0.08, 0.34, 0.5]} position={[0.3, 1.93, 0.01]} color={HAIR} roundness={0.48} />
      <Soft size={[0.28, 0.05, 0.05]} position={[0, 1.935, 0.3]} color={HAIR} roundness={0.5} />
      <mesh position={[0, 1.905, 0.305]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.06, 0.012, 8, 16, Math.PI]} />
        <Mat color="#8a3f30" />
      </mesh>
      {/* Hair: rounded cap with soft tufts */}
      <Soft size={[0.68, 0.18, 0.62]} position={[0, 2.43, -0.01]} color={HAIR} roundness={0.45} />
      <Soft size={[0.64, 0.52, 0.14]} position={[0, 2.15, -0.25]} color={HAIR} roundness={0.45} />
      <Soft size={[0.08, 0.26, 0.42]} position={[-0.32, 2.3, -0.04]} color={HAIR} roundness={0.45} />
      <Soft size={[0.08, 0.26, 0.42]} position={[0.32, 2.3, -0.04]} color={HAIR} roundness={0.45} />
      {TUFTS.map(({ pos, rot, scale }, i) => (
        <mesh key={i} position={pos} rotation={rot} scale={scale} castShadow>
          <coneGeometry args={[0.13, 0.27, 10]} />
          <Mat color={i % 3 === 0 ? HAIR_LIGHT : HAIR} />
        </mesh>
      ))}
      <Oculos />
    </group>
  );
}

/** Joints exposed to whoever animates the character (the game's Player). */
export type Rig = {
  body: THREE.Group;
  upper: THREE.Group;
  head: THREE.Group;
  hipL: THREE.Group;
  kneeL: THREE.Group;
  hipR: THREE.Group;
  kneeR: THREE.Group;
  shoulderL: THREE.Group;
  elbowL: THREE.Group;
  shoulderR: THREE.Group;
  elbowR: THREE.Group;
};

/** Gait inputs, all smoothed by the caller. */
export type GaitState = {
  /** Stride phase in radians; advanced by distance travelled, so planted feet don't slide. */
  phase: number;
  /** 0 = standing, 1 = full locomotion. */
  move: number;
  /** 0 = walk gait, 1 = run gait. */
  run: number;
  /** 0 = grounded, 1 = airborne (jump / travel). */
  air: number;
  /** Landing compression, 1 right after touchdown, decaying to 0. */
  land: number;
  /** Elapsed time, for breathing. */
  time: number;
};

const lerp = THREE.MathUtils.lerp;

/**
 * Procedural walk/run cycle.
 * - Walk: inverted-pendulum gait — body highest at mid-stance, knees mostly straight.
 * - Run: spring-mass gait — body lowest at mid-stance, flight phase, deeper knee flex, more lean.
 * - Arms swing opposite to the leg on the same side (balances the hips' angular momentum);
 *   running pumps them with elbows bent ~90°.
 * Forward swing = negative rotation.x (character faces +z); knee/elbow flex follows the joint.
 */
export function applyGait(rig: Rig, g: GaitState) {
  const s = Math.sin(g.phase);
  const c = Math.cos(g.phase);
  const c2 = Math.cos(2 * g.phase);
  const m = g.move;
  const breath = Math.sin(g.time * 2) * (1 - m);

  // Legs. Left leg forward while sin > 0; a leg folds its knee while swinging forward.
  const swing = lerp(0.55, 0.75, g.run) * m;
  const kneeSwing = lerp(0.85, 1.7, g.run) * m;
  const stanceFlex = lerp(0.06, 0.32, g.run) * m;
  let hipL = -swing * s;
  let hipR = swing * s;
  let kneeL = kneeSwing * Math.max(0, c) ** 1.5 + stanceFlex * Math.max(0, -c);
  let kneeR = kneeSwing * Math.max(0, -c) ** 1.5 + stanceFlex * Math.max(0, c);

  // Arms: opposite to the same-side leg.
  const armSwing = lerp(0.45, 0.85, g.run) * m;
  const elbowBase = lerp(0.18, 1.45, g.run * m) + 0.05 * breath;
  let shoulderL = armSwing * s;
  let shoulderR = -armSwing * s;
  // Elbows bend a little more on the forward swing.
  let elbowL = elbowBase + 0.25 * armSwing * Math.max(0, -s);
  let elbowR = elbowBase + 0.25 * armSwing * Math.max(0, s);
  let armOut = 0.1;

  // Vertical motion: walk vaults over the stance leg, run compresses into it.
  let bob = m * lerp(0.035 * c2, -0.06 * c2 + 0.03, g.run);
  let lean = m * lerp(0.07, 0.26, g.run);

  // Airborne: lead knee up, trail leg back, arms rise for balance.
  hipL = lerp(hipL, -0.75, g.air);
  hipR = lerp(hipR, 0.3, g.air);
  kneeL = lerp(kneeL, 1.25, g.air);
  kneeR = lerp(kneeR, 0.7, g.air);
  shoulderL = lerp(shoulderL, -0.6, g.air);
  shoulderR = lerp(shoulderR, -0.6, g.air);
  elbowL = lerp(elbowL, 0.7, g.air);
  elbowR = lerp(elbowR, 0.7, g.air);
  armOut += 0.45 * g.air;
  lean += 0.08 * g.air;

  // Landing: absorb the impact by bending both knees; arms come forward.
  hipL -= 0.45 * g.land;
  hipR -= 0.45 * g.land;
  kneeL += 0.9 * g.land;
  kneeR += 0.9 * g.land;
  shoulderL -= 0.4 * g.land;
  shoulderR -= 0.4 * g.land;
  bob -= 0.14 * g.land;
  lean += 0.18 * g.land;

  rig.hipL.rotation.x = hipL;
  rig.hipR.rotation.x = hipR;
  rig.kneeL.rotation.x = kneeL;
  rig.kneeR.rotation.x = kneeR;
  rig.shoulderL.rotation.set(shoulderL, 0, armOut + 0.02 * breath);
  rig.shoulderR.rotation.set(shoulderR, 0, -armOut - 0.02 * breath);
  // Elbow flex brings the forearm forward: negative x.
  rig.elbowL.rotation.x = -elbowL;
  rig.elbowR.rotation.x = -elbowR;

  // Pelvis shifts weight onto the stance leg; shoulders counter-rotate the hips.
  rig.body.position.y = bob;
  rig.body.rotation.z = 0.035 * s * m;
  rig.body.rotation.y = -0.08 * s * m;
  rig.upper.rotation.x = lean;
  rig.upper.rotation.y = 0.14 * s * m;
  rig.upper.position.y = HIP_Y + 0.008 * breath;

  // Head stays level and keeps looking ahead.
  rig.head.rotation.x = -lean * 0.6 + Math.sin(g.time * 0.9) * 0.02 * (1 - m);
  rig.head.rotation.z = Math.sin(g.time * 1.3) * 0.03 * (1 - m) - 0.03 * s * m;
}

type DesenvolvedorProps = {
  ref?: Ref<Rig>;
  /** Play the standing idle animation by itself (studio page). */
  idle?: boolean;
  position?: Vec3;
  rotation?: Vec3;
  scale?: number;
};

export function Desenvolvedor({ ref, idle = false, ...props }: DesenvolvedorProps) {
  const body = useRef<THREE.Group>(null);
  const upper = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const hipL = useRef<THREE.Group>(null);
  const kneeL = useRef<THREE.Group>(null);
  const hipR = useRef<THREE.Group>(null);
  const kneeR = useRef<THREE.Group>(null);
  const shoulderL = useRef<THREE.Group>(null);
  const elbowL = useRef<THREE.Group>(null);
  const shoulderR = useRef<THREE.Group>(null);
  const elbowR = useRef<THREE.Group>(null);

  const rig = (): Rig => ({
    body: body.current!,
    upper: upper.current!,
    head: head.current!,
    hipL: hipL.current!,
    kneeL: kneeL.current!,
    hipR: hipR.current!,
    kneeR: kneeR.current!,
    shoulderL: shoulderL.current!,
    elbowL: elbowL.current!,
    shoulderR: shoulderR.current!,
    elbowR: elbowR.current!,
  });
  useImperativeHandle(ref, rig);

  useFrame(({ clock }) => {
    if (!idle || !body.current) return;
    applyGait(rig(), { phase: 0, move: 0, run: 0, air: 0, land: 0, time: clock.elapsedTime });
  });

  return (
    <group name="desenvolvedor" {...props}>
      <group ref={body}>
        {/* Left = +x (the character's left when facing +z) */}
        <Perna side={1} jointRef={hipL} endRef={kneeL} />
        <Perna side={-1} jointRef={hipR} endRef={kneeR} />
        {/* Upper body pivots around the hips */}
        <group ref={upper} position={[0, HIP_Y, 0]}>
          <group position={[0, -HIP_Y, 0]}>
            <Corpo />
            <Braco side={1} jointRef={shoulderL} endRef={elbowL} />
            <Braco side={-1} jointRef={shoulderR} endRef={elbowR} />
            {/* Head pivots around the neck */}
            <group ref={head} position={[0, 1.72, 0]}>
              <group position={[0, -1.72, 0]}>
                <Cabeca />
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
