// Leitura do geo.json gerado e funções puras sobre a grade do Brasil.
// Formato: specs/001-mapa-brasil/contracts/geo-brasil.md.
import geoJson from "@/data/brasil/geo.json";
import { CORES_BIOMA, estados, UFS, type Bioma, type Uf } from "@/data/brasil/estados";

type Ponto = [number, number];

type GeoUf = {
  /** [minX, minZ, maxX, maxZ] na cena. */
  caixa: [number, number, number, number];
  rotulo: Ponto;
  /** Anéis (externos e furos) simplificados, coordenadas da cena. */
  contorno: Ponto[][];
};

type GeoArquivo = {
  versao: number;
  creditos: string;
  grade: {
    lon0: number;
    lat0: number;
    passoLon: number;
    passoLat: number;
    largura: number;
    altura: number;
    ufs: string;
    linhas: string[];
  };
  ufs: Record<Uf, GeoUf>;
};

const geo = geoJson as unknown as GeoArquivo;
const CODIGOS = "ABCDEFGHIJKLMNOPQRSTUVWXYZa";

export const GRADE = geo.grade;
export const UF_GEO = geo.ufs;
export const CREDITOS_GEO = geo.creditos;

const { largura, altura } = GRADE;
const cx = (largura - 1) / 2;
const cz = (altura - 1) / 2;

/** Índice da UF por célula (-1 = mar), em ordem de linha. */
const celulas = new Int8Array(largura * altura).fill(-1);
GRADE.linhas.forEach((linha, lin) => {
  for (let col = 0; col < largura; col++) {
    celulas[lin * largura + col] = CODIGOS.indexOf(linha[col]);
  }
});

/** Caixa de todas as células de terra na cena. */
export const CAIXA_BRASIL = (() => {
  let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
  for (const uf of UFS) {
    const [a, b, c, d] = UF_GEO[uf].caixa;
    minX = Math.min(minX, a);
    minZ = Math.min(minZ, b);
    maxX = Math.max(maxX, c);
    maxZ = Math.max(maxZ, d);
  }
  return { minX, minZ, maxX, maxZ };
})();

export function projetar(lon: number, lat: number) {
  return {
    x: (lon - GRADE.lon0) / GRADE.passoLon - cx,
    z: (GRADE.lat0 - lat) / GRADE.passoLat - cz,
  };
}

/** Coluna/linha da célula que contém o ponto da cena (ou null fora da grade). */
export function celulaDoPonto(x: number, z: number) {
  const col = Math.round(x + cx);
  const lin = Math.round(z + cz);
  if (col < 0 || lin < 0 || col >= largura || lin >= altura) return null;
  return { col, lin };
}

export function ufDaCelula(col: number, lin: number): Uf | null {
  if (col < 0 || lin < 0 || col >= largura || lin >= altura) return null;
  const indice = celulas[lin * largura + col];
  return indice === -1 ? null : UFS[indice];
}

/** UF sob o ponto da cena — lookup O(1) usado na seleção pelo ponteiro. */
export function celulaEm(x: number, z: number): Uf | null {
  const c = celulaDoPonto(x, z);
  return c ? ufDaCelula(c.col, c.lin) : null;
}

/** Centro da célula na cena. */
export function centroDaCelula(col: number, lin: number) {
  return { x: col - cx, z: lin - cz };
}

// ── Relevo ilustrativo (não topográfico) ────────────────────────────────
const BASE_BIOMA: Record<Bioma, number> = {
  amazonia: 1,
  pantanal: 1,
  pampa: 2,
  caatinga: 2,
  cerrado: 3,
  "mata-atlantica": 3,
};
/** UFs com serra costeira (Serra do Mar / Mantiqueira, ilustrativa). */
const SERRA: ReadonlySet<Uf> = new Set<Uf>(["ES", "RJ", "SP", "PR", "SC", "MG"]);
const ALCANCE_SERRA = 6;
export const ALTURA_MAXIMA = 6;

/** Distância (em células, 4-vizinhança) até o mar. */
const distanciaMar = (() => {
  const dist = new Int16Array(largura * altura).fill(-1);
  const fila: number[] = [];
  for (let i = 0; i < celulas.length; i++) {
    if (celulas[i] === -1) {
      dist[i] = 0;
      fila.push(i);
    }
  }
  for (let k = 0; k < fila.length; k++) {
    const i = fila[k];
    const col = i % largura;
    const lin = (i - col) / largura;
    for (const [dc, dl] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const c = col + dc;
      const l = lin + dl;
      if (c < 0 || l < 0 || c >= largura || l >= altura) continue;
      const j = l * largura + c;
      if (dist[j] === -1) {
        dist[j] = dist[i] + 1;
        fila.push(j);
      }
    }
  }
  return dist;
})();

