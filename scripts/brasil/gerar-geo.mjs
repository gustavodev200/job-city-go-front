#!/usr/bin/env node
// Gera src/data/brasil/geo.json e src/data/brasil/cidades.ts a partir de fontes
// públicas (MIT). Formato: specs/001-mapa-brasil/contracts/geo-brasil.md.
// Uso: node scripts/brasil/gerar-geo.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CACHE = join(RAIZ, "scripts", "brasil", ".cache");
const SAIDA_GEO = join(RAIZ, "src", "data", "brasil", "geo.json");
const SAIDA_CIDADES = join(RAIZ, "src", "data", "brasil", "cidades.ts");

const FONTES = {
  "brazil-states.geojson":
    "https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/brazil-states.geojson",
  "municipios.csv": "https://raw.githubusercontent.com/kelvins/municipios-brasileiros/main/csv/municipios.csv",
  "estados.csv": "https://raw.githubusercontent.com/kelvins/municipios-brasileiros/main/csv/estados.csv",
};

const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA",
  "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
];
const CODIGOS = "ABCDEFGHIJKLMNOPQRSTUVWXYZa";
const MAR = ".";

const PASSO_LAT = 0.2;
const LAT_REF = -15;
const PASSO_LON = PASSO_LAT / Math.cos((LAT_REF * Math.PI) / 180);
const TOLERANCIA = 0.04;
/** Anéis menores que isto (graus²) são descartados do contorno — ilhotas. */
const AREA_MINIMA = 0.02;
const TAMANHO_MAXIMO = 150 * 1024;
const CREDITOS =
  "Contornos: click_that_hood (MIT, base IBGE). Cidades: kelvins/municipios-brasileiros (MIT).";

function falhar(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

async function baixar(nome) {
  const caminho = join(CACHE, nome);
  if (!existsSync(caminho)) {
    mkdirSync(CACHE, { recursive: true });
    const resposta = await fetch(FONTES[nome]);
    if (!resposta.ok) falhar(`download de ${nome}: HTTP ${resposta.status}`);
    writeFileSync(caminho, Buffer.from(await resposta.arrayBuffer()));
  }
  // Remove BOM: os CSVs vêm com ele.
  return readFileSync(caminho, "utf8").replace(/^﻿/, "");
}

function lerCsv(texto) {
  const [cabecalho, ...linhas] = texto.trim().split(/\r?\n/);
  const campos = cabecalho.split(",");
  return linhas.map((linha) => Object.fromEntries(linha.split(",").map((v, i) => [campos[i], v])));
}

// ── Geometria ───────────────────────────────────────────────────────────
function areaAnel(anel) {
  let a = 0;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    a += (anel[j][0] + anel[i][0]) * (anel[j][1] - anel[i][1]);
  }
  return Math.abs(a / 2);
}

