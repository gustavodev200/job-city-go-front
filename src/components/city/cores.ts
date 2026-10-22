import type { Categoria, Modelo } from "@/data/vagas";

/** Work-model colors — shared by the 3D markers, the HUD legend and the job scroll. */
export const MODELO_COLORS: Record<Modelo, string> = {
  presencial: "#f08a24",
  hibrido: "#7b5cff",
  remoto: "#1d9f95",
};

export const MODELO_LABEL: Record<Modelo, string> = {
  presencial: "Presencial",
  hibrido: "Híbrido",
  remoto: "Remoto",
};

/** Category colors — mini-map dots and legend icons. */
export const CATEGORIA_COLORS: Record<Categoria, string> = {
  comercio: "#e8743b",
  escritorio: "#3b8fd0",
  saude: "#2fa25b",
  galpao: "#8d6e4f",
  obra: "#e0b020",
  escola: "#d95f8f",
  bairro: "#8fb43c",
};
