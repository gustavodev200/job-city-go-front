"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { AREAS, walkHeight, type Area } from "@/data/mapa";
import { useGameStore, type Travel } from "@/stores/game";
import { isBlocked, isInsideBuilding, nearestVagaId } from "./layout";
import { playerRuntime } from "./playerRuntime";
import { isInsideCanopy } from "./Trees";
import { Desenvolvedor, applyGait, type GaitState, type Rig } from "@/components/personagem/Desenvolvedor";


// Speeds tuned to the character's leg length so the gait reads as a brisk walk / run.
const SPEED = 5;
const RUN_SPEED = 10;
/** Character scale: ~1.95 m tall, shorter than the 2.4 m doors. */
const CHARACTER_SCALE = 0.75;
/** World distance covered per step (one foot) at walk / run pace. */
const WALK_STEP = 1.1;
const RUN_STEP = 1.7;
const JUMP_SPEED = 7.5;
const GRAVITY = 22;
const RADIUS = 0.5;
const NEARBY_INTERVAL = 0.15;
const CAMERA_PROBES = 16;
const MIN_CAMERA_DISTANCE = 3;

const _target = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _probe = new THREE.Vector3();
const _desired = new THREE.Vector3();

type TravelAnim = { from: THREE.Vector2; to: THREE.Vector2; t: number; duration: number; arc: number };

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function Player({ areaInicial = "cidade" }: { areaInicial?: Area }) {
  const group = useRef<THREE.Group>(null);
  const rig = useRef<Rig>(null);
  const camera = useThree((state) => state.camera);
  const canvas = useThree((state) => state.gl.domElement);

  const keys = useRef(new Set<string>());
  const sim = useRef({
    x: AREAS[areaInicial].x,
    z: AREAS[areaInicial].z + 2,
    y: walkHeight(AREAS[areaInicial].x, AREAS[areaInicial].z + 2),
    vy: 0,
    grounded: true,
    facing: Math.PI,
    yaw: 0,
    pitch: 0.45,
    gait: { phase: 0, move: 0, run: 0, air: 0, land: 0, time: 0 } as GaitState,
    speed: 0,
    nearbyTimer: 0,
    travel: null as Travel | null,
    anim: null as TravelAnim | null,
    cameraReady: false,
    cameraDistance: useGameStore.getState().cameraDistance,
  });
  const lookTarget = useRef(new THREE.Vector3());

  // Teclado
  useEffect(() => {
    const isTyping = (e: KeyboardEvent) =>
      e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

    const onDown = (e: KeyboardEvent) => {
      if (isTyping(e)) return;
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
      keys.current.add(e.code);

      const store = useGameStore.getState();
      if (e.code === "KeyE" && store.nearbyVagaId) {
        store.selectVaga(store.selectedVagaId ? null : store.nearbyVagaId);
      }
      if (e.code === "Escape") store.selectVaga(null);
    };
    const onUp = (e: KeyboardEvent) => keys.current.delete(e.code);
    const clear = () => keys.current.clear();

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", clear);
    };
  }, []);

  // Arrastar para olhar + roda do mouse para zoom
  useEffect(() => {
    const drag = { id: -1, x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      Object.assign(drag, { id: e.pointerId, x: e.clientX, y: e.clientY });
      canvas.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (drag.id !== e.pointerId) return;
      const s = sim.current;
      s.yaw -= (e.clientX - drag.x) * 0.006;
      s.pitch = THREE.MathUtils.clamp(s.pitch + (e.clientY - drag.y) * 0.004, 0.12, 1.25);
      drag.x = e.clientX;
      drag.y = e.clientY;
    };
    const onPointerUp = (e: PointerEvent) => {
      if (drag.id === e.pointerId) drag.id = -1;
    };
    const onWheel = (e: WheelEvent) => useGameStore.getState().zoom(e.deltaY > 0 ? 1 : -1);

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [canvas]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const s = sim.current;
    const store = useGameStore.getState();
    const prevX = s.x;
    const prevZ = s.z;

    // Nova viagem pedida pelo HUD
    if (store.travel && store.travel !== s.travel) {
      s.travel = store.travel;
      const from = new THREE.Vector2(s.x, s.z);
      const to = new THREE.Vector2(store.travel.x, store.travel.z);
      const distance = from.distanceTo(to);
      s.anim = {
        from,
        to,
        t: 0,
        duration: THREE.MathUtils.clamp(distance / 55, 1.2, 3),
        arc: Math.min(22, distance * 0.15),
      };
      s.facing = Math.atan2(to.x - from.x, to.y - from.y);
    }

    if (s.anim) {
      const a = s.anim;
      // Tempo real (não o dt limitado) para a viagem durar o mesmo em qualquer FPS.
      a.t = Math.min(1, a.t + Math.min(rawDelta, 0.25) / a.duration);
      const k = easeInOut(a.t);
      s.x = THREE.MathUtils.lerp(a.from.x, a.to.x, k);
      s.z = THREE.MathUtils.lerp(a.from.y, a.to.y, k);
      s.y = walkHeight(s.x, s.z) + Math.sin(Math.PI * k) * a.arc;
      s.vy = 0;
      if (a.t >= 1) {
        s.anim = null;
        s.grounded = true;
        s.gait.land = 1;
        store.finishTravel();
      }
    } else {
      const k = keys.current;
      const forward = Number(k.has("KeyW") || k.has("ArrowUp")) - Number(k.has("KeyS") || k.has("ArrowDown"));
      const strafe = Number(k.has("KeyD") || k.has("ArrowRight")) - Number(k.has("KeyA") || k.has("ArrowLeft"));

      if (forward !== 0 || strafe !== 0) {
        const sin = Math.sin(s.yaw);
        const cos = Math.cos(s.yaw);
        // Frente = da câmera para o personagem; direita = frente × cima.
        let dx = -sin * forward + cos * strafe;
        let dz = -cos * forward - sin * strafe;
        const len = Math.hypot(dx, dz);
        dx /= len;
        dz /= len;
        const step = (k.has("ShiftLeft") || k.has("ShiftRight") ? RUN_SPEED : SPEED) * dt;
        const nx = s.x + dx * step;
        const nz = s.z + dz * step;
        if (!isBlocked(nx, nz, RADIUS)) {
          s.x = nx;
          s.z = nz;
        } else if (!isBlocked(nx, s.z, RADIUS)) {
          s.x = nx;
        } else if (!isBlocked(s.x, nz, RADIUS)) {
          s.z = nz;
        }
        s.facing = Math.atan2(dx, dz);
      }

      if (k.has("Space") && s.grounded) {
        s.vy = JUMP_SPEED;
        s.grounded = false;
      }

      const floor = walkHeight(s.x, s.z);
      s.vy -= GRAVITY * dt;
      s.y += s.vy * dt;
      // Gruda no chão em descidas suaves; sobe degraus pequenos (ponte, calçada).
      if (s.y <= floor || (s.grounded && s.vy <= 0 && s.y - floor < 0.45)) {
        // Touchdown after a real fall: knees absorb it in proportion to the impact speed.
        if (!s.grounded && s.vy < -3) s.gait.land = Math.min(1, -s.vy / 10);
        s.y = floor;
        s.vy = 0;
        s.grounded = true;
      } else {
        s.grounded = false;
      }
    }

    // Modelo
    const g = group.current;
    if (g) {
      g.position.set(s.x, s.y, s.z);
      const turn = Math.atan2(Math.sin(s.facing - g.rotation.y), Math.cos(s.facing - g.rotation.y));
      g.rotation.y += turn * Math.min(1, dt * 12);
    }
    // Gait driven by the distance actually travelled (after collisions), so feet don't skate.
    const travelled = s.anim ? 0 : Math.hypot(s.x - prevX, s.z - prevZ);
    s.speed += (travelled / Math.max(dt, 1e-4) - s.speed) * (1 - Math.exp(-dt * 10));
    const gait = s.gait;
    gait.time += dt;
    gait.move = THREE.MathUtils.smoothstep(s.speed, 0.2, 2.5);
    gait.run = THREE.MathUtils.clamp((s.speed - SPEED * 1.1) / (RUN_SPEED - SPEED * 1.1), 0, 1);
    if (s.grounded) {
      const step = THREE.MathUtils.lerp(WALK_STEP, RUN_STEP, gait.run);
      gait.phase += (travelled / (2 * step)) * Math.PI * 2;
    }
    const inAir = s.anim !== null || !s.grounded ? 1 : 0;
    gait.air += (inAir - gait.air) * (1 - Math.exp(-dt * 14));
    gait.land *= Math.exp(-dt * 7);
    if (rig.current) applyGait(rig.current, gait);
    playerRuntime.position.x = s.x;
    playerRuntime.position.y = s.y;
    playerRuntime.position.z = s.z;
    if (g) playerRuntime.heading = g.rotation.y;

    // Third-person camera; pulled in when a building sits between it and the player.
    const target = _target.set(s.x, s.y + 1.4, s.z);
    const dir = _dir.set(
      Math.sin(s.yaw) * Math.cos(s.pitch),
      Math.sin(s.pitch),
      Math.cos(s.yaw) * Math.cos(s.pitch),
    );
    let free = store.cameraDistance;
    for (let i = 1; i <= CAMERA_PROBES; i++) {
      const d = (store.cameraDistance * i) / CAMERA_PROBES;
      if (d < 2) continue; // the player may be hugging a wall
      const p = _probe.copy(target).addScaledVector(dir, d);
      if (isInsideBuilding(p.x, p.y, p.z, 0.25) || isInsideCanopy(p.x, p.y, p.z)) {
        free = Math.max(MIN_CAMERA_DISTANCE, d - store.cameraDistance / CAMERA_PROBES);
        break;
      }
    }
    // Snap in quickly when blocked, ease back out when clear.
    s.cameraDistance += (free - s.cameraDistance) * (free < s.cameraDistance ? 0.5 : 1 - Math.exp(-dt * 3));
    const desired = _desired.copy(target).addScaledVector(dir, s.cameraDistance);
    desired.y = Math.max(desired.y, walkHeight(desired.x, desired.z) + 1);
    if (!s.cameraReady) {
      camera.position.copy(desired);
      lookTarget.current.copy(target);
      s.cameraReady = true;
    } else {
      const follow = 1 - Math.exp(-dt * (s.anim ? 10 : 7));
      camera.position.lerp(desired, follow);
      lookTarget.current.lerp(target, follow);
    }
    camera.lookAt(lookTarget.current);

    // Vaga próxima → HUD
    s.nearbyTimer -= dt;
    if (s.nearbyTimer <= 0) {
      s.nearbyTimer = NEARBY_INTERVAL;
      const nearby = s.anim ? null : nearestVagaId(s.x, s.z);
      if (nearby !== store.nearbyVagaId) store.setNearbyVaga(nearby);
    }
  });

  return (
    <group ref={group}>
      <Desenvolvedor ref={rig} scale={CHARACTER_SCALE} />
    </group>
  );
}
