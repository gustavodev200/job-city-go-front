import { describe, expect, it } from "vitest";
import { distanciaKm } from "@/lib/brasil/distancia";
import { cidadePorId } from "@/lib/brasil/rotas";

const goiania = cidadePorId.get("goiania-go")!;
const anapolis = cidadePorId.get("anapolis-go")!;

describe("distanciaKm", () => {
  it("Goiânia–Anápolis ≈ 53 km", () => {
    expect(Math.abs(distanciaKm(goiania, anapolis) - 53)).toBeLessThanOrEqual(5);
  });

  it("é simétrica e zero para o mesmo ponto", () => {
    expect(distanciaKm(goiania, anapolis)).toBe(distanciaKm(anapolis, goiania));
    expect(distanciaKm(goiania, goiania)).toBe(0);
  });
});
