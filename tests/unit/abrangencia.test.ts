import { describe, expect, it } from "vitest";
import { atendeAbrangencia, avisoAbrangencia, rotuloAbrangencia } from "@/lib/cidade/abrangencia";

describe("abrangência de vagas remotas", () => {
  it("rótulos", () => {
    expect(rotuloAbrangencia({ tipo: "brasil" })).toBe("Brasil inteiro");
    expect(rotuloAbrangencia({ tipo: "ufs", ufs: ["GO"] })).toBe("Remoto para GO");
    expect(rotuloAbrangencia({ tipo: "ufs", ufs: ["DF", "GO"] })).toBe("Remoto para DF e GO");
    expect(rotuloAbrangencia({ tipo: "fuso", fuso: "brasilia" })).toBe("Fuso de Brasília");
  });

  it("quem atende", () => {
    expect(atendeAbrangencia("AC", { tipo: "brasil" })).toBe(true);
    expect(atendeAbrangencia("GO", { tipo: "ufs", ufs: ["GO"] })).toBe(true);
    expect(atendeAbrangencia("SP", { tipo: "ufs", ufs: ["GO"] })).toBe(false);
    expect(atendeAbrangencia("SP", { tipo: "fuso", fuso: "brasilia" })).toBe(true);
    expect(atendeAbrangencia("AM", { tipo: "fuso", fuso: "brasilia" })).toBe(false);
  });

  it("avisos do contrato", () => {
    expect(avisoAbrangencia("SP", { tipo: "ufs", ufs: ["GO"] })).toBe("Esta vaga pede residência em GO");
    expect(avisoAbrangencia("SP", { tipo: "ufs", ufs: ["DF", "GO"] })).toBe("Esta vaga pede residência em DF ou GO");
    expect(avisoAbrangencia("AC", { tipo: "fuso", fuso: "brasilia" })).toBe("Esta vaga pede o fuso de Brasília");
    expect(avisoAbrangencia("GO", { tipo: "ufs", ufs: ["GO"] })).toBeNull();
    expect(avisoAbrangencia(null, { tipo: "ufs", ufs: ["GO"] })).toBeNull();
  });
});
