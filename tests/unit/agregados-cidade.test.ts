import { describe, expect, it } from "vitest";
import { cidades } from "@/data/brasil/cidades";
import { UFS } from "@/data/brasil/estados";
import { vagasBrasil } from "@/data/brasil/vagas";
import { AGREGADO_CIDADE, AGREGADO_UF, cidadesDoEstado } from "@/lib/brasil/agregados";

describe("agregado por cidade (SC-004)", () => {
  it("bate com o filtro direto das vagas", () => {
    for (const c of cidades) {
      const daCidade = vagasBrasil.filter((v) => v.cidadeId === c.id);
      const ag = AGREGADO_CIDADE.get(c.id);
      if (daCidade.length === 0) {
        expect(ag, c.id).toBeUndefined();
        continue;
      }
      const abertas = daCidade.filter((v) => v.status === "aberta");
      expect(ag?.abertas, c.id).toBe(abertas.length);
      expect(ag?.encerradas, c.id).toBe(daCidade.length - abertas.length);
      expect(ag?.porModelo.presencial, c.id).toBe(abertas.filter((v) => v.modelo === "presencial").length);
      for (const [cat, n] of Object.entries(ag!.porCategoria)) {
        expect(n, `${c.id}/${cat}`).toBe(abertas.filter((v) => v.modelo !== "remoto" && v.categoria === cat).length);
      }
    }
  });

  it("somas internas fecham", () => {
    for (const ag of AGREGADO_CIDADE.values()) {
      const somaCategorias = Object.values(ag.porCategoria).reduce((s, n) => s + (n ?? 0), 0);
      expect(somaCategorias, ag.cidadeId).toBe(ag.abertas);
      expect(ag.porModelo.presencial + ag.porModelo.hibrido, ag.cidadeId).toBe(ag.abertas);
    }
  });

  it("soma das cidades da UF = total da UF", () => {
    for (const uf of UFS) {
      const soma = cidadesDoEstado(uf).reduce((s, c) => s + AGREGADO_CIDADE.get(c.id)!.abertas, 0);
      expect(soma, uf).toBe(AGREGADO_UF[uf].abertas);
    }
  });

  it("cidadesDoEstado: só cidades com vaga, mais vagas primeiro", () => {
    for (const uf of UFS) {
      const lista = cidadesDoEstado(uf);
      expect(lista.length, uf).toBeGreaterThan(0);
      for (let i = 1; i < lista.length; i++) {
        expect(AGREGADO_CIDADE.get(lista[i - 1].id)!.abertas).toBeGreaterThanOrEqual(
          AGREGADO_CIDADE.get(lista[i].id)!.abertas,
        );
      }
    }
  });
});
