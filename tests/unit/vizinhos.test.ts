import { describe, expect, it } from "vitest";
import { cidades } from "@/data/brasil/cidades";
import { UFS, VIZINHOS } from "@/data/brasil/estados";
import { GRADE, ufDaCelula } from "@/lib/brasil/geo";

/**
 * Pares de UFs com células a até 2 células de distância na grade. Fronteiras curtas
 * (ex.: AC–RO) somem na grade de 0,2° — por isso a lista é escrita à mão (research R7).
 */
function paresNaGrade() {
  const pares = new Set<string>();
  for (let lin = 0; lin < GRADE.altura; lin++) {
    for (let col = 0; col < GRADE.largura; col++) {
      const a = ufDaCelula(col, lin);
      if (!a) continue;
      for (let dl = 0; dl <= 2; dl++) {
        for (let dc = -2; dc <= 2; dc++) {
          const b = ufDaCelula(col + dc, lin + dl);
          if (b && b !== a) pares.add([a, b].sort().join("-"));
        }
      }
    }
  }
  return pares;
}

describe("estados vizinhos", () => {
  it("relação simétrica, sem auto-referência, toda UF com vizinho", () => {
    for (const uf of UFS) {
      expect(VIZINHOS[uf].length, uf).toBeGreaterThan(0);
      expect(VIZINHOS[uf], uf).not.toContain(uf);
      for (const v of VIZINHOS[uf]) expect(VIZINHOS[v], `${uf}→${v}`).toContain(uf);
    }
  });

  it("todo par vizinho encosta na grade do mapa", () => {
    const pares = paresNaGrade();
    for (const uf of UFS) {
      for (const v of VIZINHOS[uf]) expect(pares.has([uf, v].sort().join("-")), `${uf}-${v}`).toBe(true);
    }
  });

  it("toda UF tem pelo menos 2 cidades", () => {
    for (const uf of UFS) {
      expect(cidades.filter((c) => c.uf === uf).length, uf).toBeGreaterThanOrEqual(2);
    }
  });
});
