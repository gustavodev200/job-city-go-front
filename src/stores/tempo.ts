"use client";

import { useEffect } from "react";
import { create } from "zustand";

/** Relógio real atualiza a cada 30 s, não a cada quadro. */
const INTERVALO_MS = 30_000;

/** Hora local do dispositivo (fuso do navegador) de 0 a 24, ex.: 14,5 = 14h30. */
export function horaDoDispositivo() {
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

type TempoState = {
  horaReal: number;
  /** Hora escolhida no slider de testes (null = segue a hora real). */
  horaManual: number | null;
  sincronizar: () => void;
  definirHora: (hora: number) => void;
  usarHoraReal: () => void;
};

export const useTempoStore = create<TempoState>()((set) => ({
  horaReal: 12,
  horaManual: null,
  sincronizar: () => set({ horaReal: horaDoDispositivo() }),
  definirHora: (horaManual) => set({ horaManual }),
  usarHoraReal: () => set({ horaManual: null, horaReal: horaDoDispositivo() }),
}));

export const selecionarHora = (s: TempoState) => s.horaManual ?? s.horaReal;

/** Mantém `horaReal` em dia enquanto o componente estiver montado. */
export function useRelogioReal() {
  useEffect(() => {
    const { sincronizar } = useTempoStore.getState();
    sincronizar();
    const id = window.setInterval(sincronizar, INTERVALO_MS);
    return () => window.clearInterval(id);
  }, []);
}
