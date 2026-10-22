import { describe, expect, it } from "vitest";
import { vagasBrasil, type VagaNacional } from "@/data/brasil/vagas";
import { distanciaKm } from "@/lib/brasil/distancia";
import { projetar } from "@/lib/brasil/geo";
import { cidadePorId } from "@/lib/brasil/rotas";
import { FILTRO_VAZIO, filtrarVagas, passaNoFiltro, type FiltroBusca, type RaioKm } from "@/lib/busca/filtro";
import { ordenarVagas } from "@/lib/busca/ordenar";
import { anelDoRaio, distanciaDaVaga } from "@/lib/busca/perto";

const anapolis = cidadePorId.get("anapolis-go")!;
const perto = (raioKm: RaioKm, extra: Partial<FiltroBusca> = {}): FiltroBusca => ({
  ...FILTRO_VAZIO,
  perto: { cidadeId: "anapolis-go", raioKm },
  ...extra,
});
const cidades = (lista: VagaNacional[]) => new Set(lista.map((v) => v.cidadeId));

describe("perto de mim (US3)", () => {
  it("Anápolis 25 e 50 km: Anápolis sim, Goiânia (52 km) não", () => {
    for (const raio of [25, 50] as const) {
      const ids = cidades(filtrarVagas(vagasBrasil, perto(raio)));
      expect(ids.has("anapolis-go"), String(raio)).toBe(true);
      expect(ids.has("goiania-go"), String(raio)).toBe(false);
    }
  });

  it("50 km: só cidades a até 50 km", () => {
    for (const v of filtrarVagas(vagasBrasil, perto(50))) {
      if (v.modelo === "remoto") continue;
      expect(distanciaKm(anapolis, cidadePorId.get(v.cidadeId!)!), v.id).toBeLessThanOrEqual(50);
    }
  });

  it("100 km: Goiânia entra, ordenada depois de Anápolis", () => {
    const lista = ordenarVagas(filtrarVagas(vagasBrasil, perto(100)), "distancia", { ref: anapolis });
    const abertas = lista.filter((v) => v.status === "aberta" && v.modelo !== "remoto");
    const primeiraGoiania = abertas.findIndex((v) => v.cidadeId === "goiania-go");
    const ultimaAnapolis = abertas.findLastIndex((v) => v.cidadeId === "anapolis-go");
    expect(primeiraGoiania).toBeGreaterThan(ultimaAnapolis);
    expect(distanciaDaVaga(abertas[primeiraGoiania], anapolis)).toBe(52);
  });

  it("remotas: só com 'Incluir remotas' e se a abrangência atende a UF", () => {
    const remota = vagasBrasil.find((v) => v.id === "vg-032")!; // Brasil inteiro
    const soDf = { ...remota, abrangencia: { tipo: "ufs" as const, ufs: ["DF" as const] } };
    expect(passaNoFiltro(remota, perto(10))).toBe(true);
    expect(passaNoFiltro(remota, perto(10, { incluirRemotas: false }))).toBe(false);
    expect(passaNoFiltro(soDf, perto(200))).toBe(false);
    expect(distanciaDaVaga(remota, anapolis)).toBeNull();
  });

  it("anel do raio fecha e tem n + 1 pontos, à distância certa na cena", () => {
    const anel = anelDoRaio(anapolis, 100, 32);
    expect(anel).toHaveLength(33);
    expect(anel[0].x).toBeCloseTo(anel[32].x, 6);
    expect(anel[0].z).toBeCloseTo(anel[32].z, 6);
    const centro = projetar(anapolis.lon, anapolis.lat);
    expect(anel.every((p) => Math.hypot(p.x - centro.x, p.z - centro.z) > 0)).toBe(true);
  });
});
