import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { cidades } from "@/data/brasil/cidades";
import { UFS } from "@/data/brasil/estados";
import { gerarVagasBrasil, vagasBrasil } from "@/data/brasil/vagas";
import {
  CATEGORIA_LABEL,
  ORDEM_CONTRATOS,
  ORDEM_TURNOS,
  REFERENCIA_MOCK,
  vagas as vagasCidadeAtual,
} from "@/data/vagas";

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

  it("DF tem vagas em Brasília e em regiões administrativas", () => {
    const doDf = new Set(vagasBrasil.filter((v) => v.uf === "DF").map((v) => v.cidadeId).filter(Boolean));
    expect(doDf.has("brasilia-df")).toBe(true);
    expect(doDf.size).toBeGreaterThanOrEqual(2);
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

describe("campos da busca (spec 004)", () => {
  const abertas = vagasBrasil.filter((v) => v.status === "aberta");

  it("não altera ids, cidades, status, modelo e categoria das specs 001–003", () => {
    const s = vagasBrasil
      .map((v) => [v.id, v.status, v.cidadeId, v.uf, v.modelo, v.modelo === "remoto" ? "" : v.categoria].join("|"))
      .join("\n");
    expect(`${vagasBrasil.length} ${createHash("sha256").update(s).digest("hex")}`).toBe(
      "714 746a9e6335c471db4584ba305ae54875c2c2761767e42d4e090dd1f0efc78989",
    );
  });

  it("cada turno e contrato aparece em ≥ 10 vagas abertas", () => {
    for (const t of ORDEM_TURNOS) expect(abertas.filter((v) => v.turno === t).length, t).toBeGreaterThanOrEqual(10);
    for (const c of ORDEM_CONTRATOS) expect(abertas.filter((v) => v.contrato === c).length, c).toBeGreaterThanOrEqual(10);
  });

  it("≥ 10% sem salário; com salário, 0 < min ≤ max ≤ 100 000", () => {
    expect(vagasBrasil.filter((v) => !v.faixaSalarial).length / vagasBrasil.length).toBeGreaterThanOrEqual(0.1);
    for (const v of vagasBrasil) {
      if (!v.faixaSalarial) continue;
      expect(v.faixaSalarial.min, v.id).toBeGreaterThan(0);
      expect(v.faixaSalarial.min, v.id).toBeLessThanOrEqual(v.faixaSalarial.max);
      expect(v.faixaSalarial.max, v.id).toBeLessThanOrEqual(100_000);
    }
  });

  it("publicação nos 60 dias até a referência do mock", () => {
    for (const v of vagasBrasil) {
      expect(v.publicadaEm, v.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(v.publicadaEm <= REFERENCIA_MOCK, v.id).toBe(true);
      expect(v.publicadaEm >= "2026-08-03", v.id).toBe(true);
    }
  });

  it("diasPorSemana coerente com o texto da frequência", () => {
    const hibridas = vagasBrasil.filter((v) => v.modelo === "hibrido");
    for (const v of hibridas) {
      if (v.modelo !== "hibrido") continue;
      const esperado = v.frequencia.includes("vez por mês") ? 0.25 : Number(v.frequencia.match(/^(\d+) dias?/)?.[1]);
      expect(v.diasPorSemana, v.id).toBe(esperado);
    }
    expect(hibridas.some((v) => v.modelo === "hibrido" && v.diasPorSemana <= 1)).toBe(true);
    expect(hibridas.some((v) => v.modelo === "hibrido" && v.diasPorSemana > 1)).toBe(true);
  });

  it("remotas nunca em escala; existe aberta Saúde + CLT + noite", () => {
    expect(vagasBrasil.some((v) => v.modelo === "remoto" && v.turno === "escala")).toBe(false);
    expect(
      abertas.some((v) => v.modelo !== "remoto" && v.categoria === "saude" && v.contrato === "clt" && v.turno === "noite"),
    ).toBe(true);
  });
});
