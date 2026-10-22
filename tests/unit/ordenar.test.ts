import { describe, expect, it } from "vitest";
import { vagasBrasil, type VagaNacional } from "@/data/brasil/vagas";
import { MAX_PATROCINADAS_SEGUIDAS, ordenarVagas } from "@/lib/busca/ordenar";

const HOJE = "2026-10-22";
const patrocinar = (v: VagaNacional): VagaNacional => ({ ...v, destaque: { ate: "2099-12-31" } });

describe("ordenarVagas (research R6)", () => {
  // 8 patrocinadas no meio do mock para estressar a intercalação.
  const lista = vagasBrasil.slice(0, 60).map((v, i) => (i % 7 === 0 ? patrocinar(v) : v));

  it("nunca mais de 2 patrocinadas seguidas e nenhuma vaga some", () => {
    const ordenada = ordenarVagas(lista, "relevancia", { hoje: HOJE });
    expect(new Set(ordenada.map((v) => v.id))).toEqual(new Set(lista.map((v) => v.id)));
    let seguidas = 0;
    for (const v of ordenada.filter((x) => x.status === "aberta")) {
      seguidas = v.destaque ? seguidas + 1 : 0;
      expect(seguidas).toBeLessThanOrEqual(MAX_PATROCINADAS_SEGUIDAS);
    }
    expect(ordenada[0].destaque).toBeDefined();
  });

  it("abertas antes de encerradas em toda ordem", () => {
    for (const ordem of ["relevancia", "recentes", "salario", "distancia"] as const) {
      const o = ordenarVagas(lista, ordem, { hoje: HOJE });
      const primeiraEncerrada = o.findIndex((v) => v.status === "encerrada");
      expect(o.slice(primeiraEncerrada).every((v) => v.status === "encerrada"), ordem).toBe(true);
    }
  });

  it("mais recentes: publicadaEm decrescente", () => {
    const abertas = ordenarVagas(lista, "recentes").filter((v) => v.status === "aberta");
    for (let i = 1; i < abertas.length; i++) expect(abertas[i - 1].publicadaEm >= abertas[i].publicadaEm).toBe(true);
  });

  it("maior salário: 'A combinar' no fim das abertas", () => {
    const abertas = ordenarVagas(lista, "salario").filter((v) => v.status === "aberta");
    const primeiraSem = abertas.findIndex((v) => !v.faixaSalarial);
    expect(primeiraSem).toBeGreaterThan(0);
    expect(abertas.slice(primeiraSem).every((v) => !v.faixaSalarial)).toBe(true);
    for (let i = 1; i < primeiraSem; i++) {
      expect(abertas[i - 1].faixaSalarial!.max).toBeGreaterThanOrEqual(abertas[i].faixaSalarial!.max);
    }
  });

  it("é estável: mesma entrada, mesma saída", () => {
    expect(ordenarVagas([...lista].reverse(), "recentes")).toEqual(ordenarVagas(lista, "recentes"));
  });
});
