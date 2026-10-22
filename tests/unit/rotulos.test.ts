import { describe, expect, it } from "vitest";
import { criarAleatorio } from "@/lib/aleatorio";
import { agruparRotulos, larguraEstimada, type PontoRotulo } from "@/lib/brasil/rotulos";

const ponto = (id: string, sx: number, sy: number, prioridade = 0): PontoRotulo => ({
  id,
  sx,
  sy,
  largura: 80,
  altura: 22,
  prioridade,
});

function aleatorios(n: number, semente: number) {
  const r = criarAleatorio(semente);
  return Array.from({ length: n }, (_, i) => ponto(`c${i}`, r.proximo() * 400, r.proximo() * 300, r.inteiro(0, 20)));
}

describe("agruparRotulos", () => {
  it("todo id aparece em exatamente um grupo", () => {
    const pontos = aleatorios(30, 1);
    const ids = agruparRotulos(pontos).flatMap((g) => g.membros);
    expect(ids.sort()).toEqual(pontos.map((p) => p.id).sort());
  });

  it("líderes nunca se cruzam", () => {
    for (const semente of [1, 2, 3, 4, 5]) {
      const pontos = aleatorios(30, semente);
      const porId = new Map(pontos.map((p) => [p.id, p]));
      const lideres = agruparRotulos(pontos).map((g) => porId.get(g.lider)!);
      for (let i = 0; i < lideres.length; i++) {
        for (let j = i + 1; j < lideres.length; j++) {
          const a = lideres[i];
          const b = lideres[j];
          const cruza =
            Math.abs(a.sx - b.sx) * 2 < a.largura + b.largura && Math.abs(a.sy - b.sy) * 2 < a.altura + b.altura;
          expect(cruza, `${a.id}×${b.id}`).toBe(false);
        }
      }
    }
  });

  it("maior prioridade lidera o grupo", () => {
    const grupos = agruparRotulos([ponto("pequena", 100, 100, 1), ponto("grande", 110, 102, 9)]);
    expect(grupos).toEqual([{ lider: "grande", membros: ["grande", "pequena"] }]);
  });

  it("longe o bastante não agrupa", () => {
    expect(agruparRotulos([ponto("a", 0, 0), ponto("b", 0, 40)])).toHaveLength(2);
  });

  it("independe da ordem de entrada", () => {
    const pontos = aleatorios(20, 7);
    expect(agruparRotulos([...pontos].reverse())).toEqual(agruparRotulos(pontos));
  });

  it("largura estimada cresce com o texto", () => {
    expect(larguraEstimada("Anápolis · 12 vagas")).toBeGreaterThan(larguraEstimada("Gama · 2 vagas"));
  });
});
