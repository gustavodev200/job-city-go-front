import { beforeEach, describe, expect, it } from "vitest";
import { useMapaStore } from "@/stores/mapa";
import { usePerfilStore } from "@/stores/perfil";

const armazenado = new Map<string, string>();

// Ambiente node: simula o localStorage do navegador.
Object.defineProperty(globalThis, "window", {
  value: {
    localStorage: {
      getItem: (k: string) => armazenado.get(k) ?? null,
      setItem: (k: string, v: string) => void armazenado.set(k, v),
      removeItem: (k: string) => void armazenado.delete(k),
    },
  },
  configurable: true,
});

function salvar(chave: string, state: unknown) {
  armazenado.set(chave, JSON.stringify({ state, version: 1 }));
}

describe("preferências salvas", () => {
  beforeEach(() => {
    armazenado.clear();
    useMapaStore.setState({ modo: "luzes" });
    usePerfilStore.setState({ cidadeId: null });
  });

  it("modo válido é restaurado", async () => {
    salvar("jcg:mapa", { modo: "calor" });
    await useMapaStore.persist.rehydrate();
    expect(useMapaStore.getState().modo).toBe("calor");
  });

  it("modo desconhecido volta ao padrão", async () => {
    salvar("jcg:mapa", { modo: "neon" });
    await useMapaStore.persist.rehydrate();
    expect(useMapaStore.getState().modo).toBe("luzes");
  });

  it("JSON corrompido não quebra e mantém o padrão", async () => {
    armazenado.set("jcg:mapa", "{nada");
    await useMapaStore.persist.rehydrate();
    expect(useMapaStore.getState().modo).toBe("luzes");
  });

  it("cidade existente é restaurada; inexistente vira null", async () => {
    salvar("jcg:perfil", { cidadeId: "anapolis-go" });
    await usePerfilStore.persist.rehydrate();
    expect(usePerfilStore.getState().cidadeId).toBe("anapolis-go");

    salvar("jcg:perfil", { cidadeId: "atlantida-xx" });
    await usePerfilStore.persist.rehydrate();
    expect(usePerfilStore.getState().cidadeId).toBeNull();
  });

  it("definirCidade ignora id inválido", () => {
    usePerfilStore.getState().definirCidade("inventada-zz");
    expect(usePerfilStore.getState().cidadeId).toBeNull();
  });

  it("cidade em foco não é salva nem restaurada", async () => {
    useMapaStore.getState().focarCidade("anapolis-go");
    const salvo = JSON.parse(armazenado.get("jcg:mapa") ?? "{}");
    expect(salvo.state).not.toHaveProperty("cidadeEmFoco");

    salvar("jcg:mapa", { modo: "luzes", cidadeEmFoco: "goiania-go" });
    useMapaStore.setState({ cidadeEmFoco: null });
    await useMapaStore.persist.rehydrate();
    expect(useMapaStore.getState().cidadeEmFoco).toBeNull();
  });
});
