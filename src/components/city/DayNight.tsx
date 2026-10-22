"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "@/lib/movimento";
import { selecionarHora, useRelogioReal, useTempoStore } from "@/stores/tempo";
import { aproximar, calcularCeu, cicloRuntime, criarEstado } from "./ciclo";
import { GLASS_MATERIAL, LIT_MATERIAL } from "./Instanced";
import { playerRuntime } from "./playerRuntime";
import type { Poste } from "./Roads";

const SHADOW_EXTENT = 50;
const SHADOW_MAP = 2048;
const TEXEL = (SHADOW_EXTENT * 2) / SHADOW_MAP;
const LIGHT_DISTANCE = 90;
const SKY_RADIUS = 400;
const STAR_RADIUS = 380;
const STAR_COUNT = 2200;

/** Targets are recomputed once per second; the scene eases toward them every frame. */
const TICK = 1;
/** Damping rate: ~98% of the way in 1 s. */
const EASE = 4;

const WINDOW_DAY = 0.3;
const WINDOW_NIGHT = 1.9;
const GLASS_DAY = new THREE.Color("#9cc4d8");
const GLASS_NIGHT = new THREE.Color("#33445a");

// ── Sky dome shader ─────────────────────────────────────────────────────
const NOISE_GLSL = /* glsl */ `
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }
`;

const SKY_VERTEX = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAGMENT = /* glsl */ `
  uniform vec3 uTopo;
  uniform vec3 uHorizonte;
  uniform vec3 uBrilho;
  uniform vec3 uNuvem;
  uniform vec3 uCorSol;
  uniform vec3 uSol;
  uniform float uNoite;
  uniform float uTempo;
  uniform float uFaseLua;
  varying vec3 vDir;
  ${NOISE_GLSL}

  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    vec3 col = mix(uHorizonte, uTopo, pow(clamp(h, 0.0, 1.0), 0.55));
    col = mix(col, uHorizonte * 0.8, smoothstep(0.0, -0.3, h));

    // Warm glow hugging the horizon on the sun side (dawn / dusk).
    float sd = max(dot(d, uSol), 0.0);
    float faixa = exp(-max(h, 0.0) * 5.0) * smoothstep(-0.2, 0.0, h);
    col += uBrilho * (pow(sd, 4.0) * 0.9 + pow(sd, 24.0) * 0.6) * faixa;

    float acima = smoothstep(-0.02, 0.2, h);

    // Milky Way: soft band on a tilted great circle, broken up by dust lanes.
    if (uNoite > 0.001) {
      vec3 eixo = normalize(vec3(0.35, 0.45, 0.82));
      float distancia = dot(d, eixo) * 3.2;
      float banda = exp(-distancia * distancia);
      float brilhoVia = fbm(d * 5.0 + 3.1);
      float poeira = smoothstep(0.45, 0.75, fbm(d * 11.0 + 7.0));
      float via = banda * (0.35 + brilhoVia) * (1.0 - poeira * 0.7);
      col += vec3(0.42, 0.46, 0.68) * via * 0.22 * uNoite * acima;
    }

    // Sun disc and halo.
    float visSol = smoothstep(-0.06, 0.02, uSol.y);
    float disco = smoothstep(0.99955, 0.9998, sd);
    col += uCorSol * (disco * 4.0 + pow(sd, 600.0) * 1.2 + pow(sd, 40.0) * 0.12) * visSol;

    // Moon opposite the sun, shaded with the real phase and darker maria.
    vec3 lua = -uSol;
    float md = dot(d, lua);
    float visLua = smoothstep(-0.06, 0.04, lua.y);
    float fase = uFaseLua * 6.2831853;
    float iluminada = (1.0 - cos(fase)) * 0.5;
    if (md > 0.99) {
      vec3 lado = normalize(cross(vec3(0.0, 1.0, 0.0), lua));
      vec3 cima = cross(lua, lado);
      vec2 uv = vec2(dot(d, lado), dot(d, cima)) / 0.035;
      float r2 = dot(uv, uv);
      if (r2 < 1.0) {
        vec3 n = vec3(uv, sqrt(1.0 - r2));
        float acesa = smoothstep(-0.08, 0.08, dot(n, vec3(sin(fase), 0.0, -cos(fase))));
        float mares = smoothstep(0.45, 0.65, fbm(vec3(uv * 1.8, 4.2)));
        vec3 superficie = vec3(0.95, 0.95, 1.0) * (1.0 - mares * 0.3);
        float borda = smoothstep(1.0, 0.9, r2);
        col = mix(col, superficie * (acesa * 1.15 + 0.05), borda * visLua * max(uNoite, 0.35));
      }
    }
    float halo = pow(max(md, 0.0), 900.0) * 0.35 + pow(max(md, 0.0), 60.0) * 0.08;
    col += vec3(0.55, 0.65, 0.9) * halo * visLua * iluminada * uNoite;

    // Drifting clouds projected on a flat ceiling, rim-lit toward the sun.
    if (h > 0.0) {
      vec2 p = d.xz / (h + 0.18) * 1.4 + uTempo * vec2(0.012, 0.004);
      float n = fbm(vec3(p, uTempo * 0.01));
      float c = smoothstep(0.52, 0.78, n) * smoothstep(0.0, 0.22, h);
      vec3 corNuvem = uNuvem * (0.85 + 0.25 * fbm(vec3(p * 2.0, 5.0))) + uBrilho * pow(sd, 3.0) * 0.6;
      col = mix(col, corNuvem, c * 0.85);
    }

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

// ── Stars ───────────────────────────────────────────────────────────────
const STAR_VERTEX = /* glsl */ `
  attribute float aTamanho;
  attribute float aFase;
  attribute vec3 aCor;
  uniform float uTempo;
  uniform float uBrilho;
  uniform float uPiscar;
  uniform float uDpr;
  varying vec3 vCor;
  varying float vAlpha;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    float pisca = 1.0 - uPiscar * 0.5 * (0.5 + 0.5 * sin(uTempo * (1.2 + aFase * 2.8) + aFase * 40.0));
    vAlpha = uBrilho * pisca * smoothstep(-0.02, 0.2, normalize(position).y);
    vCor = aCor;
    gl_PointSize = aTamanho * uDpr;
  }
