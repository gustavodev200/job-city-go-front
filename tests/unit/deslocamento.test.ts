import { describe, expect, it } from "vitest";
import { cidadePorId } from "@/lib/brasil/rotas";
import { estimarDeslocamento, textoDeslocamento } from "@/lib/cidade/deslocamento";

const cidade = (id: string) => cidadePorId.get(id)!;

describe("deslocamento estimado", () => {
  it("Trindade → Goiânia ≈ 25 km e 35 min (exemplo da spec)", () => {
    const d = estimarDeslocamento(cidade("trindade-go"), cidade("goiania-go"));
    if (d.mesmaCidade) throw new Error("não deveria ser a mesma cidade");
    expect(Math.abs(d.km - 25)).toBeLessThanOrEqual(3);
    expect(Math.abs(d.minutos - 35)).toBeLessThanOrEqual(5);
    expect(d.minutos % 5).toBe(0);
  });

  it("mesma cidade e mínimo de 10 min", () => {
    expect(estimarDeslocamento(cidade("goiania-go"), cidade("goiania-go"))).toEqual({ mesmaCidade: true });
    const perto = estimarDeslocamento(cidade("goiania-go"), cidade("aparecida-de-goiania-go"));
    if (!perto.mesmaCidade) expect(perto.minutos).toBeGreaterThanOrEqual(10);
  });

  it("textos", () => {
    expect(textoDeslocamento({ mesmaCidade: false, km: 25, minutos: 35 }, "1 dia por semana")).toBe(
      "~25 km · ~35 min de carro · presença 1 dia por semana",
    );
    expect(textoDeslocamento({ mesmaCidade: true })).toBe("Na sua cidade");
  });
});
