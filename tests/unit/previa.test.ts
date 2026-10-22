import { describe, expect, it } from "vitest";
import { vagasBrasil } from "@/data/brasil/vagas";
import { calcularPorCidade } from "@/lib/brasil/agregados";
import { previaDaCidade } from "@/lib/brasil/previa";
import { cidadePorId } from "@/lib/brasil/rotas";

const AGREGADO_CIDADE = calcularPorCidade(vagasBrasil);

const total = (id: string) => AGREGADO_CIDADE.get(id)!.abertas + AGREGADO_CIDADE.get(id)!.encerradas;
const maior = [...AGREGADO_CIDADE.keys()].sort((a, b) => total(b) - total(a))[0];

describe("previaDaCidade", () => {
  it("uma construção por vaga da cidade, até 40, com excedente", () => {
    const p = previaDaCidade(cidadePorId.get(maior)!, vagasBrasil);
    expect(p.construcoes.length).toBe(Math.min(40, total(maior)));
    expect(p.excedente).toBe(Math.max(0, total(maior) - 40));
  });

  it("excedente aparece quando passa do limite", () => {
    const p = previaDaCidade(cidadePorId.get("goiania-go")!, vagasBrasil, 3);
    expect(p.construcoes).toHaveLength(3);
    expect(p.excedente).toBe(total("goiania-go") - 3);
  });

  it("abertas antes de encerradas", () => {
    const p = previaDaCidade(cidadePorId.get(maior)!, vagasBrasil, 1000);
    const primeiraEncerrada = p.construcoes.findIndex((c) => !c.aberta);
    if (primeiraEncerrada >= 0) expect(p.construcoes.slice(primeiraEncerrada).every((c) => !c.aberta)).toBe(true);
  });

  it("posições determinísticas e distintas", () => {
    const cidade = cidadePorId.get("goiania-go")!;
    const a = previaDaCidade(cidade, vagasBrasil);
    expect(previaDaCidade(cidade, vagasBrasil)).toEqual(a);
    const chaves = new Set(a.construcoes.map((c) => `${c.x.toFixed(3)},${c.z.toFixed(3)}`));
    expect(chaves.size).toBe(a.construcoes.length);
  });
});
