// Mundo do nível Cidade gerado a partir das vagas (research R1–R3, data-model). Puro e
// determinístico: mesma entrada, mesmo mundo. Unidades da cena (~1 = 1 metro).
import { FACADES, FILLER_HOUSES, REMOTE_HOUSE, TORRE_PATROCINADA } from "@/components/city/facades";
import { cidades } from "@/data/brasil/cidades";
import type { Uf } from "@/data/brasil/estados";
import type { Cidade } from "@/data/brasil/tipos";
import { vagasBrasil, type VagaNacional } from "@/data/brasil/vagas";
import type { Modelo } from "@/data/vagas";

// ── Escala (igual à cidade original de 6×6) ─────────────────────────────
/** Topo do gramado dos lotes — base dos prédios da cidade. */
export const LOT_TOP = 0.18;
export const QUARTEIRAO = 14;
export const PASSO = 20;
export const RUA_CIDADE = 6;
export const RUA_VILA = 4;
export const FONTE_RAIO = 3;
/** Limite de construções desenhadas (vagas + casas decorativas). */
export const MAX_CONSTRUCOES = 400;

const RIO = { meiaLargura: 8, profundidade: 2, aguaY: -0.45 } as const;
const PONTE = { meiaComprimento: 13, meiaLargura: 3.2, topo: 0.35 } as const;
/** Distância da borda da cidade ao centro do rio (63 → 86 na cidade 6×6). */
const CIDADE_AO_RIO = 23;
/** Rio fixo do Bairro Remoto (mesma posição da vila original). */
const RIO_REMOTO_X = 86;
const COLINA = { inicioRio: 12, fimRio: 22, altura: 3 } as const;
/** Casas por quarteirão no Bairro Remoto (2×2). */
const CASAS_REMOTAS: readonly (readonly [number, number])[] = [
  [-3.4, -3.6],
  [3.4, -3.6],
  [-3.4, 3.6],
  [3.4, 3.6],
];
const OFFSETS_CASAS: readonly (readonly [number, number])[] = [
  [-3.4, -3.4],
  [3.4, -3.4],
  [-3.4, 3.4],
  [3.4, 3.4],
];
const VAGAS_ESTACIONAMENTO = [
  [-4.5, -3.2, 0],
  [1.5, -3.2, 0],
  [4.5, -3.2, 0],
  [-1.5, 3.2, Math.PI],
  [4.5, 3.2, Math.PI],
] as const;
export const N_CORES_CARRO = 3;

// ── Tipos ───────────────────────────────────────────────────────────────
export type Ponto = { x: number; z: number };
export type Caixa = { minX: number; maxX: number; minZ: number; maxZ: number };

export type Lote = { vaga: VagaNacional; x: number; z: number; y: number };

export type VagaSpot = {
  id: string;
  x: number;
  /** Chão do prédio. */
  baseY: number;
  /** Altura do marcador. */
  y: number;
  z: number;
  /** Raio de interação. */
  radius: number;
  /** Meia diagonal da base — anel de destaque. */
  size: number;
  aberta: boolean;
  modelo: Modelo;
  destaque: boolean;
};

export type Rect = { x: number; z: number; hw: number; hd: number; bottom: number; top: number };

export type EntradaMundo =
  | { tipo: "cidade"; cidade: Cidade; vagas: readonly VagaNacional[] }
  | { tipo: "remoto"; vagas: readonly VagaNacional[] };

/** Bairro Remoto: planalto a leste do rio com as casas das vagas remotas. */
export type Vila = {
  centrosX: number[];
  centrosZ: number[];
  ruasX: number[];
  ruasZ: number[];
  larguraRua: number;
  urbano: Caixa;
};