/** Hash inteiro → 0..1, determinístico. */
function hash(a: number, b: number) {
  let h = Math.imul(a, 374761393) ^ Math.imul(b, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Ruído de valor suave em baixa frequência (lattice a cada `escala` células). */
export function ruido(col: number, lin: number, escala = 9) {
  const x = col / escala;
  const y = lin / escala;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const sx = x - x0;
  const sy = y - y0;
  const u = sx * sx * (3 - 2 * sx);
  const v = sy * sy * (3 - 2 * sy);
  const a = hash(x0, y0);
  const b = hash(x0 + 1, y0);
  const c = hash(x0, y0 + 1);
  const d = hash(x0 + 1, y0 + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Altura em degraus (1..6) da célula; 0 no mar. */
export function alturaDaCelula(col: number, lin: number) {
  const uf = ufDaCelula(col, lin);
  if (!uf) return 0;
  let h = BASE_BIOMA[estados[uf].bioma] + Math.floor(ruido(col, lin) * 2.2);
  const mar = distanciaMar[lin * largura + col];
  if (SERRA.has(uf) && mar > 1 && mar <= ALCANCE_SERRA) h += 2;
  // Faixa de praia: a primeira célula da costa fica baixa.
  if (mar === 1) h = Math.min(h, 1);
  return Math.max(1, Math.min(ALTURA_MAXIMA, h));
}

// ── Malha do relevo (uma só geometria, cores por vértice) ───────────────
/** Altura, na cena, de cada degrau do relevo. */
export const ALTURA_DEGRAU = 0.15;

export { CORES_BIOMA };

const ESCURECER_LATERAL = 0.72;

export type MalhaRelevo = {
  posicoes: Float32Array;
  normais: Float32Array;
  /** Cores originais (bioma), para restaurar após destaque/calor. */
  cores: Float32Array;
  /** 1 = topo, ESCURECER_LATERAL = lateral; multiplica qualquer cor aplicada. */
  sombra: Float32Array;
  indices: Uint32Array;
  /** Vértices de cada UF são contíguos: [início, fim). */
  faixasPorUf: Record<Uf, [number, number]>;
};

/** Topo da célula na cena (y). */
export function topoDaCelula(col: number, lin: number) {
  return alturaDaCelula(col, lin) * ALTURA_DEGRAU;
}

export function construirMalhaRelevo(): MalhaRelevo {
  const posicoes: number[] = [];
  const normais: number[] = [];
  const cores: number[] = [];
  const sombra: number[] = [];
  const indices: number[] = [];
  const faixasPorUf = {} as Record<Uf, [number, number]>;
  const rgb = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  };

  const quad = (v: number[][], n: number[], cor: number[], fator: number) => {
    const base = posicoes.length / 3;
    for (const p of v) {
      posicoes.push(p[0], p[1], p[2]);
      normais.push(n[0], n[1], n[2]);
      cores.push(cor[0], cor[1], cor[2]);
      sombra.push(fator);
    }
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };

  // Laterais: [dc, dl, normal, cantos (dx, dz) em ordem anti-horária vista de fora].
  const LADOS: [number, number, number[], number[][]][] = [
    [1, 0, [1, 0, 0], [[0.5, 0.5], [0.5, -0.5]]],
    [-1, 0, [-1, 0, 0], [[-0.5, -0.5], [-0.5, 0.5]]],
    [0, 1, [0, 0, 1], [[-0.5, 0.5], [0.5, 0.5]]],
    [0, -1, [0, 0, -1], [[0.5, -0.5], [-0.5, -0.5]]],
  ];

  UFS.forEach((uf) => {
    const inicio = posicoes.length / 3;
    const corBioma = rgb(CORES_BIOMA[estados[uf].bioma]);
    for (let lin = 0; lin < altura; lin++) {
      for (let col = 0; col < largura; col++) {
        if (ufDaCelula(col, lin) !== uf) continue;
        const { x, z } = centroDaCelula(col, lin);
        const y = topoDaCelula(col, lin);
        const variacao = 0.94 + ruido(col * 7, lin * 7, 1.7) * 0.12;
        const cor = corBioma.map((c) => c * variacao);
        quad(
          [[x - 0.5, y, z - 0.5], [x - 0.5, y, z + 0.5], [x + 0.5, y, z + 0.5], [x + 0.5, y, z - 0.5]],
          [0, 1, 0],
          cor,
          1,
        );
        for (const [dc, dl, n, [a, b]] of LADOS) {
          const vizinha = topoDaCelula(col + dc, lin + dl);
          // Mar: a lateral desce um pouco abaixo da água para não deixar fresta.
          const fundo = vizinha === 0 ? -0.3 : vizinha;
          if (fundo >= y) continue;
          quad(
            [[x + a[0], y, z + a[1]], [x + a[0], fundo, z + a[1]], [x + b[0], fundo, z + b[1]], [x + b[0], y, z + b[1]]],
            n,
            cor,
            ESCURECER_LATERAL,
          );
        }
      }
    }
    faixasPorUf[uf] = [inicio, posicoes.length / 3];
  });

  return {
    posicoes: new Float32Array(posicoes),
    normais: new Float32Array(normais),
    cores: new Float32Array(cores),
    sombra: new Float32Array(sombra),
    indices: new Uint32Array(indices),
    faixasPorUf,
  };
}
