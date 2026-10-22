// Malha viária ilustrativa do mapa do Brasil: liga todas as cidades do mock. Pura e
// determinística — é também o grafo por onde o carro vai andar entre cidades e estados.
// Sem a grade do mapa (o nível Cidade usa o grafo); o traçado 3D fica em ./tracado.
import { cidades } from "@/data/brasil/cidades";
import type { Cidade } from "@/data/brasil/tipos";

export type TipoEstrada = "rodovia" | "estrada";

export type Estrada = {
  /** Ids das cidades nas pontas. */
  a: string;
  b: string;
  tipo: TipoEstrada;
  comprimento: number;
};

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

/** Distância do ponto ao segmento (no plano). */
export function distanciaAoSegmento(x: number, z: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax;
  const dz = bz - az;
  const l2 = dx * dx + dz * dz;
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
  return Math.hypot(x - (ax + dx * t), z - (az + dz * t));
}

export const estradasBrasil = gerarEstradas();

/** Trechos que saem (ou chegam) na cidade, com a cidade do outro lado. */
export function estradasDaCidade(id: string, rede: readonly Estrada[] = estradasBrasil) {
  return rede.filter((e) => e.a === id || e.b === id).map((e) => ({ ...e, outra: e.a === id ? e.b : e.a }));
}
