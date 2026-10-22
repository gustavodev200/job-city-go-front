// Malha viária ilustrativa do mapa do Brasil: liga todas as cidades do mock. Pura e
// determinística — é também o grafo por onde o carro vai andar entre cidades e estados.
import { cidades } from "@/data/brasil/cidades";
import type { Cidade } from "@/data/brasil/tipos";
import { celulaDoPonto, topoDaCelula } from "./geo";

export type TipoEstrada = "rodovia" | "estrada";

export type Estrada = {
  /** Ids das cidades nas pontas. */
  a: string;
  b: string;
  tipo: TipoEstrada;
  comprimento: number;
};

export type PontoEstrada = { x: number; y: number; z: number };

/** Sobre o mar (ponte) o tabuleiro fica um pouco acima da água. */
const ALTURA_PONTE = 0.12;
/** Folga sobre o relevo para não brigar com o chão. */
const FOLGA = 0.02;

const distancia = (p: Cidade, q: Cidade) => Math.hypot(p.x - q.x, p.z - q.z);

/** Union-find para o Kruskal. */
function conjuntos(ids: readonly string[]) {
  const pai = new Map(ids.map((id) => [id, id]));
  const raiz = (id: string): string => {
    const p = pai.get(id)!;
    if (p === id) return id;
    const r = raiz(p);
    pai.set(id, r);
    return r;
  };
  return {
    unir(a: string, b: string) {
      const ra = raiz(a);
      const rb = raiz(b);
      if (ra === rb) return false;
      pai.set(ra, rb);
      return true;
    },
  };
}

/** Pares ordenados por distância (desempate estável pelos ids). */
function paresPorDistancia(lista: readonly Cidade[]) {
  const pares: [Cidade, Cidade, number][] = [];
  for (let i = 0; i < lista.length; i++) {
    for (let j = i + 1; j < lista.length; j++) pares.push([lista[i], lista[j], distancia(lista[i], lista[j])]);
  }
  return pares.sort((p, q) => p[2] - q[2] || (p[0].id + p[1].id < q[0].id + q[1].id ? -1 : 1));
}

/**
 * Rodovias: árvore geradora mínima entre as capitais (liga todos os estados).
 * Estradas: completam a árvore mínima de todas as cidades a partir das rodovias, então
 * toda cidade alcança qualquer outra por terra.
 */
export function gerarEstradas(lista: readonly Cidade[] = cidades): Estrada[] {
  const uf = conjuntos(lista.map((c) => c.id));
  const saida: Estrada[] = [];
  const capitais = lista.filter((c) => c.capital);
  for (const [p, q, d] of paresPorDistancia(capitais)) {
    if (uf.unir(p.id, q.id)) saida.push({ a: p.id, b: q.id, tipo: "rodovia", comprimento: d });
  }
  for (const [p, q, d] of paresPorDistancia(lista)) {
    if (uf.unir(p.id, q.id)) saida.push({ a: p.id, b: q.id, tipo: "estrada", comprimento: d });
  }
  return saida;
}

/** Altura do leito da estrada num ponto da cena (topo do degrau do relevo; ponte no mar). */
export function alturaDaEstrada(x: number, z: number) {
  const cel = celulaDoPonto(x, z);
  const topo = cel ? topoDaCelula(cel.col, cel.lin) : 0;
  return (topo > 0 ? topo : ALTURA_PONTE) + FOLGA;
}

/** Pontos ao longo da estrada a cada `passo`, seguindo a altura do relevo. */
export function tracado(de: Cidade, ate: Cidade, passo = 0.2): PontoEstrada[] {
  const n = Math.max(1, Math.ceil(distancia(de, ate) / passo));
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const x = de.x + (ate.x - de.x) * t;
    const z = de.z + (ate.z - de.z) * t;
    return { x, y: alturaDaEstrada(x, z), z };
  });
}

/** Distância do ponto ao segmento (no plano). */
export function distanciaAoSegmento(x: number, z: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax;
  const dz = bz - az;
  const l2 = dx * dx + dz * dz;
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
  return Math.hypot(x - (ax + dx * t), z - (az + dz * t));
}

export const estradasBrasil = gerarEstradas();
