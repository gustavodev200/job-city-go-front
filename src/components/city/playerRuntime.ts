import { AREAS } from "@/data/mapa";

/**
 * Live player state written by Player every frame and read outside React
 * (sun/shadows, HUD mini-map). Plain object: no three.js import, safe for the HUD.
 */
export const playerRuntime = {
  position: { x: AREAS.cidade.x, y: 0, z: AREAS.cidade.z },
  /** Facing angle in radians (0 = +z). */
  heading: Math.PI,
};