function distanciaSegmento(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = dx * dx + dy * dy;
  const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

function douglasPeucker(pontos, tolerancia) {
  if (pontos.length < 3) return pontos;
  const manter = new Uint8Array(pontos.length);
  manter[0] = manter[pontos.length - 1] = 1;
  const pilha = [[0, pontos.length - 1]];
  while (pilha.length) {
    const [ini, fim] = pilha.pop();
    let maior = 0;
    let indice = -1;
    for (let i = ini + 1; i < fim; i++) {
      const d = distanciaSegmento(pontos[i], pontos[ini], pontos[fim]);
      if (d > maior) {
        maior = d;
        indice = i;
      }
    }
    if (maior > tolerancia) {
      manter[indice] = 1;
      pilha.push([ini, indice], [indice, fim]);
    }
  }
  return pontos.filter((_, i) => manter[i]);
}

/** Anéis (externos e furos) de um Polygon/MultiPolygon. */
function aneis(geometria) {
  if (geometria.type === "Polygon") return geometria.coordinates;
  if (geometria.type === "MultiPolygon") return geometria.coordinates.flat();
  falhar(`geometria inesperada: ${geometria.type}`);
}

// ── Execução ────────────────────────────────────────────────────────────
const geojson = JSON.parse(await baixar("brazil-states.geojson"));
const municipios = lerCsv(await baixar("municipios.csv"));
const estadosCsv = lerCsv(await baixar("estados.csv"));
const curadas = JSON.parse(readFileSync(join(RAIZ, "scripts", "brasil", "cidades-curadas.json"), "utf8"));

if (!Array.isArray(geojson.features) || geojson.features.length !== 27) falhar("GeoJSON deveria ter 27 estados");
const aneisPorUf = new Map();
for (const feature of geojson.features) {
  const uf = feature.properties?.sigla;
  if (!UFS.includes(uf)) falhar(`sigla desconhecida no GeoJSON: ${uf}`);
  aneisPorUf.set(uf, aneis(feature.geometry));
}
if (aneisPorUf.size !== 27) falhar("GeoJSON com UF repetida");

// Grade: canto noroeste com 1 célula de folga.
let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
for (const lista of aneisPorUf.values()) {
  for (const anel of lista) {
    for (const [lon, lat] of anel) {
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }
  }
}
const lon0 = minLon - PASSO_LON;
const lat0 = maxLat + PASSO_LAT;
const largura = Math.ceil((maxLon - lon0) / PASSO_LON) + 2;
const altura = Math.ceil((lat0 - minLat) / PASSO_LAT) + 2;
const grade = new Int8Array(largura * altura).fill(-1);

// Rasterização por varredura (par-ímpar no centro da célula). UFs em ordem
// alfabética e sem sobrescrever: empate na borda fica com a primeira.
UFS.forEach((uf, indiceUf) => {
  const lista = aneisPorUf.get(uf);
  for (let lin = 0; lin < altura; lin++) {
    const lat = lat0 - lin * PASSO_LAT;
    const cruzamentos = [];
    for (const anel of lista) {
      for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
        const [xi, yi] = anel[i];
        const [xj, yj] = anel[j];
        if (yi > lat !== yj > lat) cruzamentos.push(xi + ((lat - yi) / (yj - yi)) * (xj - xi));
      }
    }
    cruzamentos.sort((a, b) => a - b);
    for (let k = 0; k + 1 < cruzamentos.length; k += 2) {
      const c0 = Math.ceil((cruzamentos[k] - lon0) / PASSO_LON);
      const c1 = Math.floor((cruzamentos[k + 1] - lon0) / PASSO_LON);
      for (let col = Math.max(0, c0); col <= Math.min(largura - 1, c1); col++) {
        const i = lin * largura + col;
        if (grade[i] === -1) grade[i] = indiceUf;
      }
    }
  }
});

// Coordenadas da cena: 1 unidade = 1 célula, origem no centro da grade.
const cx = (largura - 1) / 2;
const cz = (altura - 1) / 2;
const arred = (v) => Math.round(v * 100) / 100;
const projetar = (lon, lat) => [arred((lon - lon0) / PASSO_LON - cx), arred((lat0 - lat) / PASSO_LAT - cz)];

// Distância (em células) até a borda da própria UF — o rótulo vai no ponto mais interno.
const distancia = new Int32Array(largura * altura);
const fila = [];
for (let lin = 0; lin < altura; lin++) {
  for (let col = 0; col < largura; col++) {
    const i = lin * largura + col;
    if (grade[i] === -1) continue;
    const borda = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dc, dl]) => {
      const c = col + dc;
      const l = lin + dl;
      return c < 0 || l < 0 || c >= largura || l >= altura || grade[l * largura + c] !== grade[i];
    });
    distancia[i] = borda ? 1 : 0;
    if (borda) fila.push(i);
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
    if (grade[j] === grade[i] && distancia[j] === 0) {
      distancia[j] = distancia[i] + 1;
      fila.push(j);
    }
  }
}

const ufs = {};
UFS.forEach((uf, indiceUf) => {
  let minC = Infinity, maxC = -Infinity, minL = Infinity, maxL = -Infinity, melhor = -1, celulas = 0;
  for (let i = 0; i < grade.length; i++) {
    if (grade[i] !== indiceUf) continue;
    celulas++;
    const col = i % largura;
    const lin = (i - col) / largura;
    minC = Math.min(minC, col);
    maxC = Math.max(maxC, col);
    minL = Math.min(minL, lin);
    maxL = Math.max(maxL, lin);
    if (melhor === -1 || distancia[i] > distancia[melhor]) melhor = i;
  }
  if (celulas === 0) falhar(`${uf} ficou sem células na grade`);
  const rotuloCol = melhor % largura;
  const rotuloLin = (melhor - rotuloCol) / largura;
  const contorno = aneisPorUf
    .get(uf)
    .filter((anel) => areaAnel(anel) >= AREA_MINIMA)
    .map((anel) => douglasPeucker(anel, TOLERANCIA))
    .filter((anel) => anel.length >= 4)
    .map((anel) => anel.map(([lon, lat]) => projetar(lon, lat)));
  if (contorno.length === 0) falhar(`${uf} ficou sem contorno`);
  ufs[uf] = {
    caixa: [minC - cx - 0.5, minL - cz - 0.5, maxC - cx + 0.5, maxL - cz + 0.5].map(arred),
    rotulo: [arred(rotuloCol - cx), arred(rotuloLin - cz)],
    contorno,
  };
});

