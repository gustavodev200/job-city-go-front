import { statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { UFS } from "@/data/brasil/estados";
import { alturaDaCelula, celulaDoPonto, celulaEm, GRADE, projetar, UF_GEO, ufDaCelula } from "@/lib/brasil/geo";

describe("geo do Brasil", () => {
  it("grade tem as dimensões declaradas", () => {
    expect(GRADE.linhas).toHaveLength(GRADE.altura);
    for (const linha of GRADE.linhas) expect(linha).toHaveLength(GRADE.largura);
  });

  it("todas as 27 UFs aparecem na grade e o rótulo cai numa célula da própria UF", () => {
    for (const uf of UFS) {
      const [x, z] = UF_GEO[uf].rotulo;
      expect(celulaEm(x, z), uf).toBe(uf);
    }
  });

  it("caixa de cada UF contém o rótulo", () => {
    for (const uf of UFS) {
      const [minX, minZ, maxX, maxZ] = UF_GEO[uf].caixa;
      const [x, z] = UF_GEO[uf].rotulo;
      expect(x).toBeGreaterThanOrEqual(minX);
      expect(x).toBeLessThanOrEqual(maxX);
      expect(z).toBeGreaterThanOrEqual(minZ);
      expect(z).toBeLessThanOrEqual(maxZ);
    }
  });

  it("Goiânia projeta dentro de GO e o oceano não tem UF", () => {
    const { x, z } = projetar(-49.26, -16.69);
    expect(celulaEm(x, z)).toBe("GO");
    const oceano = projetar(-30, -25);
    expect(celulaEm(oceano.x, oceano.z)).toBeNull();
  });

  it("altura é determinística e fica entre 1 e 6 em terra, 0 no mar", () => {
    for (let lin = 0; lin < GRADE.altura; lin += 7) {
      for (let col = 0; col < GRADE.largura; col += 7) {
        const h = alturaDaCelula(col, lin);
        expect(h).toBe(alturaDaCelula(col, lin));
        if (ufDaCelula(col, lin)) {
          expect(h).toBeGreaterThanOrEqual(1);
          expect(h).toBeLessThanOrEqual(6);
        } else {
          expect(h).toBe(0);
        }
      }
    }
  });

  it("ponto fora da grade não tem célula", () => {
    expect(celulaDoPonto(10_000, 0)).toBeNull();
  });

  it("geo.json cabe no orçamento de 150 KB", () => {
    expect(statSync("src/data/brasil/geo.json").size).toBeLessThanOrEqual(150 * 1024);
  });
});
