import { describe, expect, it } from "vitest";
import { UFS } from "@/data/brasil/estados";
import { construirMalhaRelevo } from "@/lib/brasil/geo";

describe("malha do relevo", () => {
  const malha = construirMalhaRelevo();

  it("cabe no orçamento de 80 mil triângulos", () => {
    expect(malha.indices.length / 3).toBeLessThan(80_000);
  });

  it("vértices de cada UF são contíguos e cobrem a malha toda", () => {
    let esperado = 0;
    for (const uf of UFS) {
      const [inicio, fim] = malha.faixasPorUf[uf];
      expect(inicio, uf).toBe(esperado);
      expect(fim, uf).toBeGreaterThan(inicio);
      esperado = fim;
    }
    expect(esperado).toBe(malha.posicoes.length / 3);
  });
});
