// "Perto de mim" (research R5, R12): distância em linha reta e anel do raio no mapa.
import type { Cidade } from "@/data/brasil/tipos";
import type { VagaNacional } from "@/data/brasil/vagas";
import { distanciaKm } from "@/lib/brasil/distancia";
import { projetar } from "@/lib/brasil/geo";
import { cidadePorId } from "@/lib/brasil/rotas";

const RAIO_TERRA_KM = 6371;
const RAD = Math.PI / 180;

/** Km da cidade de referência até a cidade da vaga; remota não tem distância. */
export function distanciaDaVaga(v: VagaNacional, ref: Cidade): number | null {
  const cidade = v.cidadeId ? cidadePorId.get(v.cidadeId) : undefined;
  return cidade ? distanciaKm(ref, cidade) : null;
}

/** Pontos (na cena do mapa) a `raioKm` da cidade, fechando o anel (último = primeiro). */
export function anelDoRaio(ref: Pick<Cidade, "lat" | "lon">, raioKm: number, n = 64) {
  const d = raioKm / RAIO_TERRA_KM;
  const lat1 = ref.lat * RAD;
  const lon1 = ref.lon * RAD;
  const pontos: { x: number; z: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const rumo = ((i % n) / n) * 2 * Math.PI;
    // Ponto de destino na esfera a partir de um rumo e uma distância.
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(rumo));
    const lon2 =
      lon1 + Math.atan2(Math.sin(rumo) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
    pontos.push(projetar(lon2 / RAD, lat2 / RAD));
  }
  return pontos;
}
