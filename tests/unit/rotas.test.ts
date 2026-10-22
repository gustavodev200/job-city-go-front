import { describe, expect, it } from "vitest";
import { AvisoSchema, hrefEstado, UfParamSchema } from "@/lib/brasil/rotas";

describe("rotas do mapa", () => {
  it("aceita sigla minúscula válida e devolve maiúscula", () => {
    expect(UfParamSchema.parse("go")).toBe("GO");
    expect(UfParamSchema.parse("df")).toBe("DF");
  });

  it.each(["GO", "xx", "goias", "", "g", "g1"])("rejeita %j", (valor) => {
    expect(UfParamSchema.safeParse(valor).success).toBe(false);
  });

  it("aviso conhecido passa e desconhecido vira undefined", () => {
    expect(AvisoSchema.parse("estado")).toBe("estado");
    expect(AvisoSchema.parse("<script>")).toBeUndefined();
    expect(AvisoSchema.parse(undefined)).toBeUndefined();
  });

  it("monta o href do estado em minúsculas", () => {
    expect(hrefEstado("SP")).toBe("/estado/sp");
  });
});
