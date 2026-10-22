import { describe, expect, it } from "vitest";
import { vagasBrasil, type VagaNacional } from "@/data/brasil/vagas";
import { calcularPorUf } from "@/lib/brasil/agregados";
import { sugerirAfrouxar } from "@/lib/busca/afrouxar";
import { contarAtivos, FILTRO_VAZIO, filtrarVagas, passaNoFiltro, type FiltroBusca } from "@/lib/busca/filtro";
import { noRecorte } from "@/lib/busca/recorte";

const f = (parcial: Partial<FiltroBusca>): FiltroBusca => ({ ...FILTRO_VAZIO, ...parcial });
const vaga = (id: string) => vagasBrasil.find((v) => v.id === id)!;
const comSalario = (v: VagaNacional, min: number, max: number): VagaNacional => ({ ...v, faixaSalarial: { min, max } });

describe("passaNoFiltro (research R5)", () => {
  it("sem filtro, tudo passa", () => {
    expect(filtrarVagas(vagasBrasil, FILTRO_VAZIO)).toHaveLength(vagasBrasil.length);
    expect(contarAtivos(FILTRO_VAZIO)).toBe(0);
  });

  it("texto ignora acento e maiúsculas, em título ou empresa", () => {
    const v = { ...vaga("vg-012"), titulo: "Médico(a) Clínico" };
    expect(passaNoFiltro(v, f({ texto: "medico" }))).toBe(true);
    expect(passaNoFiltro(v, f({ texto: "VILA verde" }))).toBe(true);
    expect(passaNoFiltro(v, f({ texto: "pedreiro" }))).toBe(false);
  });

  it("salário por sobreposição: 2000–3200 aparece em 2500–4000", () => {
    const v = comSalario(vaga("vg-002"), 2000, 3200);
    expect(passaNoFiltro(v, f({ salario: { min: 2500, max: 4000 } }))).toBe(true);
    expect(passaNoFiltro(v, f({ salario: { min: 3300 } }))).toBe(false);
    expect(passaNoFiltro(v, f({ salario: { max: 1900 } }))).toBe(false);
  });

  it("sem salário passa, salvo 'Somente com salário informado'", () => {
    const v: VagaNacional = { ...vaga("vg-002"), faixaSalarial: undefined };
    expect(passaNoFiltro(v, f({ salario: { min: 2500 } }))).toBe(true);
    expect(passaNoFiltro(v, f({ somenteComSalario: true }))).toBe(false);
  });

  it("categoria marcada exclui remotas; modalidade, turno e contrato por OU", () => {
    expect(passaNoFiltro(vaga("vg-032"), f({ categorias: ["escritorio"] }))).toBe(false);
    expect(passaNoFiltro(vaga("vg-012"), f({ categorias: ["saude", "obra"] }))).toBe(true);
    expect(passaNoFiltro(vaga("vg-012"), f({ modelos: ["remoto"] }))).toBe(false);
    expect(passaNoFiltro(vaga("vg-012"), f({ turnos: ["noite", "escala"] }))).toBe(true);
    expect(passaNoFiltro(vaga("vg-012"), f({ contratos: ["pj"] }))).toBe(false);
  });

  it("'Posso morar no interior': remotas e híbridas até 1 dia/semana", () => {
    const filtro = f({ interior: true });
    expect(passaNoFiltro(vaga("vg-032"), filtro)).toBe(true); // remota
    expect(passaNoFiltro(vaga("vg-011"), filtro)).toBe(true); // híbrida 1 dia
    expect(passaNoFiltro(vaga("vg-007"), filtro)).toBe(false); // híbrida 2 dias
    expect(passaNoFiltro(vaga("vg-001"), filtro)).toBe(false); // presencial
    for (const v of filtrarVagas(vagasBrasil, filtro)) {
      expect(v.modelo === "remoto" || (v.modelo === "hibrido" && v.diasPorSemana <= 1), v.id).toBe(true);
    }
  });

  it("grupos combinam por E: Saúde + CLT + noite", () => {
    const filtro = f({ categorias: ["saude"], contratos: ["clt"], turnos: ["noite"] });
    const lista = filtrarVagas(vagasBrasil, filtro);
    expect(lista.length).toBeGreaterThan(0);
    for (const v of lista) {
      expect(v.modelo !== "remoto" && v.categoria === "saude" && v.contrato === "clt" && v.turno === "noite").toBe(true);
    }
    expect(contarAtivos(filtro)).toBe(3);
    // Contagens do mapa sobre a lista filtrada batem com a contagem manual (FR-005).
    const go = lista.filter((v) => v.uf === "GO" && v.status === "aberta").length;
    expect(calcularPorUf(lista).GO.abertas).toBe(go);
  });

  it("filtrar + agregar o mock completo leva < 5 ms (SC-002)", () => {
    const filtro = f({ categorias: ["saude"], contratos: ["clt"], texto: "a" });
    filtrarVagas(vagasBrasil, filtro);
    const inicio = performance.now();
    for (let i = 0; i < 20; i++) calcularPorUf(filtrarVagas(vagasBrasil, filtro));
    expect((performance.now() - inicio) / 20).toBeLessThan(5);
  });
});

describe("sugerirAfrouxar", () => {
  it("aponta o filtro cuja remoção traz mais vagas", () => {
    const filtro = f({ texto: "zzzz", categorias: ["saude"] });
    expect(filtrarVagas(vagasBrasil, filtro)).toHaveLength(0);
    const s = sugerirAfrouxar(vagasBrasil, filtro, { tipo: "brasil" });
    expect(s?.grupo).toBe("texto");
    expect(s?.rotulo).toBe('Busca "zzzz"');
    expect(s?.total).toBe(filtrarVagas(vagasBrasil, f({ categorias: ["saude"] })).length);
  });

  it("rótulo do valor único e null quando nada ajuda", () => {
    const doRecorte = vagasBrasil.filter((v) => noRecorte(v, { tipo: "remoto" }));
    const s = sugerirAfrouxar(doRecorte, f({ turnos: ["escala"] }), { tipo: "remoto" });
    expect(s?.rotulo).toBe("Escala");
    expect(sugerirAfrouxar(vagasBrasil, FILTRO_VAZIO, { tipo: "brasil" })).toBeNull();
  });
});
