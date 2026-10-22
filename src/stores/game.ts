"use client";

import { create } from "zustand";
import { AREAS, type Area } from "@/data/mapa";

const MIN_DISTANCE = 7;
const MAX_DISTANCE = 40;
const ZOOM_STEP = 3;

/** Viagem pedida pelos botões "Ir para…"; o Player anima até o destino. */
export type Travel = { area: Area; x: number; z: number };

type GameState = {
  selectedVagaId: string | null;
  nearbyVagaId: string | null;
  cameraDistance: number;
  travel: Travel | null;
  selectVaga: (id: string | null) => void;
  setNearbyVaga: (id: string | null) => void;
  zoom: (direction: 1 | -1) => void;
  travelTo: (area: Area) => void;
  finishTravel: () => void;
};

export const useGameStore = create<GameState>()((set) => ({
  selectedVagaId: null,
  nearbyVagaId: null,
  cameraDistance: 15,
  travel: null,
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
  travelTo: (area) => set({ travel: { area, ...AREAS[area] }, selectedVagaId: null }),
  finishTravel: () => set({ travel: null }),
}));