export type Mundo = {
  id: string;
  tipo: "cidade" | "remoto";
  nome: string;
  uf: Uf | null;
  vagas: readonly VagaNacional[];
  /** Centros dos quarteirões em x e em z (cidade: iguais; vila: x a leste do rio). */
  centrosX: number[];
  centrosZ: number[];
  /** Linhas centrais das ruas. */
  ruasX: number[];
  ruasZ: number[];
  larguraRua: number;
  /** Área urbana (até a borda externa das ruas). */
  urbano: Caixa;
  praca: Ponto | null;
  estacionamento: Ponto | null;
  lotes: Lote[];
  casas: (Ponto & { variante: number })[];
  carros: (Ponto & { rotY: number; cor: number })[];
  rio: { x: number; meiaLargura: number; profundidade: number; aguaY: number };
  ponte: { x0: number; x1: number; meiaLargura: number; topo: number };
  colina: { inicio: number; fim: number; altura: number } | null;
  /** Bairro Remoto do outro lado da ponte (na cidade, junto com as vagas presenciais/híbridas). */
  vila: Vila | null;
  /** Só no Bairro Remoto avulso (`/remoto`): margem oeste que leva de volta. */
  portal: Caixa | null;
  /** `praca`: chegada padrão; `ponte`: cabeceira da ponte; `vila`: primeira rua do Bairro Remoto. */
  nascimento: { praca: Ponto; ponte: Ponto; vila: Ponto | null };
  limites: Caixa;
  spots: VagaSpot[];
  colisores: Rect[];
  alturaDoChao: (x: number) => number;
  alturaDoPasso: (x: number, z: number) => number;
  bloqueado: (x: number, z: number, raio: number) => boolean;
  dentroDePredio: (x: number, y: number, z: number, folga: number) => boolean;
  vagaProxima: (x: number, z: number) => string | null;
  noPortal: (x: number, z: number) => boolean;
  /** Lado leste do rio = Bairro Remoto. */
  naVila: (x: number) => boolean;
};

