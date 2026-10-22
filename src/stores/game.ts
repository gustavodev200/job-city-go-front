"use client";

import { create } from "zustand";

const MIN_DISTANCE = 7;
const MAX_DISTANCE = 40;
const ZOOM_STEP = 3;

type GameState = {
  selectedVagaId: string | null;
  nearbyVagaId: string | null;
  cameraDistance: number;
  selectVaga: (id: string | null) => void;
  setNearbyVaga: (id: string | null) => void;
  zoom: (direction: 1 | -1) => void;
};

export const useGameStore = create<GameState>()((set) => ({
  selectedVagaId: null,
  nearbyVagaId: null,
  cameraDistance: 15,
  selectVaga: (selectedVagaId) => set({ selectedVagaId }),
  setNearbyVaga: (nearbyVagaId) =>
    set((state) => ({
      nearbyVagaId,
      // Ao se afastar da vaga, o painel de detalhes fecha.
      selectedVagaId: state.selectedVagaId === nearbyVagaId ? state.selectedVagaId : null,
    })),
  zoom: (direction) =>
    set((state) => ({
      cameraDistance: Math.min(
        MAX_DISTANCE,
        Math.max(MIN_DISTANCE, state.cameraDistance + direction * ZOOM_STEP),
      ),
    })),
}));
