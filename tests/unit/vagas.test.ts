import { describe, expect, it } from "vitest";
import { cidades } from "@/data/brasil/cidades";
import { UFS } from "@/data/brasil/estados";
import { gerarVagasBrasil, vagasBrasil } from "@/data/brasil/vagas";
import { CATEGORIA_LABEL, vagas as vagasCidadeAtual } from "@/data/vagas";

const cidadePorId = new Map(cidades.map((c) => [c.id, c]));

describe("vagas nacionais (mock)", () => {
  it("é determinística", () => {
    expect(gerarVagasBrasil()).toEqual(vagasBrasil);
  });

  it("tem escala mínima: ≥ 600 vagas e ≥ 80 cidades com vaga", () => {
    expect(vagasBrasil.length).toBeGreaterThanOrEqual(600);
    expect(new Set(vagasBrasil.map((v) => v.cidadeId).filter(Boolean)).size).toBeGreaterThanOrEqual(80);
  });

  it("toda UF tem pelo menos 5 vagas abertas na cidade", () => {
    for (const uf of UFS) {
      const abertas = vagasBrasil.filter((v) => v.uf === uf && v.cidadeId && v.status === "aberta");
      expect(abertas.length, uf).toBeGreaterThanOrEqual(5);
    }
  });

  it("mantém as vagas escritas à mão com o mesmo id", () => {
    const ids = new Set(vagasBrasil.map((v) => v.id));
    for (const v of vagasCidadeAtual) expect(ids.has(v.id), v.id).toBe(true);
  });

  it("ids são únicos", () => {
    expect(new Set(vagasBrasil.map((v) => v.id)).size).toBe(vagasBrasil.length);
  });

  it("presencial/híbrida aponta para cidade existente da mesma UF; remota não tem cidade", () => {
    for (const v of vagasBrasil) {
      if (v.modelo === "remoto") {
        expect(v.cidadeId, v.id).toBeNull();
        continue;
      }
      const cidade = cidadePorId.get(v.cidadeId ?? "");
      expect(cidade, v.id).toBeDefined();
      expect(cidade?.uf, v.id).toBe(v.uf);
      expect(Object.keys(CATEGORIA_LABEL)).toContain(v.categoria);
    }
  });
});