// ── Auxiliares puros ────────────────────────────────────────────────────
function smoothstep(a: number, b: number, v: number) {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** Praça fixa: os quarteirões crescem em volta dela, então vaga nova nunca move as antigas. */
const PRACA: Ponto = { x: -10, z: 10 };

/**
 * Os `k` quarteirões de uma rede fixa (centros em múltiplos ímpares de 10, para que haja rua
 * em z = 0 — a avenida da ponte) mais próximos de `centro`, e a caixa que os contém.
 * `colunaMinima` corta a rede a oeste (vila: só a leste da colina).
 */
function prefixoDaRede(centro: Ponto, k: number, colunaMinima = -Infinity) {
  const raio = (Math.ceil(Math.sqrt(k)) + 2) * PASSO;
  const candidatos: Ponto[] = [];
  for (let x = centro.x - raio; x <= centro.x + raio; x += PASSO) {
    for (let z = centro.z - raio; z <= centro.z + raio; z += PASSO) if (x >= colunaMinima) candidatos.push({ x, z });
  }
  const escolhidos = porProximidade(candidatos, centro).slice(0, k);
  const xs = [...new Set(escolhidos.map((b) => b.x))].sort((a, b) => a - b);
  const zs = [...new Set(escolhidos.map((b) => b.z))].sort((a, b) => a - b);
  // Completa a caixa: quarteirões dos cantos também existem (ganham casas).
  const centrosX = Array.from({ length: (xs.at(-1)! - xs[0]) / PASSO + 1 }, (_, i) => xs[0] + i * PASSO);
  const centrosZ = Array.from({ length: (zs.at(-1)! - zs[0]) / PASSO + 1 }, (_, i) => zs[0] + i * PASSO);
  const blocos = centrosX.flatMap((x) => centrosZ.map((z) => ({ x, z })));
  return { centrosX, centrosZ, ordem: porProximidade(blocos, centro) };
}

/** Quarteirões ordenados por distância a um ponto, depois por ângulo (estável). */
function porProximidade(blocos: Ponto[], centro: Ponto) {
  return [...blocos].sort(
    (a, b) =>
      Math.hypot(a.x - centro.x, a.z - centro.z) - Math.hypot(b.x - centro.x, b.z - centro.z) ||
      Math.atan2(a.z - centro.z, a.x - centro.x) - Math.atan2(b.z - centro.z, b.x - centro.x),
  );
}

const ret = (x: number, z: number, [w, d]: readonly [number, number], base: number, altura: number): Rect => ({
  x,
  z,
  hw: w / 2,
  hd: d / 2,
  bottom: base,
  top: base + altura,
});

const hojeIso = () => new Date().toISOString().slice(0, 10);
export const destaqueAtivo = (v: VagaNacional, hoje = hojeIso()) => !!v.destaque && v.destaque.ate >= hoje;

/** Construção do lote: patrocinada vira a torre dourada; remota, casa da vila; senão a fachada da categoria. */
export function facadeDaVaga(v: VagaNacional) {
  if (destaqueAtivo(v)) return TORRE_PATROCINADA;
  return v.modelo === "remoto" ? REMOTE_HOUSE : FACADES[v.categoria];
}

// ── Geração ─────────────────────────────────────────────────────────────
export function gerarMundo(entrada: EntradaMundo): Mundo {
  return entrada.tipo === "cidade" ? gerarCidade(entrada.cidade, entrada.vagas) : gerarRemoto(entrada.vagas);
}

function gerarCidade(cidade: Cidade, todas: readonly VagaNacional[]): Mundo {
  const vagas = todas.filter((v) => v.modelo !== "remoto" && v.cidadeId === cidade.id);
  const remotas = todas.filter((v) => v.modelo === "remoto");
  const casasMinimas = Math.max(2, Math.ceil(vagas.length * 0.15));
  // Praça + vagas + estacionamento + casas: no mínimo 3×3 (a praça e seus 4 vizinhos).
  const { centrosX, centrosZ, ordem } = prefixoDaRede(PRACA, Math.max(5, vagas.length + 2 + casasMinimas));
  const praca = ordem[0];
  const livres = ordem.slice(1);
  const lotes: Lote[] = vagas.map((vaga, i) => ({ vaga, x: livres[i].x, z: livres[i].z, y: LOT_TOP }));
  const sobra = livres.slice(vagas.length);
  const estacionamento = sobra.length > 1 ? sobra[0] : null;
  const blocosCasas = sobra.slice(estacionamento ? 1 : 0);
  const maxCasas = Math.max(0, MAX_CONSTRUCOES - lotes.length);
  const casas = blocosCasas
    .flatMap((b) => OFFSETS_CASAS.map(([dx, dz]) => ({ x: b.x + dx, z: b.z + dz })))
    .slice(0, maxCasas)
    .map((p, i) => ({ ...p, variante: i % FILLER_HOUSES.length }));
  const carros = estacionamento
    ? VAGAS_ESTACIONAMENTO.map(([dx, dz, rotY], i) => ({
        x: estacionamento.x + dx,
        z: estacionamento.z + dz,
        rotY,
        cor: i % N_CORES_CARRO,
      }))
    : [];

  const ruasX = [centrosX[0] - PASSO / 2, ...centrosX.map((c) => c + PASSO / 2)];
  const ruasZ = [centrosZ[0] - PASSO / 2, ...centrosZ.map((c) => c + PASSO / 2)];
  const borda = RUA_CIDADE / 2;
  const urbano = { minX: ruasX[0] - borda, maxX: ruasX.at(-1)! + borda, minZ: ruasZ[0] - borda, maxZ: ruasZ.at(-1)! + borda };
  const rioX = urbano.maxX + CIDADE_AO_RIO;
  const ponte = { x0: rioX - PONTE.meiaComprimento, x1: rioX + PONTE.meiaComprimento, meiaLargura: PONTE.meiaLargura, topo: PONTE.topo };

  const colisores: Rect[] = [
    ...lotes.map((l) => {
      const f = facadeDaVaga(l.vaga);
      return ret(l.x, l.z, f.footprint, LOT_TOP, f.markerY - 1.5);
    }),
    ...casas.map((c) => ret(c.x, c.z, FILLER_HOUSES[0].footprint, LOT_TOP, 5)),
    ...carros.map((c) => ret(c.x, c.z, [2.1, 4.3], LOT_TOP, 1.6)),
  ];
  const spots = lotes.map((l): VagaSpot => {
    const f = facadeDaVaga(l.vaga);
    return spot(l, f.markerY, f.footprint);
  });
  // O Bairro Remoto fica do outro lado da ponte, na mesma cena.
  const bairro = gerarVila(rioX, remotas);

  return montar({
    id: cidade.id,
    tipo: "cidade",
    nome: cidade.nome,
    uf: cidade.uf,
    vagas: [...vagas, ...remotas],
    centrosX,
    centrosZ,
    ruasX,
    ruasZ,
    larguraRua: RUA_CIDADE,
    urbano,
    praca,
    estacionamento,
    lotes: [...lotes, ...bairro.lotes],
    casas,
    carros,
    rio: { x: rioX, ...RIO },
    ponte,
    colina: bairro.colina,
    vila: bairro.vila,
    portal: null,
    nascimento: {
      // Na esquina da praça mais perto do centro (a (0, 2) da cidade original).
      praca: { x: praca.x + PASSO / 2, z: praca.z - PASSO / 2 + 2 },
      ponte: { x: ponte.x0 - 2, z: 0 },
      vila: bairro.chegada,
    },
    limites: {
      minX: urbano.minX - 15,
      maxX: bairro.vila.urbano.maxX + 15,
      minZ: Math.min(urbano.minZ, bairro.vila.urbano.minZ) - 15,
      maxZ: Math.max(urbano.maxZ, bairro.vila.urbano.maxZ) + 15,
    },
    spots: [...spots, ...bairro.spots],
    colisores: [...colisores, ...bairro.colisores],
  });
}

/**
 * Planalto a leste do rio com uma casa por vaga remota (4 por quarteirão). Patrocinada
 * ocupa um quarteirão inteiro com a torre, nos primeiros quarteirões (perto da ponte).
 */
function gerarVila(rioX: number, vagas: readonly VagaNacional[]) {
  const colina = { inicio: rioX + COLINA.inicioRio, fim: rioX + COLINA.fimRio, altura: COLINA.altura };
  const patrocinadas = vagas.filter((v) => destaqueAtivo(v));
  const comuns = vagas.filter((v) => !destaqueAtivo(v));
  // Primeira coluna da vila em fim da colina + 12 (x = 120 com o rio em 86, como a vila original).
  const { centrosX, centrosZ, ordem } = prefixoDaRede(
    { x: colina.fim + 12, z: 10 },
    Math.max(4, patrocinadas.length + Math.ceil(comuns.length / CASAS_REMOTAS.length)),
    colina.fim + 12,
  );
  const posicoes = ordem
    .slice(patrocinadas.length)
    .flatMap((b) => CASAS_REMOTAS.map(([dx, dz]) => ({ x: b.x + dx, z: b.z + dz })));
  const lotes: Lote[] = [
    ...patrocinadas.map((vaga, i) => ({ vaga, x: ordem[i].x, z: ordem[i].z, y: colina.altura })),
    ...comuns.map((vaga, i) => ({ vaga, x: posicoes[i].x, z: posicoes[i].z, y: colina.altura })),
  ];
  const vila: Vila = {
    centrosX,
    centrosZ,
    ruasX: [centrosX[0] - PASSO / 2, ...centrosX.map((c) => c + PASSO / 2)],
    ruasZ: [centrosZ[0] - PASSO / 2, ...centrosZ.map((c) => c + PASSO / 2)],
    larguraRua: RUA_VILA,
    urbano: {
      minX: colina.fim,
      maxX: centrosX.at(-1)! + QUARTEIRAO / 2 + 5,
      minZ: centrosZ[0] - QUARTEIRAO / 2 - 5,
      maxZ: centrosZ.at(-1)! + QUARTEIRAO / 2 + 5,
    },
  };
  return {
    colina,
    vila,
    lotes,
    // Sem origem: chega na primeira rua da vila (o (130, 2) da vila original).
    chegada: { x: centrosX[0] + PASSO / 2, z: 2 },
    spots: lotes.map((l) => {
      const f = facadeDaVaga(l.vaga);
      return spot(l, f.markerY, f.footprint);
    }),
    colisores: lotes.map((l) => {
      const f = facadeDaVaga(l.vaga);
      return ret(l.x, l.z, f.footprint, l.y, f === REMOTE_HOUSE ? 5 : f.markerY - 1.5);
    }),
  };
}

function gerarRemoto(todas: readonly VagaNacional[]): Mundo {
  const vagas = todas.filter((v) => v.modelo === "remoto");
  const rioX = RIO_REMOTO_X;
  const bairro = gerarVila(rioX, vagas);
  const { vila } = bairro;
  const ponte = { x0: rioX - PONTE.meiaComprimento, x1: rioX + PONTE.meiaComprimento, meiaLargura: PONTE.meiaLargura, topo: PONTE.topo };

  return montar({
    id: "remoto",
    tipo: "remoto",
    nome: "Bairro Remoto",
    uf: null,
    vagas,
    centrosX: vila.centrosX,
    centrosZ: vila.centrosZ,
    ruasX: vila.ruasX,
    ruasZ: vila.ruasZ,
    larguraRua: RUA_VILA,
    urbano: vila.urbano,
    praca: null,
    estacionamento: null,
    lotes: bairro.lotes,
    casas: [],
    carros: [],
    rio: { x: rioX, ...RIO },
    ponte,
    colina: bairro.colina,
    vila,
    portal: { minX: -Infinity, maxX: ponte.x0 - 3, minZ: -4, maxZ: 4 },
    nascimento: { praca: bairro.chegada, ponte: { x: ponte.x1 + 2, z: 0 }, vila: bairro.chegada },
    limites: {
      minX: ponte.x0 - 8,
      maxX: vila.urbano.maxX + 15,
      minZ: Math.min(vila.urbano.minZ - 15, -30),
      maxZ: Math.max(vila.urbano.maxZ + 15, 30),
    },
    spots: bairro.spots,
    colisores: bairro.colisores,
  });
}

function spot(l: Lote, markerY: number, footprint: readonly [number, number]): VagaSpot {
  return {
    id: l.vaga.id,
    x: l.x,
    baseY: l.y,
    y: l.y + markerY,
    z: l.z,
    radius: Math.max(...footprint) / 2 + 5,
    size: Math.hypot(...footprint) / 2,
    aberta: l.vaga.status === "aberta",
    modelo: l.vaga.modelo,
    destaque: destaqueAtivo(l.vaga),
  };
}

type Dados = Omit<
  Mundo,
  "alturaDoChao" | "alturaDoPasso" | "bloqueado" | "dentroDePredio" | "vagaProxima" | "noPortal" | "naVila"
>;

/** Junta os dados às funções de terreno, colisão e interação. */
function montar(d: Dados): Mundo {
  const { rio, ponte, colina, praca, colisores, spots, limites, portal } = d;
  const metadeQuarteirao = QUARTEIRAO / 2;
  const naPonte = (x: number, z: number) => x >= ponte.x0 && x <= ponte.x1 && Math.abs(z) <= ponte.meiaLargura;
  const alturaDoChao = (x: number) => {
    const morro = colina ? smoothstep(colina.inicio, colina.fim, x) * colina.altura : 0;
    const leito = (1 - smoothstep(rio.meiaLargura - 1, rio.meiaLargura + 2, Math.abs(x - rio.x))) * rio.profundidade;
    return morro - leito;
  };
  const sobreQuarteirao = (x: number, z: number) =>
    d.tipo === "cidade" &&
    d.centrosX.some((c) => Math.abs(x - c) <= metadeQuarteirao) &&
    d.centrosZ.some((c) => Math.abs(z - c) <= metadeQuarteirao);
  const agua = (x: number, z: number) => !naPonte(x, z) && alturaDoChao(x) < rio.aguaY + 0.1;
  const sobrePredio = (x: number, z: number, raio: number) =>
    colisores.some((c) => Math.abs(x - c.x) < c.hw + raio && Math.abs(z - c.z) < c.hd + raio);

  return {
    ...d,
    alturaDoChao,
    alturaDoPasso: (x, z) => {
      if (naPonte(x, z)) return Math.max(ponte.topo, alturaDoChao(x));
      if (sobreQuarteirao(x, z)) return LOT_TOP;
      return alturaDoChao(x);
    },
    bloqueado: (x, z, raio) => {
      if (x < limites.minX || x > limites.maxX || z < limites.minZ || z > limites.maxZ) return true;
      if (agua(x, z)) return true;
      if (praca && Math.hypot(x - praca.x, z - praca.z) < FONTE_RAIO + raio) return true;
      return sobrePredio(x, z, raio);
    },
    dentroDePredio: (x, y, z, folga) =>
      colisores.some(
        (c) =>
          y < c.top + folga &&
          y > c.bottom - folga &&
          Math.abs(x - c.x) < c.hw + folga &&
          Math.abs(z - c.z) < c.hd + folga,
      ),
    vagaProxima: (x, z) => {
      let melhor: string | null = null;
      let melhorDist = Infinity;
      for (const s of spots) {
        const dist = Math.hypot(s.x - x, s.z - z);
        if (dist <= s.radius && dist < melhorDist) {
          melhor = s.id;
          melhorDist = dist;
        }
      }
      return melhor;
    },
    noPortal: (x, z) => portal !== null && x >= portal.minX && x <= portal.maxX && z >= portal.minZ && z <= portal.maxZ,
    naVila: (x) => d.vila !== null && x > rio.x,
  };
}

// ── Mundos do mock, memorizados ─────────────────────────────────────────
const cache = new Map<string, Mundo>();

export function mundoDaCidade(id: string): Mundo | null {
  const cidade = cidades.find((c) => c.id === id);
  if (!cidade) return null;
  let mundo = cache.get(id);
  if (!mundo) {
    mundo = gerarMundo({ tipo: "cidade", cidade, vagas: vagasBrasil });
    cache.set(id, mundo);
  }
  return mundo;
}

export function mundoRemoto(): Mundo {
  let mundo = cache.get("remoto");
  if (!mundo) {
    mundo = gerarMundo({ tipo: "remoto", vagas: vagasBrasil });
    cache.set("remoto", mundo);
  }
  return mundo;
}
