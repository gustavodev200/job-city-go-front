"use client";

import { useEffect, useRef } from "react";
import {
  BRIDGE,
  CITY_BLOCK_CENTERS,
  CITY_BLOCK_SIZE,
  CITY_HALF,
  RIVER,
  VILLAGE_BOUNDS,
  VILLAGE_ROAD_WIDTH,
  VILLAGE_ROAD_XS,
  VILLAGE_ROAD_ZS,
} from "@/data/mapa";
import { CATEGORIA_COLORS, MODELO_COLORS } from "./cores";
import { vagasCidade, vagasVila } from "./layout";
import { playerRuntime } from "./playerRuntime";

/** World meters shown from the center to the rim. */
const RANGE = 70;

const POINTS = [
  ...vagasCidade.map((v) => ({ x: v.x, z: v.z, color: CATEGORIA_COLORS[v.categoria], aberta: v.status === "aberta" })),
  ...vagasVila.map((v) => ({ x: v.x, z: v.z, color: MODELO_COLORS.remoto, aberta: v.status === "aberta" })),
];

/** Circular radar mini-map. Rotates so the character always faces up. */
export function Minimap({ size }: { size: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const R = size / 2;
    const scale = R / RANGE;
    let frame = 0;

    const draw = (time: number) => {
      const { x: px, z: pz } = playerRuntime.position;
      const h = playerRuntime.heading;
      // Rotate the world so the facing direction (sin h, cos h) points to screen-up.
      const phi = -Math.PI / 2 - Math.atan2(Math.cos(h), Math.sin(h));
      const cos = Math.cos(phi);
      const sin = Math.sin(phi);
      const toScreen = (x: number, z: number) => {
        const dx = (x - px) * scale;
        const dz = (z - pz) * scale;
        return [R + dx * cos - dz * sin, R + dx * sin + dz * cos] as const;
      };

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.beginPath();
      ctx.arc(R, R, R - 3, 0, Math.PI * 2);
      ctx.clip();

      const bg = ctx.createRadialGradient(R, R, 0, R, R, R);
      bg.addColorStop(0, "#27463a");
      bg.addColorStop(1, "#13251d");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size, size);

      // Map shapes in world coordinates.
      ctx.save();
      ctx.translate(R, R);
      ctx.rotate(phi);
      ctx.scale(scale, scale);
      ctx.translate(-px, -pz);
      ctx.fillStyle = "rgba(255,255,255,0.13)";
      ctx.fillRect(-CITY_HALF, -CITY_HALF, CITY_HALF * 2, CITY_HALF * 2);
      ctx.fillStyle = "rgba(150,205,135,0.32)";
      const hb = CITY_BLOCK_SIZE / 2;
      for (const bx of CITY_BLOCK_CENTERS) {
        for (const bz of CITY_BLOCK_CENTERS) ctx.fillRect(bx - hb, bz - hb, CITY_BLOCK_SIZE, CITY_BLOCK_SIZE);
      }
      ctx.fillStyle = "#3f8fb8";
      ctx.fillRect(RIVER.x - RIVER.halfWidth, -400, RIVER.halfWidth * 2, 800);
      ctx.fillStyle = "#d8d2c4";
      ctx.fillRect(BRIDGE.x0, -BRIDGE.halfWidth, BRIDGE.x1 - BRIDGE.x0, BRIDGE.halfWidth * 2);
      ctx.fillStyle = "rgba(217,195,154,0.6)";
      ctx.fillRect(BRIDGE.x1, -VILLAGE_ROAD_WIDTH / 2, VILLAGE_BOUNDS.minX - BRIDGE.x1, VILLAGE_ROAD_WIDTH);
      const vw = VILLAGE_BOUNDS.maxX - VILLAGE_BOUNDS.minX;
      const vd = VILLAGE_BOUNDS.maxZ - VILLAGE_BOUNDS.minZ;
      for (const x of VILLAGE_ROAD_XS) ctx.fillRect(x - 2, VILLAGE_BOUNDS.minZ, VILLAGE_ROAD_WIDTH, vd);
      for (const z of VILLAGE_ROAD_ZS) ctx.fillRect(VILLAGE_BOUNDS.minX, z - 2, vw, VILLAGE_ROAD_WIDTH);
      ctx.restore();

      // Guide rings and a soft expanding surveillance ring.
      ctx.strokeStyle = "rgba(255,255,255,0.09)";
      ctx.lineWidth = 1;
      for (const f of [0.35, 0.7]) {
        ctx.beginPath();
        ctx.arc(R, R, R * f, 0, Math.PI * 2);
        ctx.stroke();
      }
      const pulse = (time / 2600) % 1;
      ctx.strokeStyle = `rgba(140,255,200,${0.35 * (1 - pulse)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(R, R, R * pulse, 0, Math.PI * 2);
      ctx.stroke();

      // Rotating radar sweep.
      if ("createConicGradient" in ctx) {
        const sweep = ctx.createConicGradient((time / 1400) % (Math.PI * 2), R, R);
        sweep.addColorStop(0, "rgba(140,255,200,0.26)");
        sweep.addColorStop(0.14, "rgba(140,255,200,0)");
        sweep.addColorStop(1, "rgba(140,255,200,0)");
        ctx.fillStyle = sweep;
        ctx.fillRect(0, 0, size, size);
      }

      // Job dots; out-of-range jobs stick to the rim as faded hints.
      for (const p of POINTS) {
        let [sx, sy] = toScreen(p.x, p.z);
        const dx = sx - R;
        const dy = sy - R;
        const dist = Math.hypot(dx, dy);
        const edge = dist > R - 9;
        if (edge) {
          sx = R + (dx / dist) * (R - 9);
          sy = R + (dy / dist) * (R - 9);
        }
        ctx.globalAlpha = (p.aberta ? 1 : 0.45) * (edge ? 0.55 : 1);
        ctx.beginPath();
        ctx.arc(sx, sy, edge ? 2.6 : 3.8, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = "rgba(255,255,255,0.85)";
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Player arrow (always pointing up).
      ctx.beginPath();
      ctx.moveTo(R, R - 9);
      ctx.lineTo(R + 6.5, R + 7);
      ctx.lineTo(R, R + 3.5);
      ctx.lineTo(R - 6.5, R + 7);
      ctx.closePath();
      ctx.fillStyle = "#ff9a3c";
      ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = "#fff7ea";
      ctx.stroke();
      ctx.restore();

      // Brass rim and north marker (north = -z).
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#c9a46a";
      ctx.beginPath();
      ctx.arc(R, R, R - 3, 0, Math.PI * 2);
      ctx.stroke();
      const nx = R + Math.sin(phi) * (R - 12);
      const ny = R - Math.cos(phi) * (R - 12);
      ctx.fillStyle = "#7a1f14";
      ctx.beginPath();
      ctx.arc(nx, ny, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff4dc";
      ctx.font = "bold 9px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("N", nx, ny + 0.5);

      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [size]);

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label="Mini-mapa com as vagas próximas; gira conforme a direção do personagem"
      style={{ width: size, height: size }}
      className="block rounded-full shadow-[0_6px_18px_rgba(0,0,0,0.35)]"
    />
  );
}
