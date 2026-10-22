import { describe, expect, it } from "vitest";
import { cidades } from "@/data/brasil/cidades";
import { gerarArvores } from "@/lib/brasil/arvores";
import { alturaDaEstrada, estradasBrasil, gerarEstradas, tracado } from "@/lib/brasil/estradas";
import { cidadePorId } from "@/lib/brasil/rotas";

describe("estradas do mapa", () => {
  it("árvore: n − 1 trechos ligam todas as cidades", () => {
    expect(estradasBrasil).toHaveLength(cidades.length - 1);
    const vizinhos = new Map<string, string[]>(cidades.map((c) => [c.id, []]));
    for (const e of estradasBrasil) {
      vizinhos.get(e.a)!.push(e.b);
      vizinhos.get(e.b)!.push(e.a);
    }
    const vistos = new Set([cidades[0].id]);
    const fila = [cidades[0].id];
    while (fila.length) {
      for (const v of vizinhos.get(fila.pop()!)!) {
        if (!vistos.has(v)) {
          vistos.add(v);
          fila.push(v);
        }
      }
    }
    expect(vistos.size).toBe(cidades.length);
  });

  it("rodovias ligam todas as capitais (uma a menos que o número de capitais)", () => {
    const rodovias = estradasBrasil.filter((e) => e.tipo === "rodovia");
    expect(rodovias).toHaveLength(cidades.filter((c) => c.capital).length - 1);
    for (const e of rodovias) expect(cidadePorId.get(e.a)!.capital && cidadePorId.get(e.b)!.capital).toBe(true);
  });

  it("determinística", () => {
    expect(gerarEstradas()).toEqual(estradasBrasil);
  });

  it("traçado vai de ponta a ponta e acompanha o relevo", () => {
    const e = estradasBrasil[0];
    const [a, b] = [cidadePorId.get(e.a)!, cidadePorId.get(e.b)!];
    const pts = tracado(a, b);
    expect(pts[0]).toMatchObject({ x: a.x, z: a.z });
    expect(pts.at(-1)!.x).toBeCloseTo(b.x);
    for (const p of pts) expect(p.y).toBe(alturaDaEstrada(p.x, p.z));
  });
});

describe("árvores do mapa", () => {
  it("determinísticas, longe dos centros das cidades", () => {
    const a = gerarArvores();
    expect(a.length).toBeGreaterThan(1000);
    expect(gerarArvores()).toEqual(a);
    for (const c of cidades) expect(a.some((t) => Math.hypot(t.x - c.x, t.z - c.z) < 1)).toBe(false);
  });
});
