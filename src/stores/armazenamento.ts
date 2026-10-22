"use client";

import { useEffect } from "react";
import type { StateStorage } from "zustand/middleware";

const memoria = new Map<string, string>();

/**
 * localStorage quando disponível; senão um mapa em memória (modo privado
 * restrito, armazenamento bloqueado, servidor). Nunca lança.
 */
export function armazenamentoSeguro(): StateStorage {
  return {
    getItem: (nome) => {
      try {
        return window.localStorage.getItem(nome);
      } catch {
        return memoria.get(nome) ?? null;
      }
    },
    setItem: (nome, valor) => {
      try {
        window.localStorage.setItem(nome, valor);
      } catch {
        memoria.set(nome, valor);
      }
    },
    removeItem: (nome) => {
      try {
        window.localStorage.removeItem(nome);
      } catch {
        memoria.delete(nome);
      }
    },
  };
}

type Reidratavel = { persist: { rehydrate: () => Promise<void> | void } };

/** Lê as preferências salvas depois da hidratação do React. */
export function useReidratar(...stores: Reidratavel[]) {
  useEffect(() => {
    for (const store of stores) void store.persist.rehydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stores são módulos estáveis
  }, []);
}
