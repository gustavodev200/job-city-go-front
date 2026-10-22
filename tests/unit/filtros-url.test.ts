import { describe, expect, it } from "vitest";
import { FILTRO_VAZIO, type FiltroBusca } from "@/lib/busca/filtro";
import { filtroDeParams, filtroParaParams, mesclarQuery } from "@/lib/busca/url";

const ler = (query: string) => filtroDeParams(new URLSearchParams(query));
const f = (parcial: Partial<FiltroBusca>): FiltroBusca => ({
  ...FILTRO_VAZIO,
  ...parcial,
});

describe("filtros na URL (contracts/filtros-url.md)", () => {
  it("ida e volta", () => {
    const filtro = f({
      texto: "médico",
      categorias: ["comercio", "saude"],
      modelos: ["hibrido"],
      salario: { min: 2500 },
      somenteComSalario: true,
      turnos: ["noite"],
      contratos: ["clt", "pj"],
      interior: true,
      perto: { cidadeId: "anapolis-go", raioKm: 100 },
      incluirRemotas: false,
      ordem: "recentes",
    });
    const query = new URLSearchParams(filtroParaParams(filtro)).toString();
    expect(ler(query)).toEqual(filtro);
    expect(filtroParaParams(filtro).map(([k]) => k)).toEqual([
      "q",
      "cat",
      "mod",
      "sal",
      "comsal",
      "turno",
      "contrato",
      "interior",
      "perto",
      "raio",
      "remotas",
      "ordem",
    ]);
  });

  it("filtro vazio não escreve nada", () => {
    expect(filtroParaParams(FILTRO_VAZIO)).toEqual([]);
    expect(ler("")).toEqual(FILTRO_VAZIO);
  });

  it("listas: desconhecidos descartados, sem repetição, ordem canônica", () => {
    expect(ler("cat=saude,xyz,comercio,saude").categorias).toEqual(["comercio", "saude"]);
    expect(ler("turno=madrugada").turnos).toEqual([]);
  });

  it("cada valor inválido é ignorado sem derrubar os outros", () => {
    const r = ler(`q=${"a".repeat(61)}&cat=saude&sal=5000-1000&raio=7&perto=anapolis-go&ordem=xyz&comsal=sim`);
    expect(r.texto).toBe("");
    expect(r.categorias).toEqual(["saude"]);
    expect(r.salario).toEqual({});
    expect(r.perto).toEqual({ cidadeId: "anapolis-go", raioKm: 50 });
    expect(r.ordem).toBeNull();
    expect(r.somenteComSalario).toBe(false);
  });

  it("salário com um lado só; fora do limite ignorado", () => {
    expect(ler("sal=2500-").salario).toEqual({ min: 2500 });
    expect(ler("sal=-4000").salario).toEqual({ max: 4000 });
    expect(ler("sal=0-200000").salario).toEqual({});
    expect(ler("sal=abc").salario).toEqual({});
  });

  it("cidade inexistente em perto → sem perto de mim", () => {
    expect(ler("perto=atlantida-xx&raio=10").perto).toBeNull();
    expect(ler("perto=../../etc").perto).toBeNull();
  });

  it("mesclarQuery preserva parâmetros que não são de filtro", () => {
    const q = mesclarQuery("?cidade=anapolis-go&vaga=vg-004&cat=obra", f({ categorias: ["saude"] }));
    expect(q).toBe("?cidade=anapolis-go&vaga=vg-004&cat=saude");
    expect(mesclarQuery("?cat=obra", FILTRO_VAZIO)).toBe("");
  });
});
