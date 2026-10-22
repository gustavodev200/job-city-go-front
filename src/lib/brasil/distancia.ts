const RAIO_TERRA_KM = 6371;
const RAD = Math.PI / 180;

type Coordenada = { lat: number; lon: number };

/** Distância em linha reta (haversine), em km inteiros — sem rotas reais (spec 002). */
export function distanciaKm(a: Coordenada, b: Coordenada): number {
  const dLat = (b.lat - a.lat) * RAD;
  const dLon = (b.lon - a.lon) * RAD;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * RAIO_TERRA_KM * Math.asin(Math.min(1, Math.sqrt(h))));
}
