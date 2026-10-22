import { describe, expect, it } from "vitest";
import { UFS } from "@/data/brasil/estados";
import { vagasBrasil } from "@/data/brasil/vagas";
import {
  AGREGADO_REMOTO,
  AGREGADO_UF,
  calcularPorUf,
  faixaCalor,
  faixaDe,
  LIMITES_FAIXAS,
} from "@/lib/brasil/agregados";

describe("agregados de vagas", () => {
  it("total por UF = presenciais + híbridas abertas", () => {
    for (const uf of UFS) {
      const esperado = vagasBrasil.filter((v) => v.uf === uf && v.modelo !== "remoto" && v.status === "aberta").length;
      expect(AGREGADO_UF[uf].abertas, uf).toBe(esperado);
      const { presencial, hibrido } = AGREGADO_UF[uf].porModelo;
      expect(presencial + hibrido).toBe(esperado);
    }
  });

  it("vagas encerradas não contam", () => {
    const so = vagasBrasil.filter((v) => v.uf === "GO").map((v) => ({ ...v, status: "encerrada" as const }));
    expect(calcularPorUf(so).GO.abertas).toBe(0);
  });

  it("top categorias tem no máximo 3, em ordem decrescente", () => {
    for (const uf of UFS) {
      const top = AGREGADO_UF[uf].topCategorias;
      expect(top.length).toBeLessThanOrEqual(3);
      for (let i = 1; i < top.length; i++) expect(top[i - 1].total).toBeGreaterThanOrEqual(top[i].total);
    }
  });

  it("faixas de calor ficam entre 0 e 4 e a UF com mais vagas está na faixa 4", () => {
    for (const uf of UFS) expect([0, 1, 2, 3, 4]).toContain(faixaCalor(uf));
    const maior = [...UFS].sort((a, b) => AGREGADO_UF[b].abertas - AGREGADO_UF[a].abertas)[0];
    expect(faixaCalor(maior)).toBe(4);
    expect(faixaDe(0, LIMITES_FAIXAS)).toBe(0);
  });

  it("remotas abertas vão para o Bairro Remoto", () => {
    const esperado = vagasBrasil.filter((v) => v.modelo === "remoto" && v.status === "aberta").length;
    expect(AGREGADO_REMOTO.abertas).toBe(esperado);
    expect(esperado).toBeGreaterThan(0);
  });
});
