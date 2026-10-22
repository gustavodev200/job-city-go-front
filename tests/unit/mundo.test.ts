import { describe, expect, it } from "vitest";
import { cidades } from "@/data/brasil/cidades";
import type { Cidade } from "@/data/brasil/tipos";
import { vagasBrasil, type VagaNacional } from "@/data/brasil/vagas";
import { gerarMundo, mundoDaCidade, mundoRemoto, type Mundo } from "@/lib/cidade/mundo";

const FICTICIA: Cidade = {
  id: "teste-go",
  ibge: null,
  nome: "Teste",
  uf: "GO",
  lat: -16,
  lon: -49,
  x: 0,
  z: 0,
  capital: false,
  porte: "media",
};
const modelo = vagasBrasil.find((v) => v.modelo === "presencial")!;

/** `n` vagas presenciais sintéticas na cidade fictícia. */
const sinteticas = (n: number): VagaNacional[] =>
  Array.from({ length: n }, (_, i) => ({
    ...modelo,
    id: `sint-${String(i).padStart(4, "0")}`,
    cidadeId: FICTICIA.id,
    status: i % 7 === 0 ? "encerrada" : "aberta",
  }));

const cidadeCom = (n: number) => gerarMundo({ tipo: "cidade", cidade: FICTICIA, vagas: sinteticas(n) });

function lotesNaoSobrepostos(m: Mundo) {
  const chaves = m.lotes.map((l) => `${l.x},${l.z}`);
  expect(new Set(chaves).size).toBe(chaves.length);
  if (m.praca) expect(chaves).not.toContain(`${m.praca.x},${m.praca.z}`);
  if (m.estacionamento) expect(chaves).not.toContain(`${m.estacionamento.x},${m.estacionamento.z}`);
}

describe("gerarMundo — cidade", () => {
  it("toda vaga da cidade em exatamente um lote, nenhuma de outra cidade (SC-002)", () => {
    for (const c of cidades) {
      const m = mundoDaCidade(c.id)!;
      const esperadas = vagasBrasil.filter((v) => v.cidadeId === c.id && v.modelo !== "remoto").map((v) => v.id);
      expect(m.lotes.map((l) => l.vaga.id).sort(), c.id).toEqual(esperadas.sort());
      lotesNaoSobrepostos(m);
    }
  });

  it("praça fixa em (−10, 10); nasce na esquina (0, 2); rio 23 além da borda leste", () => {
    const m = mundoDaCidade("goiania-go")!;
    expect(m.praca).toEqual({ x: -10, z: 10 });
    expect(m.nascimento.praca).toEqual({ x: 0, z: 2 });
    expect(m.rio.x).toBe(m.urbano.maxX + 23);
    expect(m.ruasZ).toContain(0);
  });

  it("tamanho acompanha as vagas, mínimo 3×3 (≥ 2×2)", () => {
    const lado = (m: Mundo) => Math.max(m.centrosX.length, m.centrosZ.length);
    expect(cidadeCom(0).centrosX.length).toBeGreaterThanOrEqual(3);
    expect(cidadeCom(1).centrosZ.length).toBeGreaterThanOrEqual(3);
    expect(lado(cidadeCom(3))).toBe(3);
    expect(lado(cidadeCom(28))).toBeLessThanOrEqual(8);
    const grande = cidadeCom(150);
    expect(lado(grande)).toBeLessThanOrEqual(16);
    expect(grande.lotes).toHaveLength(150);
    lotesNaoSobrepostos(grande);
  });

  it("cidade pequena não fica vazia: casas decorativas nos quarteirões livres", () => {
    const m = cidadeCom(1);
    expect(m.casas.length).toBeGreaterThan(0);
  });

  it("estável: mesma entrada, mesmo mundo; vaga nova no fim não move as outras (FR-002)", () => {
    const a = cidadeCom(20);
    const b = cidadeCom(20);
    expect(b.lotes.map((l) => [l.vaga.id, l.x, l.z])).toEqual(a.lotes.map((l) => [l.vaga.id, l.x, l.z]));
    for (const n of [21, 40, 150]) {
      expect(cidadeCom(n).lotes.slice(0, 20).map((l) => [l.x, l.z]), String(n)).toEqual(a.lotes.map((l) => [l.x, l.z]));
    }
    const c = cidadeCom(21);
    expect(c.lotes.slice(0, 20).map((l) => [l.x, l.z])).toEqual(a.lotes.map((l) => [l.x, l.z]));
  });

  it("colisão: fora dos limites, água fora da ponte, prédio e fonte bloqueiam; ponte e ruas não", () => {
    const m = mundoDaCidade("goiania-go")!;
    expect(m.bloqueado(m.limites.maxX + 1, 0, 0.4)).toBe(true);
    expect(m.bloqueado(m.rio.x, 20, 0.4)).toBe(true);
    expect(m.bloqueado(m.rio.x, 0, 0.4)).toBe(false);
    const lote = m.lotes[0];
    expect(m.bloqueado(lote.x, lote.z, 0.4)).toBe(true);
    expect(m.bloqueado(m.praca!.x, m.praca!.z, 0.4)).toBe(true);
    expect(m.bloqueado(m.nascimento.praca.x, m.nascimento.praca.z, 0.4)).toBe(false);
    expect(m.bloqueado(m.nascimento.ponte.x, m.nascimento.ponte.z, 0.4)).toBe(false);
    expect(m.noPortal(m.nascimento.ponte.x, m.nascimento.ponte.z)).toBe(false);
    expect(m.noPortal(m.ponte.x1 + 4, 0)).toBe(true);
    expect(m.alturaDoPasso(m.rio.x, 0)).toBeCloseTo(m.ponte.topo);
  });

  it("gera 150 vagas em menos de 5 ms", () => {
    const vagas = sinteticas(150);
    gerarMundo({ tipo: "cidade", cidade: FICTICIA, vagas });
    const inicio = performance.now();
    for (let i = 0; i < 10; i++) gerarMundo({ tipo: "cidade", cidade: FICTICIA, vagas });
    expect((performance.now() - inicio) / 10).toBeLessThan(5);
  });
});

describe("gerarMundo — Bairro Remoto", () => {
  it("todas e somente as remotas (FR-007)", () => {
    const m = mundoRemoto();
    const remotas = vagasBrasil.filter((v) => v.modelo === "remoto").map((v) => v.id);
    expect(m.lotes.map((l) => l.vaga.id).sort()).toEqual(remotas.sort());
    lotesNaoSobrepostos(m);
  });

  it("vila no planalto a leste; portal de volta na margem oeste", () => {
    const m = mundoRemoto();
    expect(m.colina).not.toBeNull();
    for (const l of m.lotes) expect(l.x).toBeGreaterThan(m.colina!.fim);
    expect(m.noPortal(m.ponte.x0 - 4, 0)).toBe(true);
    expect(m.noPortal(m.nascimento.ponte.x, 0)).toBe(false);
    expect(m.bloqueado(m.nascimento.praca.x, m.nascimento.praca.z, 0.4)).toBe(false);
    expect(m.bloqueado(m.nascimento.ponte.x, m.nascimento.ponte.z, 0.4)).toBe(false);
  });

  it("casas não se sobrepõem", () => {
    const m = mundoRemoto();
    for (let i = 0; i < m.colisores.length; i++) {
      for (let j = i + 1; j < m.colisores.length; j++) {
        const a = m.colisores[i];
        const b = m.colisores[j];
        expect(Math.abs(a.x - b.x) < a.hw + b.hw && Math.abs(a.z - b.z) < a.hd + b.hd).toBe(false);
      }
    }
  });
});
