"use client";

import { create } from "zustand";

type Posicao = { x: number; z: number };

type GameState = {
  playerPosition: Posicao;
  selectedVagaId: string | null;
  setPlayerPosition: (position: Posicao) => void;
  selectVaga: (id: string | null) => void;
};

export const useGameStore = create<GameState>()((set) => ({
  playerPosition: { x: 0, z: 0 },
  selectedVagaId: null,
  setPlayerPosition: (playerPosition) => set({ playerPosition }),
  selectVaga: (selectedVagaId) => set({ selectedVagaId }),
}));