const linhas = [];
for (let lin = 0; lin < altura; lin++) {
  let linha = "";
  for (let col = 0; col < largura; col++) {
    const v = grade[lin * largura + col];
    linha += v === -1 ? MAR : CODIGOS[v];
  }
  linhas.push(linha);
}

const geo = {
  versao: 1,
  creditos: CREDITOS,
  grade: {
    lon0,
    lat0,
    passoLon: PASSO_LON,
    passoLat: PASSO_LAT,
    largura,
    altura,
    ufs: UFS.join(""),
    linhas,
  },
  ufs,
};
const json = JSON.stringify(geo);
if (json.length > TAMANHO_MAXIMO) falhar(`geo.json com ${(json.length / 1024).toFixed(0)} KB (máx. 150)`);
writeFileSync(SAIDA_GEO, json + "\n");

// ── Cidades ─────────────────────────────────────────────────────────────
const siglaPorCodigo = new Map(estadosCsv.map((e) => [e.codigo_uf, e.uf]));
const municipioPorIbge = new Map(municipios.map((m) => [Number(m.codigo_ibge), m]));
const slug = (texto) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const cidades = curadas.map(({ ibge, porte }) => {
  const m = municipioPorIbge.get(ibge);
  if (!m) falhar(`código IBGE ${ibge} não existe no CSV`);
  const uf = siglaPorCodigo.get(m.codigo_uf);
  const lat = Number(m.latitude);
  const lon = Number(m.longitude);
  let [x, z] = projetar(lon, lat);
  // Cidades costeiras ou na divisa podem cair no mar ou na UF vizinha: a posição na
  // cena vai para o centro da célula mais próxima da própria UF (lat/lon seguem reais).
  const alvo = UFS.indexOf(uf);
  const col = Math.round(x + cx);
  const lin = Math.round(z + cz);
  if (grade[lin * largura + col] !== alvo) {
    let melhor = null;
    for (let dl = -6; dl <= 6; dl++) {
      for (let dc = -6; dc <= 6; dc++) {
        const c = col + dc;
        const l = lin + dl;
        if (c < 0 || l < 0 || c >= largura || l >= altura || grade[l * largura + c] !== alvo) continue;
        const d = (c - cx - x) ** 2 + (l - cz - z) ** 2;
        if (!melhor || d < melhor.d) melhor = { d, x: c - cx, z: l - cz };
      }
    }
    if (!melhor) falhar(`${m.nome}/${uf} longe demais de qualquer célula da UF`);
    x = arred(melhor.x);
    z = arred(melhor.z);
  }
  return { id: `${slug(m.nome)}-${uf.toLowerCase()}`, ibge, nome: m.nome, uf, lat, lon, x, z, capital: m.capital === "1", porte };
});
cidades.sort((a, b) => a.uf.localeCompare(b.uf) || a.nome.localeCompare(b.nome, "pt-BR"));
if (new Set(cidades.map((c) => c.id)).size !== cidades.length) falhar("id de cidade repetido");

const corpo = cidades
  .map(
    (c) =>
      `  { id: "${c.id}", ibge: ${c.ibge}, nome: "${c.nome}", uf: "${c.uf}", lat: ${c.lat}, lon: ${c.lon}, x: ${c.x}, z: ${c.z}, capital: ${c.capital}, porte: "${c.porte}" },`,
  )
  .join("\n");
writeFileSync(
  SAIDA_CIDADES,
  `// GERADO por scripts/brasil/gerar-geo.mjs — não editar à mão.
// ${CREDITOS}
import type { Cidade } from "./tipos";

export const cidades: Cidade[] = [
${corpo}
];
`,
);

const terra = grade.reduce((n, v) => n + (v === -1 ? 0 : 1), 0);
console.log(
  `✓ ${UFS.length} UFs · grade ${largura}×${altura} · ${terra} células de terra · ${cidades.length} cidades · geo.json ${(json.length / 1024).toFixed(0)} KB`,
);
