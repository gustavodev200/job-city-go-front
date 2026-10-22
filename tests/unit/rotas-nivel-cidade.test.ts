import { describe, expect, it } from "vitest";
import { ChegadaSchema, DeSchema, hrefCidade, hrefRemoto, vagaSchema } from "@/lib/brasil/rotas";

describe("parâmetros do nível Cidade", () => {
  it("?chegada só aceita ponte", () => {
    expect(ChegadaSchema.parse("ponte")).toBe("ponte");
    expect(ChegadaSchema.parse("praia")).toBeUndefined();
    expect(ChegadaSchema.parse(undefined)).toBeUndefined();
  });

  it("?de só aceita cidade existente", () => {
    expect(DeSchema.parse("anapolis-go")).toBe("anapolis-go");
    expect(DeSchema.parse("xx")).toBeUndefined();
    expect(DeSchema.parse("../anapolis-go")).toBeUndefined();
  });

  it("?vaga só aceita vaga do mundo", () => {
    const schema = vagaSchema(new Set(["vg-001"]));
    expect(schema.parse("vg-001")).toBe("vg-001");
    expect(schema.parse("vg-999")).toBeUndefined();
    expect(schema.parse("<x>")).toBeUndefined();
  });

  it("hrefs", () => {
    expect(hrefCidade("anapolis-go")).toBe("/cidade/anapolis-go");
    expect(hrefCidade("anapolis-go", { chegada: "ponte" })).toBe("/cidade/anapolis-go?chegada=ponte");
    expect(hrefRemoto()).toBe("/remoto");
    expect(hrefRemoto("anapolis-go")).toBe("/remoto?de=anapolis-go");
  });
});
