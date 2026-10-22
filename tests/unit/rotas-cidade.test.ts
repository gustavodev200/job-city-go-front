import { describe, expect, it } from "vitest";
import { CidadeParamSchema, cidadeFocoSchema, hrefCidade, hrefEstado, itensDaTrilha } from "@/lib/brasil/rotas";

describe("rotas de cidade", () => {
  it("CidadeParamSchema aceita só cidade existente em formato de slug", () => {
    expect(CidadeParamSchema.safeParse("anapolis-go").success).toBe(true);
    for (const ruim of ["nao-existe", "Anapolis-GO", "../x", "", "a".repeat(80)]) {
      expect(CidadeParamSchema.safeParse(ruim).success, ruim).toBe(false);
    }
  });

  it("cidadeFocoSchema aceita só cidade da UF; o resto vira undefined", () => {
    const go = cidadeFocoSchema("GO");
    expect(go.parse("anapolis-go")).toBe("anapolis-go");
    expect(go.parse("campinas-sp")).toBeUndefined();
    expect(go.parse("<script>")).toBeUndefined();
    expect(go.parse(undefined)).toBeUndefined();
  });

  it("hrefs", () => {
    expect(hrefEstado("GO")).toBe("/estado/go");
    expect(hrefEstado("GO", "anapolis-go")).toBe("/estado/go?cidade=anapolis-go");
    expect(hrefCidade("anapolis-go")).toBe("/cidade/anapolis-go");
  });

  it("itensDaTrilha segue o contrato", () => {
    expect(itensDaTrilha({})).toEqual([{ rotulo: "Brasil", href: null }]);
    expect(itensDaTrilha({ uf: "GO" })).toEqual([
      { rotulo: "Brasil", href: "/" },
      { rotulo: "Goiás", href: null },
    ]);
    expect(itensDaTrilha({ cidadeId: "anapolis-go" })).toEqual([
      { rotulo: "Brasil", href: "/" },
      { rotulo: "Goiás", href: "/estado/go?cidade=anapolis-go" },
      { rotulo: "Anápolis", href: null },
    ]);
    expect(itensDaTrilha({ remoto: true })).toEqual([
      { rotulo: "Brasil", href: "/" },
      { rotulo: "Bairro Remoto", href: null },
    ]);
  });
});
