// Deslocamento estimado até a vaga (FR-006): linha reta, sem rota nem trânsito.
import type { Cidade } from "@/data/brasil/tipos";
import { distanciaKm } from "@/lib/brasil/distancia";

const VELOCIDADE_KMH = 45;
const MINIMO_MIN = 10;

export type Deslocamento = { mesmaCidade: true } | { mesmaCidade: false; km: number; minutos: number };

export function estimarDeslocamento(origem: Cidade, destino: Cidade): Deslocamento {
  if (origem.id === destino.id) return { mesmaCidade: true };
  const km = distanciaKm(origem, destino);
  const minutos = Math.max(MINIMO_MIN, Math.round((km / VELOCIDADE_KMH) * 12) * 5);
  return { mesmaCidade: false, km, minutos };
}

/** "~25 km · ~35 min de carro · presença 1 dia por semana" ou "Na sua cidade". */
export function textoDeslocamento(d: Deslocamento, frequencia?: string) {
  const presenca = frequencia ? ` · presença ${frequencia}` : "";
  if (d.mesmaCidade) return `Na sua cidade${presenca}`;
  return `~${d.km} km · ~${d.minutos} min de carro${presenca}`;
}