`;

const STAR_FRAGMENT = /* glsl */ `
  varying vec3 vCor;
  varying float vAlpha;
  void main() {
    float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
    a *= a * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vCor, a);
  }
`;

/** Deterministic PRNG so the star field is the same on every load. */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function starGeometry() {
  const random = mulberry32(2024);
  const positions = new Float32Array(STAR_COUNT * 3);
  const sizes = new Float32Array(STAR_COUNT);
  const phases = new Float32Array(STAR_COUNT);
  const colors = new Float32Array(STAR_COUNT * 3);
  const tints = ["#ffffff", "#ffffff", "#dfe8ff", "#fff1d6", "#cfdcff"].map((c) => new THREE.Color(c));
  for (let i = 0; i < STAR_COUNT; i++) {
    // Uniform on the upper hemisphere (plus a sliver below the horizon).
    const y = random() * 1.05 - 0.05;
    const angle = random() * Math.PI * 2;
    const r = Math.sqrt(1 - y * y);
    positions.set([Math.cos(angle) * r * STAR_RADIUS, y * STAR_RADIUS, Math.sin(angle) * r * STAR_RADIUS], i * 3);
    // Mostly tiny points, a few bright ones.
    sizes[i] = 1.6 + Math.pow(random(), 5) * 3.6;
    phases[i] = random();
    tints[Math.floor(random() * tints.length)].toArray(colors, i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.setAttribute("aTamanho", new THREE.BufferAttribute(sizes, 1));
  g.setAttribute("aFase", new THREE.BufferAttribute(phases, 1));
  g.setAttribute("aCor", new THREE.BufferAttribute(colors, 3));
  return g;
}

/** Soft radial dot used for lamp halos and light pools. */
function glowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.45)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// ── Street lights ───────────────────────────────────────────────────────
/** Only the lamps closest to the player get a real point light. */
const LAMP_LIGHT_POOL = 4;

const GLOW_MAP = glowTexture();
const ADDITIVE = { map: GLOW_MAP, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false };
const HALO_MATERIAL = new THREE.PointsMaterial({ ...ADDITIVE, color: "#ffcf8a", size: 2.4, sizeAttenuation: true });
const POOL_MATERIAL = new THREE.MeshBasicMaterial({ ...ADDITIVE, color: "#ffb45e", polygonOffset: true, polygonOffsetFactor: -4 });
function StreetLights({ pointLights, postes: LAMP_HEADS }: { pointLights: boolean; postes: readonly Poste[] }) {
  const pools = useRef<THREE.InstancedMesh>(null);
  const HALO_GEOMETRY = useMemo(
    () =>
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.Float32BufferAttribute(LAMP_HEADS.flatMap((l) => [l.x, l.y - 0.05, l.z]), 3),
      ),
    [LAMP_HEADS],
  );
  const lights = useRef<(THREE.PointLight | null)[]>([]);
  const sinceTick = useRef(TICK);

  useLayoutEffect(() => {
    const mesh = pools.current;
    if (!mesh) return;
    const d = new THREE.Object3D();
    LAMP_HEADS.forEach((l, i) => {
      d.position.set(l.x, l.groundY + 0.02, l.z);
      d.rotation.set(-Math.PI / 2, 0, 0);
      d.scale.setScalar(7);
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [LAMP_HEADS]);

  useFrame((_, dt) => {
    const on = cicloRuntime.luzes;
    HALO_MATERIAL.opacity = on * 0.9;
    POOL_MATERIAL.opacity = on * 0.5;
    HALO_MATERIAL.visible = POOL_MATERIAL.visible = on > 0.01;
    if (!pointLights) return;

    sinceTick.current += dt;
    if (sinceTick.current >= TICK) {
      sinceTick.current = 0;
      const p = playerRuntime.position;
      const nearest = LAMP_HEADS.map((l, i) => [(l.x - p.x) ** 2 + (l.z - p.z) ** 2, i] as const)
        .sort((a, b) => a[0] - b[0])
        .slice(0, LAMP_LIGHT_POOL);
      nearest.forEach(([, index], i) => {
        const l = LAMP_HEADS[index];
        lights.current[i]?.position.set(l.x, l.y - 0.3, l.z);
      });
    }
    for (const light of lights.current) if (light) light.intensity = on * 7;
  });

  return (
    <>
      <points geometry={HALO_GEOMETRY} material={HALO_MATERIAL} frustumCulled={false} renderOrder={3} />
      <instancedMesh ref={pools} args={[undefined, POOL_MATERIAL, LAMP_HEADS.length]} renderOrder={2}>
        <planeGeometry args={[1, 1]} />
      </instancedMesh>
      {pointLights &&
        Array.from({ length: LAMP_LIGHT_POOL }, (_, i) => (
          <pointLight
            key={i}
            ref={(el) => {
              lights.current[i] = el;
            }}
            color="#ffc47a"
            intensity={0}
            distance={11}
            decay={2}
          />
        ))}
    </>
  );
}

/** Target state (recomputed each tick) and the eased state the scene shows. */
const target = criarEstado();
const current = criarEstado();

const SKY_GEOMETRY = new THREE.SphereGeometry(SKY_RADIUS, 48, 24);
const SKY_MATERIAL = new THREE.ShaderMaterial({
  vertexShader: SKY_VERTEX,
  fragmentShader: SKY_FRAGMENT,
  uniforms: {
    // Shared with `current`: easing the state updates the sky directly.
    uTopo: { value: current.topo },
    uHorizonte: { value: current.horizonte },
    uBrilho: { value: current.brilho },
    uNuvem: { value: current.nuvem },
    uCorSol: { value: current.corSol },
    uSol: { value: current.sol },
    uNoite: { value: 0 },
    uTempo: { value: 0 },
    uFaseLua: { value: 0.5 },
  },
  side: THREE.BackSide,
  depthWrite: false,
  fog: false,
  toneMapped: false,
});
const STAR_GEOMETRY = starGeometry();
const STAR_MATERIAL = new THREE.ShaderMaterial({
  vertexShader: STAR_VERTEX,
  fragmentShader: STAR_FRAGMENT,
  uniforms: { uTempo: { value: 0 }, uBrilho: { value: 0 }, uPiscar: { value: 1 }, uDpr: { value: 1 } },
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  fog: false,
});

// ── Day/night cycle ─────────────────────────────────────────────────────
/**
 * Sky, stars, sun, moon and ambient light driven by the device's local time
 * (or the manual slider). Nothing is recreated on hour changes: only colors,
 * intensities and uniforms are eased.
 */
type DayNightProps = {
  shadows: boolean;
  pointLights: boolean;
  /** Ponto que o sol e a lua acompanham (padrão: personagem). */
  foco?: () => { x: number; z: number };
  /** Raio da cúpula do céu; a câmera precisa de `far` maior que isto. */
  raioCeu?: number;
  neblina?: [number, number];
  /** Postes, janelas e vidros da cidade (desligado no mapa do Brasil). */
  cidade?: boolean;
  /** Lâmpadas dos postes do mundo aberto (cidade). */
  postes?: readonly Poste[];
};

const focoPersonagem = () => playerRuntime.position;
const SEM_POSTES: readonly Poste[] = [];

export function DayNight({
  shadows,
  pointLights,
  foco = focoPersonagem,
  raioCeu = SKY_RADIUS,
  neblina = [85, 250],
  cidade = true,
  postes = SEM_POSTES,
}: DayNightProps) {
  useRelogioReal();
  const reduced = useReducedMotion();
  const dome = useRef<THREE.Group>(null);
  const background = useRef<THREE.Color>(null);
  const fog = useRef<THREE.Fog>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const moon = useRef<THREE.DirectionalLight>(null);
  const clock = useRef({ sinceTick: TICK, first: true, time: 0 });

  // Slider moves apply right away instead of waiting for the next tick.
  useEffect(
    () =>
      useTempoStore.subscribe(() => {
        clock.current.sinceTick = TICK;
      }),
    [],
  );

  useFrame(({ camera, viewport }, dt) => {
    const c = clock.current;
    c.sinceTick += dt;
    if (c.sinceTick >= TICK) {
      c.sinceTick = 0;
      calcularCeu(selecionarHora(useTempoStore.getState()), target);
    }
    aproximar(current, target, reduced || c.first ? 1 : 1 - Math.exp(-EASE * dt));
    c.first = false;
    if (!reduced) c.time += dt;
    cicloRuntime.noite = current.noite;
    cicloRuntime.luzes = current.luzes;

    dome.current?.position.copy(camera.position);
    SKY_MATERIAL.uniforms.uNoite.value = current.noite;
    SKY_MATERIAL.uniforms.uTempo.value = c.time;
    SKY_MATERIAL.uniforms.uFaseLua.value = current.faseLua;
    const starAlpha = THREE.MathUtils.smoothstep(current.noite, 0.35, 1);
    STAR_MATERIAL.uniforms.uBrilho.value = starAlpha;
    STAR_MATERIAL.uniforms.uTempo.value = c.time;
    STAR_MATERIAL.uniforms.uPiscar.value = reduced ? 0 : 1;
    STAR_MATERIAL.uniforms.uDpr.value = viewport.dpr;
    STAR_MATERIAL.visible = starAlpha > 0.005;

    background.current?.copy(current.horizonte);
    fog.current?.color.copy(current.neblina);
    if (hemi.current) {
      hemi.current.color.copy(current.ceuLuz);
      hemi.current.groundColor.copy(current.chaoLuz);
      hemi.current.intensity = current.ambiente;
    }

    if (cidade) {
      LIT_MATERIAL.emissiveIntensity = THREE.MathUtils.lerp(WINDOW_DAY, WINDOW_NIGHT, current.luzes);
      GLASS_MATERIAL.color.lerpColors(GLASS_DAY, GLASS_NIGHT, current.noite);
    }

    // Both lights follow the focus; the box is snapped to texels to avoid shimmering.
    const p = foco();
    const x = Math.round(p.x / TEXEL) * TEXEL;
    const z = Math.round(p.z / TEXEL) * TEXEL;
    const s = sun.current;
    if (s) {
      s.position.set(x, 0, z).addScaledVector(current.sol, LIGHT_DISTANCE);
      s.target.position.set(x, 0, z);
      s.target.updateMatrixWorld();
      s.color.copy(current.corSol);
      s.intensity = current.intensidadeSol;
      // Below the horizon the light is off: skip re-rendering its shadow map.
      s.shadow.autoUpdate = current.intensidadeSol > 0.01;
      // Render it once anyway so the map exists when the page opens at night.
      if (!s.shadow.map) s.shadow.needsUpdate = true;
    }
    const m = moon.current;
    if (m) {
      m.position.set(x, 0, z).addScaledVector(current.sol, -LIGHT_DISTANCE);
      m.target.position.set(x, 0, z);
      m.target.updateMatrixWorld();
      m.intensity = current.intensidadeLua;
    }
  });

  return (
    <>
      <color ref={background} attach="background" args={["#dcedf3"]} />
      <fog ref={fog} attach="fog" args={["#dcedf3", neblina[0], neblina[1]]} />
      <group ref={dome} scale={raioCeu / SKY_RADIUS}>
        <mesh geometry={SKY_GEOMETRY} material={SKY_MATERIAL} renderOrder={-2} />
        <points geometry={STAR_GEOMETRY} material={STAR_MATERIAL} renderOrder={-1} frustumCulled={false} />
      </group>
      <hemisphereLight ref={hemi} args={["#eef6ff", "#a7c48c", 1.3]} />
      <directionalLight
        ref={sun}
        color="#fff0d6"
        intensity={2.3}
        castShadow={shadows}
        shadow-mapSize={[SHADOW_MAP, SHADOW_MAP]}
        shadow-camera-left={-SHADOW_EXTENT}
        shadow-camera-right={SHADOW_EXTENT}
        shadow-camera-top={SHADOW_EXTENT}
        shadow-camera-bottom={-SHADOW_EXTENT}
        shadow-camera-near={1}
        shadow-camera-far={180}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-radius={4}
      />
      <directionalLight ref={moon} color="#9fb8ff" intensity={0} />
      {cidade && postes.length > 0 && <StreetLights pointLights={pointLights} postes={postes} />}
    </>
  );
}
